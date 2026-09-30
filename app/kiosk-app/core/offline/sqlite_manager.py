"""Module quản lý hàng đợi ngoại tuyến SQLite chế độ Write-Ahead Logging (WAL).

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-05 - SQLiteQueueManager)
- TP-KIOSK-01 (Mục 6.2 & TC-KIOSK-13, TC-KIOSK-14)
- DDS.md (Mục 2.1 & Quyết định DEC-04: Lưu trữ ngoại tuyến SQLite WAL)
- Cam kết: Bảo toàn dữ liệu RPO = 0 khi ngắt mạng đột ngột hoặc cúp nguồn.
"""

import sqlite3
import threading
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from config.logger import get_logger
from config.settings import settings

logger = get_logger("sqlite_manager")


class SQLiteQueueManager:
    """Quản lý hàng đợi giao dịch điểm danh ngoại tuyến trên SQLite chế độ WAL an toàn."""

    def __init__(self, db_path: Path | None = None, timeout: float = 10.0) -> None:
        """Khởi tạo SQLiteQueueManager.

        Args:
            db_path: Đường dẫn tệp database SQLite (mặc định từ settings: kiosk_local.db).
            timeout: Thời gian chờ tối đa (giây) khi tranh chấp khóa ghi SQLite.
        """
        self.db_path: Path = db_path or settings.db_path
        self.timeout: float = timeout
        self._lock = threading.Lock()

        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Mở kết nối SQLite mới kèm cấu hình WAL và Row factory."""
        conn = sqlite3.connect(
            str(self.db_path),
            timeout=self.timeout,
            check_same_thread=False,
        )
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Khởi tạo cấu trúc bảng dữ liệu và cấu hình PRAGMA chế độ WAL."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        with self._lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                # Kích hoạt chế độ WAL (Write-Ahead Logging) cho phép đọc ghi đồng thời
                cursor.execute("PRAGMA journal_mode=WAL;")
                journal_mode = cursor.fetchone()[0]
                cursor.execute("PRAGMA synchronous=NORMAL;")
                cursor.execute(f"PRAGMA busy_timeout={int(self.timeout * 1000)};")

                # Tạo bảng lưu trữ hàng đợi điểm danh ngoại tuyến
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS offline_punches (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        punch_id TEXT UNIQUE NOT NULL,
                        employee_id INTEGER NOT NULL,
                        punch_time TEXT NOT NULL,
                        punch_type TEXT NOT NULL,
                        similarity_score REAL,
                        liveness_score REAL,
                        kiosk_id TEXT NOT NULL,
                        synced_status INTEGER NOT NULL DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)

                # Chỉ mục tăng tốc độ truy vấn lô chưa đồng bộ
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_punches_synced
                    ON offline_punches(synced_status, id ASC);
                """)

                conn.commit()
                logger.info(
                    "SQLiteQueueManager sẵn sàng tại %s [journal_mode=%s]",
                    self.db_path.name,
                    journal_mode,
                )
            except Exception as exc:
                logger.error("Lỗi khởi tạo SQLite DB tại %s: %s", self.db_path, exc)
                raise
            finally:
                conn.close()

    def enqueue_punch(
        self,
        employee_id: int,
        punch_type: str = "FACE",
        punch_time: str | None = None,
        similarity_score: float = 0.0,
        liveness_score: float = 0.0,
        kiosk_id: str | None = None,
        punch_id: str | None = None,
    ) -> str:
        """Thêm một lượt điểm danh vào hàng đợi ngoại tuyến với giao dịch commit an toàn.

        Args:
            employee_id: Mã định danh nhân viên.
            punch_type: Loại điểm danh ("FACE" hoặc "PIN").
            punch_time: Thời gian điểm danh định dạng ISO-8601 UTC (mặc định lấy thời điểm gọi).
            similarity_score: Điểm tương đồng nhận diện khuôn mặt (nếu dùng FACE).
            liveness_score: Điểm thực thể sống (nếu dùng FACE).
            kiosk_id: Mã trạm Kiosk thực hiện điểm danh.
            punch_id: Mã định danh UUID v4 duy nhất (nếu None sẽ tự sinh mới).

        Returns:
            str: punch_id của bản ghi đã lưu vào hàng đợi.
        """
        p_id = punch_id or str(uuid.uuid4())
        p_time = punch_time or datetime.now(UTC).isoformat()
        k_id = kiosk_id or settings.kiosk_id

        sql = """
            INSERT INTO offline_punches (
                punch_id, employee_id, punch_time, punch_type,
                similarity_score, liveness_score, kiosk_id, synced_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        """

        with self._lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(
                    sql,
                    (p_id, employee_id, p_time, punch_type, similarity_score, liveness_score, k_id),
                )
                conn.commit()
                logger.info(
                    "Đã lưu hàng đợi ngoại tuyến: punch_id=%s, emp_id=%d, type=%s",
                    p_id,
                    employee_id,
                    punch_type,
                )
                return p_id
            except Exception as exc:
                conn.rollback()
                logger.error("Lỗi khi ghi hàng đợi ngoại tuyến punch_id=%s: %s", p_id, exc)
                raise
            finally:
                conn.close()

    def get_unsynced_punches(self, limit: int = 50) -> list[dict[str, Any]]:
        """Lấy danh sách các bản ghi chưa đồng bộ theo thứ tự thời gian phát sinh (FIFO).

        Args:
            limit: Số lượng bản ghi tối đa trong một lô (mặc định 50 bản ghi).

        Returns:
            list[dict[str, Any]]: Danh sách các bản ghi điểm danh chờ gửi lên máy chủ.
        """
        sql = """
            SELECT id, punch_id, employee_id, punch_time, punch_type,
                   similarity_score, liveness_score, kiosk_id
            FROM offline_punches
            WHERE synced_status = 0
            ORDER BY id ASC
            LIMIT ?
        """
        with self._lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(sql, (limit,))
                rows = cursor.fetchall()
                results = [dict(row) for row in rows]
                return results
            finally:
                conn.close()

    def mark_as_synced(self, punch_ids: list[str]) -> int:
        """Đánh dấu các bản ghi đã được đồng bộ thành công lên máy chủ trung tâm.

        Args:
            punch_ids: Danh sách các punch_id đã gửi và nhận xác nhận 200 OK.

        Returns:
            int: Số lượng bản ghi được cập nhật trạng thái.
        """
        if not punch_ids:
            return 0

        placeholders = ",".join("?" for _ in punch_ids)
        sql = f"""
            UPDATE offline_punches
            SET synced_status = 1
            WHERE punch_id IN ({placeholders}) AND synced_status = 0
        """
        with self._lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(sql, punch_ids)
                updated_count = cursor.rowcount
                conn.commit()
                logger.info("Đã đánh dấu đồng bộ thành công %d bản ghi", updated_count)
                return updated_count
            except Exception as exc:
                conn.rollback()
                logger.error("Lỗi cập nhật synced_status: %s", exc)
                raise
            finally:
                conn.close()

    def get_unsynced_count(self) -> int:
        """Đếm tổng số bản ghi chưa được đồng bộ trong CSDL cục bộ.

        Returns:
            int: Số lượng bản ghi chờ đồng bộ.
        """
        sql = "SELECT COUNT(*) FROM offline_punches WHERE synced_status = 0"
        with self._lock:
            conn = self._get_connection()
            try:
                cursor = conn.cursor()
                cursor.execute(sql)
                count = cursor.fetchone()[0]
                return int(count)
            finally:
                conn.close()

    def cleanup_synced_punches(self, retention_days: int = 20) -> int:
        """Xóa vĩnh viễn các bản ghi đã đồng bộ quá hạn lưu trữ quy định.

        Tuân thủ Nghị định 13/2023/NĐ-CP và Luật Bảo vệ dữ liệu cá nhân 2025.

        Args:
            retention_days: Thời hạn lưu trữ tối đa (mặc định 20 ngày).

        Returns:
            int: Số lượng bản ghi đã được dọn dẹp.
        """
        sql = f"""
            DELETE FROM offline_punches
            WHERE synced_status = 1
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
