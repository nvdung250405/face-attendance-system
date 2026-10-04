"""Module quản lý hàng đợi ngoại tuyến SQLite chế độ Write-Ahead Logging (WAL).

Tài liệu tham chiếu:
- DATA-KSK-001: offline_punches entity & lifecycle (docs/service-docs/kiosk-app/data/data-specs.md)
- DATA DESIGN: DDL & PRAGMA configuration (docs/service-docs/kiosk-app/data/data-design.md)
- DATA BUILD PLAN: DBL-KSK-001 & DBL-KSK-002 (docs/service-docs/kiosk-app/data/data-build-plan.md)
- Cam kết: Bảo toàn dữ liệu RPO = 0 khi ngắt mạng đột ngột hoặc cúp nguồn.
"""

import sqlite3
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from config.logger import get_logger
from config.settings import settings

logger = get_logger("sqlite_manager")


class SQLiteQueueManager:
    """Quản lý hàng đợi giao dịch điểm danh ngoại tuyến trên SQLite chế độ WAL an toàn."""

    def __init__(self, db_path: Path | None = None, timeout: float = 5.0) -> None:
        """Khởi tạo SQLiteQueueManager.

        Args:
            db_path: Đường dẫn tệp database SQLite (mặc định từ settings: kiosk_local.db).
            timeout: Thời gian chờ tối đa (giây) khi tranh chấp khóa ghi SQLite (mặc định 5.0s).
        """
        self.db_path: Path = db_path or settings.db_path
        self.timeout: float = timeout
        self._lock = threading.Lock()

        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Mở kết nối SQLite mới kèm cấu hình WAL, PRAGMA tối ưu và Row factory."""
        conn = sqlite3.connect(
            str(self.db_path),
            timeout=self.timeout,
            check_same_thread=False,
        )
        conn.row_factory = sqlite3.Row
        # Kích hoạt các chỉ thị PRAGMA tối ưu hóa I/O biên trên mỗi kết nối
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        conn.execute(f"PRAGMA busy_timeout = {int(self.timeout * 1000)};")
        conn.execute("PRAGMA cache_size = -64000;")
        conn.execute("PRAGMA temp_store = MEMORY;")
        return conn

    def _init_db(self) -> None:
        """Khởi tạo cấu trúc bảng dữ liệu, chỉ mục và áp dụng PRAGMA theo chuẩn Data Design."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        with self._lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("PRAGMA journal_mode;")
                journal_mode = cursor.fetchone()[0]

                # Kiểm tra tương thích schema bảng hiện có
                cursor.execute("PRAGMA table_info(offline_punches);")
                existing_cols = [row[1] for row in cursor.fetchall()]
                if existing_cols and ("is_synced" not in existing_cols or "punch_timestamp" not in existing_cols):
                    logger.warning("Phát hiện schema cũ trong %s, thực hiện tái cấu trúc bảng chuẩn...", self.db_path.name)
                    cursor.execute("DROP TABLE offline_punches;")

                # DDL Tạo bảng hàng đợi điểm danh ngoại tuyến theo chuẩn DATA-KSK-001
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS offline_punches (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        employee_id INTEGER NOT NULL,
                        punch_timestamp TEXT NOT NULL,
                        punch_type TEXT NOT NULL DEFAULT 'CHECK_IN',
                        verification_method TEXT NOT NULL DEFAULT 'VERIFICATION_FACE',
                        confidence_score REAL,
                        kiosk_id TEXT NOT NULL,
                        is_synced INTEGER NOT NULL DEFAULT 0,
                        retry_count INTEGER NOT NULL DEFAULT 0,
                        created_at TEXT NOT NULL DEFAULT (datetime('now'))
                    );
                """)

                # Chỉ mục tối ưu hóa cho truy vấn quét các bản ghi chưa đồng bộ
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_offline_sync
                    ON offline_punches(is_synced, id);
                """)

                # Chỉ mục phục vụ thống kê lượt chấm trong ngày tại trạm
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_offline_timestamp
                    ON offline_punches(punch_timestamp DESC);
                """)

                conn.commit()
                logger.info(
                    "SQLiteQueueManager sẵn sàng tại %s [journal_mode=%s, timeout=%.1fs]",
                    self.db_path.name,
                    journal_mode,
                    self.timeout,
                )
            except Exception as exc:
                logger.error("Lỗi khởi tạo SQLite DB tại %s: %s", self.db_path, exc)
                raise
            finally:
                conn.close()

    def get_last_punch_type(self, employee_id: int) -> str | None:
        """Lấy loại điểm danh gần nhất của nhân viên trong ngày hôm nay.

        Args:
            employee_id: Mã định danh nhân viên.

        Returns:
            str | None: 'CHECK_IN', 'CHECK_OUT' hoặc None nếu chưa điểm danh hôm nay.
        """
        today_prefix = datetime.now(UTC).strftime("%Y-%m-%d")
        sql = """
            SELECT punch_type
            FROM offline_punches
            WHERE employee_id = ? AND punch_timestamp LIKE ?
            ORDER BY id DESC
            LIMIT 1
        """
        with self._lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(sql, (employee_id, f"{today_prefix}%"))
                row = cursor.fetchone()
                return str(row["punch_type"]) if row else None
            finally:
                conn.close()

    def enqueue_punch(
        self,
        employee_id: int,
        punch_type: str = "AUTO",
        verification_method: str = "VERIFICATION_FACE",
        confidence_score: float | None = None,
        kiosk_id: str | None = None,
        punch_timestamp: str | None = None,
        # Tương thích ngược với các caller cũ:
        similarity_score: float | None = None,
        punch_time: str | None = None,
        liveness_score: float | None = None,
        punch_id: str | None = None,
    ) -> int:
        """Thêm một lượt điểm danh vào hàng đợi ngoại tuyến với giao dịch commit an toàn.

        Tuân thủ DBL-KSK-002: Ghi đệm giao dịch ngoại tuyến < 5ms.

        Args:
            employee_id: Mã định danh số của nhân viên trong CSDL trung tâm.
            punch_type: Loại điểm danh ('CHECK_IN', 'CHECK_OUT' hoặc 'AUTO' để tự đảo trạng thái).
            verification_method: Phương thức xác thực ('VERIFICATION_FACE' hoặc 'VERIFICATION_PIN').
            confidence_score: Điểm số tương đồng Cosine Similarity (0.0 - 1.0).
            kiosk_id: Mã định danh của trạm Kiosk thực hiện.
            punch_timestamp: Mốc thời gian ISO-8601 tại thời điểm quét.

        Returns:
            int: Khóa chính `id` của bản ghi đã lưu vào CSDL cục bộ.
        """
        # Tự động xác định CHECK_IN hay CHECK_OUT dựa trên lượt điểm danh trước đó trong ngày
        if punch_type in ("AUTO", None, ""):
            last_type = self.get_last_punch_type(employee_id)
            punch_type = "CHECK_OUT" if last_type == "CHECK_IN" else "CHECK_IN"
        elif punch_type in ("FACE", "PIN"):
            verification_method = "VERIFICATION_FACE" if punch_type == "FACE" else "VERIFICATION_PIN"
            last_type = self.get_last_punch_type(employee_id)
            punch_type = "CHECK_OUT" if last_type == "CHECK_IN" else "CHECK_IN"

        p_time = punch_timestamp or punch_time or datetime.now(UTC).isoformat()
        score = confidence_score if confidence_score is not None else similarity_score
        k_id = kiosk_id or settings.kiosk_id

        sql = """
            INSERT INTO offline_punches (
                employee_id, punch_timestamp, punch_type,
                verification_method, confidence_score, kiosk_id,
                is_synced, retry_count
            ) VALUES (?, ?, ?, ?, ?, ?, 0, 0)
        """

        with self._lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(
                    sql,
                    (employee_id, p_time, punch_type, verification_method, score, k_id),
                )
                conn.commit()
                local_id = cursor.lastrowid
                logger.info(
                    "Đã lưu hàng đợi ngoại tuyến: id=%d, emp_id=%d, type=%s, method=%s",
                    local_id,
                    employee_id,
                    punch_type,
                    verification_method,
                )
                return int(local_id)
            except Exception as exc:
                conn.rollback()
                logger.error("Lỗi khi ghi hàng đợi ngoại tuyến emp_id=%d: %s", employee_id, exc)
                raise
            finally:
                conn.close()

    def get_unsynced_punches(self, limit: int = 50) -> list[dict[str, Any]]:
        """Lấy danh sách các bản ghi chưa đồng bộ theo thứ tự phát sinh (FIFO).

        Args:
            limit: Số lượng bản ghi tối đa trong một lô (mặc định 50 bản ghi).

        Returns:
            list[dict[str, Any]]: Danh sách các bản ghi điểm danh chờ gửi lên máy chủ.
        """
        sql = """
            SELECT id, employee_id, punch_timestamp, punch_type,
                   verification_method, confidence_score, kiosk_id,
                   is_synced, retry_count, created_at
            FROM offline_punches
            WHERE is_synced = 0
            ORDER BY id ASC
            LIMIT ?
        """
        with self._lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(sql, (limit,))
                rows = cursor.fetchall()
                results = []
                for row in rows:
                    item = dict(row)
                    # Giữ tương thích ngược với các trường cũ nếu caller cần
                    item["punch_id"] = str(item["id"])
                    item["punch_time"] = item["punch_timestamp"]
                    item["similarity_score"] = item["confidence_score"] or 0.0
                    item["synced_status"] = item["is_synced"]
                    results.append(item)
                return results
            finally:
                conn.close()

    def fetch_pending_batch(self, limit: int = 50) -> list[dict[str, Any]]:
        """Bí danh chuẩn hóa theo DBL-KSK-002 cho get_unsynced_punches."""
        return self.get_unsynced_punches(limit=limit)

    def mark_as_synced(self, local_ids: list[int | str]) -> int:
        """Đánh dấu các bản ghi đã được đồng bộ thành công lên máy chủ trung tâm.

        Args:
            local_ids: Danh sách các ID bản ghi (id khóa chính) đã nhận xác nhận 200 OK.

        Returns:
            int: Số lượng bản ghi được cập nhật trạng thái.
        """
        if not local_ids:
            return 0

        # Chuẩn hóa sang int
        clean_ids = [int(i) for i in local_ids if str(i).isdigit()]
        if not clean_ids:
            return 0

        placeholders = ",".join("?" for _ in clean_ids)
        sql = f"""
            UPDATE offline_punches
            SET is_synced = 1
            WHERE id IN ({placeholders}) AND is_synced = 0
        """
        with self._lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(sql, clean_ids)
                updated_count = cursor.rowcount
                conn.commit()
                logger.info("Đã đánh dấu đồng bộ thành công %d bản ghi", updated_count)
                return updated_count
            except Exception as exc:
                conn.rollback()
                logger.error("Lỗi cập nhật is_synced: %s", exc)
                raise
            finally:
                conn.close()

    def mark_synced(self, local_ids: list[int | str]) -> int:
        """Bí danh chuẩn hóa theo DBL-KSK-002 cho mark_as_synced."""
        return self.mark_as_synced(local_ids)

    def get_unsynced_count(self) -> int:
        """Đếm tổng số bản ghi chưa được đồng bộ trong CSDL cục bộ.

        Returns:
            int: Số lượng bản ghi chờ đồng bộ.
        """
        sql = "SELECT COUNT(*) FROM offline_punches WHERE is_synced = 0"
        with self._lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(sql)
                count = cursor.fetchone()[0]
                return int(count)
            finally:
                conn.close()

    def cleanup_synced_punches(self, retention_days: int = 30) -> int:
        """Xóa vĩnh viễn các bản ghi đã đồng bộ quá hạn lưu trữ quy định.

        Tuân thủ DATA-KSK-001 & data-specs.md: Lưu trữ tối đa 30 ngày phục vụ đối soát.

        Args:
            retention_days: Thời hạn lưu trữ tối đa (mặc định 30 ngày).

        Returns:
            int: Số lượng bản ghi đã được dọn dẹp.
        """
        sql = f"""
            DELETE FROM offline_punches
            WHERE is_synced = 1
              AND created_at < datetime('now', '-{retention_days} days')
        """
        with self._lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(sql)
                deleted_count = cursor.rowcount
                conn.commit()
                if deleted_count > 0:
                    logger.info("Đã xóa vĩnh viễn %d bản ghi đã đồng bộ quá hạn", deleted_count)
                return deleted_count
            finally:
                conn.close()
