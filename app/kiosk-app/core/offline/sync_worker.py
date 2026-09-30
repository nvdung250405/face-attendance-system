"""Luồng nền OfflineSyncWorker đồng bộ dữ liệu điểm danh ngoại tuyến lên máy chủ trung tâm.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-05 - OfflineSyncWorker)
- TP-KIOSK-01 (Mục 6.2 & TC-KIOSK-15)
- DDS.md (Mục 2.1, Mục 3.1 & Mục 4.3 - REST API /api/v1/kiosk/sync-batch)
"""

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
                    "Authorization": f"Bearer {self.secret_token}",
                    "X-Kiosk-Id": self.kiosk_id,
                    "Content-Type": "application/json",
                },
            )
        return self._internal_client

    def _close_client(self) -> None:
        """Đóng kết nối client nội bộ nếu có."""
        if self._internal_client is not None and not self._internal_client.is_closed:
            try:
                self._internal_client.close()
            except Exception:
                pass
            self._internal_client = None

    def check_health(self) -> bool:
        """Kiểm tra độ sẵn sàng và kết nối mạng tới máy chủ backend.

        Returns:
            bool: True nếu máy chủ phản hồi sẵn sàng, ngược lại False.
        """
        client = self._get_client()
        # Thử kiểm tra endpoint actuator/health hoặc kiosk/health
        candidates = [
            f"{self.backend_url}/kiosk/health",
            f"{self.backend_url.replace('/api/v1', '')}/actuator/health",
            f"{self.backend_url}",
        ]

        for url in candidates:
            try:
                response = client.get(url, timeout=3.0)
                if response.status_code in (200, 204):
                    self._update_network_status(True, f"Máy chủ hoạt động bình thường ({url})")
                    return True
            except httpx.RequestError:
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
            rec = {
                "localId": p.get("id"),
                "punchId": p.get("punch_id"),
                "employeeId": p.get("employee_id"),
                "punchTimestamp": p.get("punch_time"),
                "verificationMethod": (
                    "VERIFICATION_FACE"
                    if p.get("punch_type") == "FACE"
                    else "VERIFICATION_PIN"
                ),
                "confidenceScore": p.get("similarity_score"),
                "livenessScore": p.get("liveness_score"),
            }
            records_payload.append(rec)

        payload = {
            "kioskId": self.kiosk_id,
            "batchCount": len(punches),
            "records": records_payload,
        }

        client = self._get_client()
        try:
            response = client.post(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.secret_token}",
                    "X-Kiosk-Id": self.kiosk_id,
                    "Content-Type": "application/json",
                },
                timeout=15.0,
            )

            if response.status_code == 200:
                punch_ids = [p["punch_id"] for p in punches if "punch_id" in p]
                self.queue_manager.mark_as_synced(punch_ids)
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

        while True:
            # Đọc tối đa batch_size bản ghi chưa đồng bộ
            batch = self.queue_manager.get_unsynced_punches(limit=self.batch_size)
            if not batch:
                break

            success = self.sync_batch(batch)
            if not success:
                # Gặp lỗi mạng hoặc máy chủ từ chối, ngừng chu kỳ hiện tại để thử lại sau
                break

            batch_count = len(batch)
            total_synced += batch_count
            remaining = self.queue_manager.get_unsynced_count()
            self.sync_progress.emit(batch_count, remaining)

        return total_synced

    def run(self) -> None:
        """Vòng lặp thực thi của QThread định kỳ quét và đồng bộ ngoại tuyến."""
        self._running = True
        logger.info("OfflineSyncWorker bắt đầu chạy (chu kỳ %.1f giây)", self.interval_seconds)

        while self._running:
            try:
                # Kiểm tra hàng đợi có dữ liệu không
                unsynced_count = self.queue_manager.get_unsynced_count()
                if unsynced_count > 0:
                    self.sync_once()
                else:
                    # Kiểm tra kết nối định kỳ ngay cả khi hàng đợi rỗng
                    self.check_health()
            except Exception as exc:
                logger.error("Lỗi ngoại lệ trong vòng lặp OfflineSyncWorker: %s", exc)
                self._update_network_status(False, str(exc))

            # Ngủ ngắt quãng để phản hồi tín hiệu dừng stop() tức thì
            sleep_slices = max(1, int(self.interval_seconds * 10))
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
