"""QQuickImageProvider truyền tải khung hình OpenCV trực tiếp sang QML Image.

Cơ chế: Kế thừa QQuickImageProvider cung cấp hình ảnh QImage/QPixmap theo đường dẫn image://camera/frame.
Tối ưu hiệu năng: Cập nhật vùng nhớ trực tiếp, không qua Base64 serialization.
"""

import cv2
import numpy as np
from PySide6.QtGui import QImage, QPixmap
from PySide6.QtQuick import QQuickImageProvider


class VideoImageProvider(QQuickImageProvider):
    """ImageProvider chuyên dụng cho luồng video camera thời gian thực."""

    def __init__(self) -> None:
        """Khởi tạo VideoImageProvider chế độ Pixmap."""
        super().__init__(QQuickImageProvider.ImageType.Pixmap)
        # Khởi tạo frame rỗng mặc định màu tối
        blank = np.zeros((480, 640, 3), dtype=np.uint8)
        self._current_pixmap: QPixmap = self._to_pixmap(blank)

    def _to_pixmap(self, frame: np.ndarray) -> QPixmap:
        """Chuyển đổi mảng numpy BGR từ OpenCV sang QPixmap RGB."""
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb.shape
        bytes_per_line = ch * w
        qimg = QImage(rgb.data, w, h, bytes_per_line, QImage.Format.Format_RGB888).copy()
        return QPixmap.fromImage(qimg)

    def update_frame(self, frame: np.ndarray | None) -> None:
        """Cập nhật khung hình camera mới nhất từ CameraWorker."""
        if frame is None or frame.size == 0:
            return
        self._current_pixmap = self._to_pixmap(frame)

    def requestPixmap(self, id_str: str, size: tuple[int, int] | None, requested_size: tuple[int, int] | None) -> QPixmap:
        """QML gọi hàm này mỗi khi cần vẽ lại khung hình camera."""
        if self._current_pixmap.isNull():
            return QPixmap(640, 480)
        return self._current_pixmap
