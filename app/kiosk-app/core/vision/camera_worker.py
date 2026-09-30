"""Module điều phối luồng thu nhận hình ảnh từ Camera (CameraWorker).

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & 2.2 - CameraWorker QThread)
- DDS.md (Mục 2.1 & 3.2 - Video Capture Pipeline)
- Tuân thủ: cv2.CAP_DSHOW trên Windows, tự phục hồi sau mất kết nối,
  miễn nhiễm rò rỉ bộ nhớ (Zero Memory Leak).
"""

import time

import cv2
import numpy as np
from PySide6.QtCore import QThread, Signal

from config.logger import get_logger
from config.settings import settings

logger = get_logger("camera_worker")


class CameraWorker(QThread):
    """QThread độc lập liên tục đọc khung hình từ thiết bị camera vật lý."""

    # Tín hiệu phát khung hình mới (BGR numpy array)
    frame_ready = Signal(np.ndarray)

    # Tín hiệu cập nhật trạng thái kết nối camera (is_connected, message)
    camera_status = Signal(bool, str)

    # Tín hiệu cập nhật tốc độ khung hình thực tế (FPS)
    fps_updated = Signal(float)

    def __init__(
        self,
        device_index: int | None = None,
        width: int | None = None,
        height: int | None = None,
        target_fps: int | None = None,
        parent: object | None = None,
    ) -> None:
        """Khởi tạo CameraWorker.

        Args:
            device_index: Chỉ số cổng camera (mặc định từ settings).
            width: Chiều rộng khung hình mong muốn (pixels).
            height: Chiều cao khung hình mong muốn (pixels).
            target_fps: Tốc độ khung hình mục tiêu (FPS).
            parent: Đối tượng cha Qt (nếu có).
        """
        super().__init__(parent)
        self.device_index: int = (
            device_index if device_index is not None else settings.camera_device_index
        )
        self.width: int = width if width is not None else settings.camera_frame_width
        self.height: int = height if height is not None else settings.camera_frame_height
        self.target_fps: int = target_fps if target_fps is not None else settings.camera_fps

        self._is_running: bool = False
        self._cap: cv2.VideoCapture | None = None

    def _open_camera(self) -> bool:
        """Mở kết nối camera với backend tối ưu DirectShow trên Windows.

        Returns:
            bool: True nếu kết nối thành công, False nếu thất bại.
        """
        if self._cap is not None and self._cap.isOpened():
            self._cap.release()

        logger.info(
            "Đang mở camera index %d (yêu cầu: %dx%d @ %d FPS)...",
            self.device_index,
            self.width,
            self.height,
            self.target_fps,
        )

        # Ưu tiên backend cv2.CAP_DSHOW trên Windows để giảm độ trễ đệm buffer
        cap = cv2.VideoCapture(self.device_index, cv2.CAP_DSHOW)
        if not cap.isOpened():
            logger.warning("Không thể mở DirectShow backend, chuyển sang CAP_ANY fallback.")
            cap = cv2.VideoCapture(self.device_index, cv2.CAP_ANY)

        if not cap.isOpened():
            logger.error("Không tìm thấy thiết bị camera tại index %d", self.device_index)
            self.camera_status.emit(False, f"Không tìm thấy camera tại index {self.device_index}")
            return False

        # Thiết lập độ phân giải và FPS
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        cap.set(cv2.CAP_PROP_FPS, self.target_fps)

        actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        actual_fps = cap.get(cv2.CAP_PROP_FPS)

        logger.info(
            "Camera đã kết nối thành công: thực tế %dx%d @ %.1f FPS",
            actual_w,
            actual_h,
            actual_fps,
        )
        self._cap = cap
        self.camera_status.emit(True, f"Camera sẵn sàng ({actual_w}x{actual_h})")
        return True

    def run(self) -> None:
        """Vòng lặp chính thu nhận khung hình của QThread."""
        self._is_running = True
        consecutive_read_failures = 0
        frame_interval = 1.0 / max(1, self.target_fps)

        # Khởi tạo kết nối ban đầu
        if not self._open_camera():
            logger.warning("Lần mở camera đầu tiên thất bại. Bắt đầu cơ chế tự kết nối lại ngầm.")

        fps_counter = 0
        fps_start_time = time.time()

        while self._is_running:
            loop_start = time.time()

            # Nếu camera chưa mở hoặc mất kết nối, thử mở lại định kỳ mỗi 3s
            if self._cap is None or not self._cap.isOpened():
                self.camera_status.emit(False, "Đang thử kết nối lại camera...")
                time.sleep(3.0)
                if not self._is_running:
                    break
                if self._open_camera():
                    consecutive_read_failures = 0
                continue

            # Đọc khung hình mới từ hardware buffer
            ret, frame = self._cap.read()

            if not ret or frame is None or frame.size == 0:
                consecutive_read_failures += 1
                if consecutive_read_failures >= 10:
                    logger.error(
                        "Không nhận được tín hiệu hình ảnh liên tiếp %d lần. Đóng và kết nối lại.",
                        consecutive_read_failures,
                    )
                    self.camera_status.emit(False, "Mất tín hiệu camera vật lý")
                    if self._cap is not None:
                        self._cap.release()
                        self._cap = None
                    consecutive_read_failures = 0
                time.sleep(0.1)
                continue

            consecutive_read_failures = 0

            # Lật ảnh theo trục ngang (Mirror effect) giúp người dùng đứng trước Kiosk tự nhiên
            mirrored_frame = cv2.flip(frame, 1)

            # Phát tín hiệu đưa khung hình lên LiveCanvasWidget và AI Pipeline
            self.frame_ready.emit(mirrored_frame)

            # Thống kê FPS thời gian thực
            fps_counter += 1
            now = time.time()
            elapsed_fps = now - fps_start_time
            if elapsed_fps >= 1.0:
                current_fps = fps_counter / elapsed_fps
                self.fps_updated.emit(current_fps)
                fps_counter = 0
                fps_start_time = now

            # Điều tiết tốc độ vòng lặp theo target_fps để không làm quá tải CPU
            elapsed_loop = time.time() - loop_start
            sleep_duration = frame_interval - elapsed_loop
            if sleep_duration > 0.001:
                time.sleep(sleep_duration)

        # Giải phóng tài nguyên camera khi luồng kết thúc
        self._cleanup()

    def _cleanup(self) -> None:
        """Đóng kết nối phần cứng và giải phóng buffer."""
        if self._cap is not None:
            try:
                self._cap.release()
            except Exception as exc:
                logger.warning("Lỗi giải phóng VideoCapture: %s", exc)
            finally:
                self._cap = None
        logger.info("CameraWorker đã dừng và giải phóng tài nguyên phần cứng an toàn.")

    def stop(self) -> None:
        """Dừng luồng CameraWorker an toàn."""
        self._is_running = False
        self.wait(2000)
