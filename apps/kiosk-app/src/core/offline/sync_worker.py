"""Luồng nền OfflineSyncWorker đồng bộ dữ liệu điểm danh ngoại tuyến lên máy chủ trung tâm.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-05 - OfflineSyncWorker)
- TP-KIOSK-01 (Mục 6.2 & TC-KIOSK-15)
- DDS.md (Mục 2.1, Mục 3.1 & Mục 4.3 - REST API /api/v1/kiosk/sync-batch)
"""

import email.utils
import random
import time
from datetime import UTC, datetime
from typing import Any

import httpx
from PySide6.QtCore import QObject, QThread, Signal

from config.logger import get_logger
from config.settings import settings
from core.offline.sqlite_manager import SQLiteQueueManager

logger = get_logger("sync_worker")


class OfflineSyncWorker(QThread):
    """Worker QThread định kỳ quét hàng đợi SQLite và gửi bù lô 50 bản ghi lên máy chủ."""

    # Tín hiệu thông báo tiến độ đồng bộ: (số bản ghi vừa đồng bộ, số bản ghi còn tồn đọng)
    sync_progress = Signal(int, int)

    # Tín hiệu thay đổi trạng thái kết nối mạng: (is_online, thông điệp chi tiết)
    network_status_changed = Signal(bool, str)

    def __init__(
        self,
        queue_manager: SQLiteQueueManager | None = None,
        backend_url: str | None = None,
        kiosk_id: str | None = None,
        secret_token: str | None = None,
        interval_seconds: float | None = None,
        batch_size: int | None = None,
        client: httpx.Client | None = None,
        parent: QObject | None = None,
    ) -> None:
        """Khởi tạo OfflineSyncWorker.

        Args:
            queue_manager: Đối tượng quản lý CSDL hàng đợi SQLite WAL.
            backend_url: URL gốc của REST API backend (ví dụ: http://localhost:8080/api/v1).
            kiosk_id: Định danh trạm Kiosk hiện hành.
            secret_token: Khóa bí mật Bearer Token của Kiosk.
            interval_seconds: Chu kỳ quét hàng đợi (mặc định 10 giây).
            batch_size: Kích thước lô gửi tối đa (mặc định 50 bản ghi).
            client: Tuỳ chọn nạp HTTP client (dùng cho unit test mock hoặc tái sử dụng pool).
            parent: QObject cha.
        """
        super().__init__(parent)
        self.queue_manager: SQLiteQueueManager = queue_manager or SQLiteQueueManager()
        self.backend_url: str = (backend_url or settings.backend_url).rstrip("/")
        self.kiosk_id: str = kiosk_id or settings.kiosk_id
        self.secret_token: str = secret_token or settings.kiosk_secret_token
        self.interval_seconds: float = (
            interval_seconds
            if interval_seconds is not None
            else float(settings.sync_interval_seconds)
        )
        self.batch_size: int = batch_size or settings.sync_batch_size
        self._last_cleanup_time: float = 0.0
        self._cleanup_interval_seconds: float = 86400.0  # 24 giờ một lần
        self._fail_count: int = 0
        self.clock_drift_offset: float = 0.0

        self._custom_client = client
        self._internal_client: httpx.Client | None = None
        self._running: bool = False
        self._is_online: bool | None = None

    def _get_client(self) -> httpx.Client:
        """Lấy hoặc tạo HTTP client phục vụ gửi request mạng."""
        if self._custom_client is not None:
            return self._custom_client
        if self._internal_client is None or self._internal_client.is_closed:
            self._internal_client = httpx.Client(
                timeout=10.0,
                headers={
                    "X-Kiosk-Secret": self.secret_token,
                    "X-Kiosk-Id": self.kiosk_id,
                    "Content-Type": "application/json",
                },
            )
        return self._internal_client

    @property
    def fail_count(self) -> int:
        """Số lần đồng bộ thất bại liên tiếp."""
        return self._fail_count

    def calculate_backoff_delay(self, fail_count: int | None = None) -> float:
        """Tính toán thời gian chờ theo hàm mũ kèm jitter ngẫu nhiên khi đồng bộ thất bại.

        Công thức: delay = min(self.interval_seconds * (2 ** min(fail_count, 5)), 60.0) * random.uniform(0.8, 1.2)
        """
        fc = self._fail_count if fail_count is None else fail_count
        base = min(self.interval_seconds * (2 ** min(fc, 5)), 60.0)
        return float(base * random.uniform(0.8, 1.2))

    def cleanup_old_punches(self, retention_days: int = 20) -> int:
        """Dọn dẹp các bản ghi đã đồng bộ quá hạn lưu trữ quy định (20 ngày theo Nghị định 356/2025/NĐ-CP)."""
        if hasattr(self.queue_manager, "cleanup_synced_punches"):
            try:
                return self.queue_manager.cleanup_synced_punches(retention_days=retention_days)
            except Exception as exc:
                logger.debug("Lỗi khi dọn dẹp bản ghi điểm danh cũ: %s", exc)
        return 0

    def _check_clock_drift(self, response: httpx.Response) -> None:
        """Phân tích HTTP Date header để cảnh báo độ lệch đồng hồ (clock drift)."""
        date_header = response.headers.get("Date") if hasattr(response, "headers") else None
        if not date_header:
            return
        try:
            server_time = email.utils.parsedate_to_datetime(date_header)
            if server_time.tzinfo is None:
                server_time = server_time.replace(tzinfo=UTC)
            local_time = datetime.now(UTC)
            drift = (local_time - server_time).total_seconds()
            self.clock_drift_offset = drift
            if abs(drift) > 5.0:
                logger.warning(
                    "CẢNH BÁO: Lệch đồng hồ Kiosk và Server vượt ngưỡng 5.0s (độ lệch: %.2fs). Kiosk UTC: %s, Server UTC: %s",
                    drift,
                    local_time.isoformat(),
                    server_time.isoformat(),
                )
        except Exception as exc:
            logger.debug("Lỗi phân tích cú pháp HTTP Date header: %s", exc)

    def _close_client(self) -> None:
        """Đóng kết nối client nội bộ nếu có."""
        if self._internal_client is not None and not self._internal_client.is_closed:
            try:
                self._internal_client.close()
            except Exception as exc:
                logger.debug("Lỗi khi đóng client HTTP nội bộ: %s", exc)
            self._internal_client = None

    def check_health(self) -> bool:
        """Kiểm tra độ sẵn sàng và kết nối mạng tới máy chủ backend.

        Returns:
            bool: True nếu máy chủ phản hồi sẵn sàng, ngược lại False.
        """
        client = self._get_client()
        # Ưu tiên gửi nhịp tim ping kèm header định danh để cập nhật trạng thái trực tuyến
        ping_url = f"{self.backend_url}/kiosk/ping"
        try:
            response = client.post(ping_url, timeout=3.0)
            self._check_clock_drift(response)
            if response.status_code in (200, 204):
                self._update_network_status(True, f"Máy chủ hoạt động bình thường ({ping_url})")
                return True
        except httpx.RequestError as exc:
            logger.debug("Ping kiểm tra máy chủ thất bại: %s", exc)

        # Thử kiểm tra endpoint actuator/health hoặc kiosk/health
        candidates = [
            f"{self.backend_url}/kiosk/health",
            f"{self.backend_url.replace('/api/v1', '')}/actuator/health",
            f"{self.backend_url}",
        ]

        for url in candidates:
            try:
                response = client.get(url, timeout=3.0)
                self._check_clock_drift(response)
                if response.status_code in (200, 204):
                    self._update_network_status(True, f"Máy chủ hoạt động bình thường ({url})")
                    return True
            except httpx.RequestError as exc:
                logger.debug("Kiểm tra candidate health thất bại (%s): %s", url, exc)
                continue

        self._update_network_status(False, "Không thể kết nối đến máy chủ backend")
        return False

    def _update_network_status(self, is_online: bool, message: str) -> None:
        """Cập nhật và phát tín hiệu thay đổi trạng thái mạng khi có biến động."""
        if self._is_online != is_online:
            self._is_online = is_online
            self.network_status_changed.emit(is_online, message)
            logger.info("Trạng thái mạng Kiosk thay đổi: online=%s (%s)", is_online, message)

    def sync_batch(self, punches: list[dict[str, Any]]) -> bool:
        """Gửi một lô bản ghi điểm danh ngoại tuyến lên endpoint /api/v1/kiosk/sync-batch.

        Args:
            punches: Danh sách tối đa 50 bản ghi điểm danh từ SQLite WAL.

        Returns:
            bool: True nếu máy chủ xác nhận 200 OK thành công, ngược lại False.
        """
        if not punches:
            return True

        url = f"{self.backend_url}/kiosk/sync-batch"
        records_payload = []
        for p in punches:
            raw_time = p.get("punch_timestamp") or p.get("punch_time")
            if isinstance(raw_time, str) and not raw_time.endswith("Z") and "+" not in raw_time:
                try:
                    dt = datetime.fromisoformat(raw_time).astimezone()
                    iso_time = dt.isoformat()
                except Exception as exc:
                    logger.debug("Lỗi phân tích iso_time (%s): %s", raw_time, exc)
                    iso_time = datetime.now(UTC).isoformat()
            elif isinstance(raw_time, datetime):
                iso_time = raw_time.isoformat()
            else:
                iso_time = str(raw_time) if raw_time else datetime.now(UTC).isoformat()

            raw_method = p.get("verification_method", "VERIFICATION_FACE")
            if raw_method == "FACE":
                method = "VERIFICATION_FACE"
            elif raw_method == "PIN":
                method = "VERIFICATION_PIN"
            elif raw_method in ("VERIFICATION_FACE", "VERIFICATION_PIN"):
                method = raw_method
            else:
                method = "VERIFICATION_FACE"

            raw_score = (
                p.get("confidence_score")
                if p.get("confidence_score") is not None
                else p.get("similarity_score")
            )
            score = round(float(raw_score), 4) if raw_score is not None else 0.85

            rec = {
                "localQueueId": int(p.get("id")),
                "localId": p.get("id"),
                "employeeId": int(p.get("employee_id")),
                "punchTimestamp": iso_time,
                "punchType": p.get("punch_type"),
                "verificationMethod": method,
                "confidenceScore": score,
            }
            records_payload.append(rec)

        payload = {
            "batchCount": len(records_payload),
            "records": records_payload,
        }

        client = self._get_client()
        try:
            response = client.post(
                url,
                json=payload,
                headers={
                    "X-Kiosk-Secret": self.secret_token,
                    "X-Kiosk-Id": self.kiosk_id,
                    "Content-Type": "application/json",
                },
                timeout=15.0,
            )
            self._check_clock_drift(response)

            if response.status_code == 200:
                all_ids = [p["id"] for p in punches if "id" in p]
                try:
                    body = response.json()
                except Exception as exc:
                    logger.debug("Phản hồi sync-batch không phải JSON: %s", exc)
                    body = {}
                data = body.get("data") if isinstance(body, dict) else None
                data = data or {}
                synced_ids = data.get("syncedLocalIds") or []
                failed_ids = data.get("failedLocalIds") or []

                if synced_ids or failed_ids:
                    # Backend trả kết quả theo từng bản ghi: chỉ tin 2 danh sách này.
                    clean_synced = [int(i) for i in synced_ids]
                    clean_failed = [int(i) for i in failed_ids]
                    if clean_synced:
                        self.queue_manager.mark_as_synced(clean_synced)
                    if clean_failed:
                        logger.warning(
                            "Backend từ chối vĩnh viễn %d bản ghi (failedLocalIds=%s); "
                            "đánh dấu đã đồng bộ để không chặn hàng đợi",
                            len(clean_failed),
                            clean_failed,
                        )
                        self.queue_manager.mark_as_synced(clean_failed)
                    # Các id không xuất hiện trong cả 2 danh sách vẫn giữ is_synced=0 để retry.
                else:
                    # Phản hồi 200 không kèm chi tiết từng bản ghi: toàn lô được chấp nhận.
                    self.queue_manager.mark_as_synced(all_ids)

                self._update_network_status(True, "Đồng bộ lô ngoại tuyến thành công")
                logger.info(
                    "Đồng bộ thành công lô %d bản ghi lên backend %s",
                    len(punches),
                    url,
                )
                return True
            else:
                msg = f"Máy chủ trả về mã lỗi HTTP {response.status_code}: {response.text}"
                logger.warning(msg)
                self._update_network_status(False, msg)
                return False

        except httpx.RequestError as exc:
            msg = f"Lỗi mạng khi gửi lô đồng bộ: {exc}"
            logger.warning(msg)
            self._update_network_status(False, msg)
            return False

    def sync_once(self) -> int:
        """Thực hiện một chu kỳ đồng bộ toàn bộ các lô tồn đọng trong CSDL cục bộ.

        Returns:
            int: Tổng số bản ghi đã được đồng bộ thành công trong chu kỳ này.
        """
        total_synced = 0
        sync_failed = False

        while True:
            # Đọc tối đa batch_size bản ghi chưa đồng bộ
            batch = self.queue_manager.get_unsynced_punches(limit=self.batch_size)
            if not batch:
                break

            success = self.sync_batch(batch)
            if not success:
                # Gặp lỗi mạng hoặc máy chủ từ chối, ngừng chu kỳ hiện tại để thử lại sau
                sync_failed = True
                break

            batch_count = len(batch)
            total_synced += batch_count
            remaining = self.queue_manager.get_unsynced_count()
            self.sync_progress.emit(batch_count, remaining)

        if sync_failed:
            self._fail_count += 1
        else:
            self._fail_count = 0

        return total_synced

    def run(self) -> None:
        """Vòng lặp thực thi của QThread định kỳ quét và đồng bộ ngoại tuyến."""
        self._running = True
        logger.info("OfflineSyncWorker bắt đầu chạy (chu kỳ %.1f giây)", self.interval_seconds)

        while self._running:
            # Định kỳ kích hoạt dọn dẹp các bản ghi đã đồng bộ quá hạn 20 ngày
            now = time.time()
            if now - self._last_cleanup_time >= self._cleanup_interval_seconds:
                cleaned = self.cleanup_old_punches(retention_days=20)
                if cleaned > 0:
                    logger.info("Đã dọn dẹp %d bản ghi đã đồng bộ quá hạn 20 ngày", cleaned)
                self._last_cleanup_time = now

            try:
                # Kiểm tra hàng đợi có dữ liệu không
                unsynced_count = self.queue_manager.get_unsynced_count()
                if unsynced_count > 0:
                    self.sync_once()
                else:
                    # Kiểm tra kết nối định kỳ ngay cả khi hàng đợi rỗng
                    self.check_health()
            except Exception as exc:
                self._fail_count += 1
                logger.error("Lỗi ngoại lệ trong vòng lặp OfflineSyncWorker: %s", exc)
                self._update_network_status(False, str(exc))

            # Xác định thời gian chờ: backoff nếu lỗi đồng bộ, ngược lại dùng interval_seconds
            if self._fail_count > 0:
                delay = self.calculate_backoff_delay(self._fail_count)
                logger.debug(
                    "Đồng bộ lỗi (lần %d), chờ lui hàm mũ: %.2fs",
                    self._fail_count,
                    delay,
                )
            else:
                delay = self.interval_seconds

            # Ngủ ngắt quãng để phản hồi tín hiệu dừng stop() tức thì
            sleep_slices = max(1, int(delay * 10))
            for _ in range(sleep_slices):
                if not self._running:
                    break
                self.msleep(100)

        self._close_client()
        logger.info("OfflineSyncWorker đã dừng an toàn.")

    def stop(self) -> None:
        """Dừng luồng nền một cách an toàn và chờ kết thúc."""
        self._running = False
        self.wait(5000)
        self._close_client()
