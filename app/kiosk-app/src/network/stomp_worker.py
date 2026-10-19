"""Module luồng nền STOMP Subscriber (KioskStompWorker) nhận thông điệp cập nhật Gallery.

Tài liệu tham chiếu:
- API SPECS: API-KSK-006 - STOMP Topic /topic/kiosk-gallery (docs/service-docs/kiosk-app/api/api-specs.md)
- API DESIGN: APD-KSK-002 & Mục 3 - Thiết kế Kênh WebSocket STOMP (docs/service-docs/kiosk-app/api/api-design.md)
- API BUILD PLAN: ABL-KSK-002 (docs/service-docs/kiosk-app/api/api-build-plan.md)
- FR-KSK-008: Realtime Gallery Hot-Patching (docs/service-docs/kiosk-app/fr-nfr/fr-nfr-specs.md)
"""

import json
from typing import Any
from urllib.parse import urlparse

import numpy as np
from PySide6.QtCore import QObject, QThread, Signal

from config.logger import get_logger
from config.settings import settings
from core.vision.gallery_matcher import GalleryCacheManager

logger = get_logger("stomp_worker")


class KioskStompWorker(QThread):
    """QThread duy trì kết nối STOMP tới Backend, lắng nghe topic /topic/kiosk-gallery."""

    # Tín hiệu phát khi danh mục được nạp nóng: (action: str, employee_id: int)
    gallery_updated = Signal(str, int)

    # Tín hiệu cập nhật trạng thái kết nối STOMP: (is_connected: bool, message: str)
    connection_status_changed = Signal(bool, str)

    def __init__(
        self,
        gallery_matcher: GalleryCacheManager | None = None,
        ws_url: str | None = None,
        topic: str = "/topic/kiosk-gallery",
        parent: QObject | None = None,
    ) -> None:
        """Khởi tạo KioskStompWorker.

        Args:
            gallery_matcher: Đối tượng quản lý ma trận RAM để nạp nóng.
            ws_url: URL WebSocket STOMP (mặc định từ settings: ws://localhost:8080/ws).
            topic: Tên topic đăng ký nhận bản tin (mặc định: /topic/kiosk-gallery).
            parent: QObject cha.
        """
        super().__init__(parent)
        self.gallery_matcher: GalleryCacheManager | None = gallery_matcher
        self.ws_url: str = ws_url or settings.stomp_ws_url
        self.topic: str = topic

        self._is_running: bool = False
        self._is_connected: bool = False
        self._conn: Any = None

    def process_event(self, data: dict[str, Any]) -> bool:
        """Xử lý trực tiếp một sự kiện cập nhật Gallery (hỗ trợ cả chạy ngầm và Unit Test).

        Tuân thủ thuật toán Nạp nóng tại api-design.md Mục 3.2.

        Args:
            data: Dữ liệu JSON payload chứa action, employeeId, vector512...

        Returns:
            bool: True nếu xử lý thành công, False nếu có lỗi.
        """
        action = data.get("action")
        emp_id = data.get("employeeId")

        if not action or emp_id is None:
            logger.warning("Nhận bản tin STOMP không hợp lệ: %s", data)
            return False

        emp_id = int(emp_id)

        if action == "ADD_VECTOR":
            raw_vec = data.get("vector512")
            if not raw_vec:
                logger.warning("ADD_VECTOR thiếu trường vector512 cho nhân viên %d", emp_id)
                return False

            vec = np.asarray(raw_vec, dtype=np.float32)
            meta = {
                "name": data.get("fullName", ""),
                "code": data.get("employeeCode", f"NV-{emp_id}"),
                "dept": data.get("department", ""),
            }

            if self.gallery_matcher is not None:
                self.gallery_matcher.add_or_update(emp_id, vec, metadata=meta)
                logger.info(
                    "Đã nạp nóng (ADD_VECTOR) nhân viên %d vào RAM [version=%d]",
                    emp_id,
                    self.gallery_matcher.gallery_version,
                )

            self.gallery_updated.emit("ADD_VECTOR", emp_id)
            return True

        elif action == "DELETE_VECTOR":
            if self.gallery_matcher is not None:
                removed = self.gallery_matcher.remove(emp_id)
                logger.info(
                    "Đã nạp nóng (DELETE_VECTOR) nhân viên %d khỏi RAM (thành công=%s)",
                    emp_id,
                    removed,
                )

            self.gallery_updated.emit("DELETE_VECTOR", emp_id)
            return True

        else:
            logger.warning("Bỏ qua hành động STOMP không hỗ trợ: %s", action)
            return False

    def _connect_stomp(self) -> bool:
        """Khởi tạo kết nối STOMP qua thư viện stomp.py."""
        try:
            import stomp

            parsed = urlparse(self.ws_url)
            host = parsed.hostname or "localhost"
            port = parsed.port or 8080

            conn = stomp.Connection([(host, port)])

            class StompMsgListener(stomp.ConnectionListener):
                def __init__(self, worker_ref: Any) -> None:
                    self.worker = worker_ref

                def on_message(self, frame: Any) -> None:
                    try:
                        body_data = json.loads(frame.body)
                        self.worker.process_event(body_data)
                    except Exception as e:
                        logger.error("Lỗi phân tích cú pháp bản tin STOMP: %s", e)

                def on_disconnected(self) -> None:
                    self.worker._update_status(False, "Mất kết nối tới STOMP Broker")

            conn.set_listener("kiosk_listener", StompMsgListener(self))
            conn.connect(
                wait=True,
                timeout=3.0,
                headers={
                    "X-Kiosk-Id": settings.kiosk_id,
                    "X-Kiosk-Secret": settings.kiosk_secret_token,
                },
            )
            conn.subscribe(destination=self.topic, id=1, ack="auto")

            self._conn = conn
            self._update_status(True, f"Đã kết nối STOMP ({self.topic})")
            return True
        except Exception as exc:
            self._update_status(False, f"Lỗi kết nối STOMP: {exc}")
            return False

    def _update_status(self, is_connected: bool, message: str) -> None:
        """Cập nhật trạng thái và phát tín hiệu."""
        if self._is_connected != is_connected:
            self._is_connected = is_connected
            self.connection_status_changed.emit(is_connected, message)
            logger.info("Trạng thái STOMP: connected=%s (%s)", is_connected, message)

    def run(self) -> None:
        """Vòng lặp thực thi của QThread duy trì kết nối với Exponential Backoff."""
        self._is_running = True
        logger.info("KioskStompWorker bắt đầu chạy [topic=%s]", self.topic)

        attempt = 0
        while self._is_running:
            if not self._is_connected:
                success = self._connect_stomp()
                if success:
                    attempt = 0
                else:
                    attempt += 1
                    # Exponential Backoff: delay = min(2^attempt, 30s)
                    delay = min(2 ** min(attempt, 5), 30.0)
                    logger.debug("Thử kết nối lại STOMP sau %.1fs (lần thứ %d)...", delay, attempt)
                    # Ngủ ngắt quãng để phản hồi stop() tức thì
                    for _ in range(int(delay * 10)):
                        if not self._is_running:
                            break
                        self.msleep(100)
            else:
                self.msleep(1000)

        self._disconnect_stomp()
        logger.info("KioskStompWorker đã dừng an toàn.")

    def _disconnect_stomp(self) -> None:
        """Ngắt kết nối STOMP an toàn."""
        if self._conn is not None:
            try:
                self._conn.disconnect()
            except Exception:
                pass
            self._conn = None
        self._is_connected = False

    def stop(self) -> None:
        """Dừng luồng nền an toàn."""
        self._is_running = False
        self._disconnect_stomp()
        self.wait(3000)
