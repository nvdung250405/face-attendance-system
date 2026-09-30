"""Module LiveCanvasWidget hiển thị luồng video và viền oval động 4 màu theo máy trạng thái.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & M6 - LiveCanvasWidget)
- TP-KIOSK-01 (Mục 4.3 - M6: GUI & Soak Testing)
- DDS.md (Mục 2.1 & Mục 3.5 - Máy trạng thái viền oval 4 màu)
"""

from enum import StrEnum

import cv2
import numpy as np
from PySide6.QtCore import QRect, QRectF, Qt
from PySide6.QtGui import (
    QBrush,
    QColor,
    QFont,
    QImage,
    QPainter,
    QPainterPath,
    QPen,
    QPixmap,
)
from PySide6.QtWidgets import QWidget

from config.logger import get_logger

logger = get_logger("live_canvas")


class OvalState(StrEnum):
    """Máy trạng thái 4 màu viền oval nhận diện sinh trắc học."""

    IDLE = "IDLE"          # Xám: Chờ người dùng bước vào khung hình
    ALIGNING = "ALIGNING"  # Vàng: Đang phát hiện mặt & hướng dẫn căn chỉnh
    SUCCESS = "SUCCESS"    # Xanh lá: Nhận diện và điểm danh thành công
    ERROR = "ERROR"        # Đỏ: Cảnh báo giả mạo (Spoof) hoặc từ chối quẹt


# Bảng mã màu chuẩn hóa Catppuccin / DDS
STATE_COLORS = {
    OvalState.IDLE: QColor("#6C7086"),       # Xám tro dịu
    OvalState.ALIGNING: QColor("#F9E2AF"),   # Vàng ấm
    OvalState.SUCCESS: QColor("#A6E3A1"),    # Xanh lá tươi
    OvalState.ERROR: QColor("#F38BA8"),      # Đỏ hồng cảnh báo
}


class LiveCanvasWidget(QWidget):
    """Widget vẽ luồng video trực tiếp từ webcam và viền oval định vị khuôn mặt đổi 4 màu."""

    def __init__(self, parent: QWidget | None = None) -> None:
        """Khởi tạo LiveCanvasWidget."""
        super().__init__(parent)

        self._state: OvalState = OvalState.IDLE
        self._message: str = "Vui lòng nhìn vào khung hình để điểm danh"
        self._current_frame: np.ndarray | None = None
        self._pixmap: QPixmap | None = None

        # Bật thuộc tính vẽ tối ưu hiệu năng
        self.setAttribute(Qt.WA_OpaquePaintEvent, True)
        self.setMinimumSize(480, 480)
        self.setStyleSheet("background-color: #11111B;")

    @property
    def state(self) -> OvalState:
        """Lấy trạng thái viền oval hiện hành."""
        return self._state

    @property
    def message(self) -> str:
        """Lấy thông điệp hướng dẫn hiện hành."""
        return self._message

    def set_frame(self, frame: np.ndarray | None) -> None:
        """Nạp khung hình BGR từ CameraWorker và kích hoạt vẽ lại màn hình."""
        if frame is None or frame.size == 0:
            self._current_frame = None
            self._pixmap = None
            self.update()
            return

        self._current_frame = frame
        # Chuyển đổi BGR OpenCV sang QImage RGB
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb.shape
        bytes_per_line = ch * w
        qimg = QImage(rgb.data, w, h, bytes_per_line, QImage.Format_RGB888)
        self._pixmap = QPixmap.fromImage(qimg)
        self.update()

    def set_state(self, state: OvalState, message: str = "") -> None:
        """Cập nhật trạng thái màu viền oval và thông điệp tương tác."""
        if self._state != state or self._message != message:
            self._state = state
            if message:
                self._message = message
            self.update()

    def get_oval_rect(self) -> QRect:
        """Tính toán hình chữ nhật giới hạn của khung oval ở vị trí trung tâm tỷ lệ vàng."""
        w = self.width()
        h = self.height()

        # Chiều rộng oval ~ 42% chiều rộng widget, chiều cao ~ 68% chiều cao widget
        oval_w = max(240, int(min(w * 0.44, 420)))
        oval_h = max(320, int(min(h * 0.70, 560)))

        # Canh giữa theo chiều ngang và hơi nhích lên trên một chút theo trục dọc
        x = (w - oval_w) // 2
        y = max(20, int((h - oval_h) * 0.42))

        return QRect(x, y, oval_w, oval_h)

    def paintEvent(self, event) -> None:
        """Vẽ toàn bộ giao diện Canvas: Camera video -> Lớp phủ tối mờ ngoài Oval -> Viền Oval 4 màu -> Badge thông điệp."""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing, True)
        painter.setRenderHint(QPainter.SmoothPixmapTransform, True)

        w = self.width()
        h = self.height()

        # 1. Vẽ khung hình camera nền
        if self._pixmap is not None and not self._pixmap.isNull():
            scaled = self._pixmap.scaled(
                w, h,
                Qt.KeepAspectRatioByExpanding,
                Qt.SmoothTransformation,
            )
            # Canh giữa khung hình
            px = (w - scaled.width()) // 2
            py = (h - scaled.height()) // 2
            painter.drawPixmap(px, py, scaled)
        else:
            # Nếu chưa có camera, vẽ nền màu tối kèm văn bản chờ
            painter.fillRect(0, 0, w, h, QColor("#11111B"))
            painter.setPen(QColor("#6C7086"))
            painter.setFont(QFont("Segoe UI", 14))
            painter.drawText(
                self.rect(),
                Qt.AlignCenter,
                "Đang kết nối camera DirectShow...",
            )

        # 2. Tạo mặt nạ vùng tối mờ bên ngoài Oval để tập trung tầm nhìn người dùng
        oval_rect = self.get_oval_rect()
        whole_path = QPainterPath()
        whole_path.addRect(0, 0, w, h)

        oval_path = QPainterPath()
        oval_path.addEllipse(QRectF(oval_rect))

        # Hiệu ứng khoét lỗ Oval: Lấy toàn màn hình trừ đi hình Oval
        mask_path = whole_path.subtracted(oval_path)
        painter.fillPath(mask_path, QBrush(QColor(17, 17, 27, 135)))

        # 3. Vẽ đường viền Oval định vị 4 màu theo máy trạng thái
        pen_color = STATE_COLORS.get(self._state, QColor("#6C7086"))
        pen = QPen(pen_color, 5, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin)
        painter.setPen(pen)
        painter.setBrush(Qt.NoBrush)
        painter.drawEllipse(oval_rect)

        # 4. Vẽ 4 góc định vị trang trí công nghệ (Corner brackets)
        self._draw_corner_guides(painter, oval_rect, pen_color)

        # 5. Vẽ Badge thông điệp hướng dẫn phía dưới Oval
        self._draw_message_badge(painter, oval_rect, pen_color)

    def _draw_corner_guides(self, painter: QPainter, rect: QRect, color: QColor) -> None:
        """Vẽ các vạch định vị góc quanh viền oval tạo cảm giác thị giác máy tính công nghệ cao."""
        guide_len = 20
        pen = QPen(color, 3, Qt.SolidLine, Qt.SquareCap)
        painter.setPen(pen)

        cx = rect.center().x()
        cy = rect.center().y()
        rx = rect.width() // 2
        ry = rect.height() // 2

        # 4 điểm chính trên đỉnh, đáy, trái, phải
        painter.drawLine(cx, cy - ry - 8, cx, cy - ry - 8 + guide_len)
        painter.drawLine(cx, cy + ry + 8, cx, cy + ry + 8 - guide_len)
        painter.drawLine(cx - rx - 8, cy, cx - rx - 8 + guide_len, cy)
        painter.drawLine(cx + rx + 8, cy, cx + rx + 8 - guide_len, cy)

    def _draw_message_badge(self, painter: QPainter, oval_rect: QRect, color: QColor) -> None:
        """Vẽ hộp thẻ thông điệp hướng dẫn nổi bật phía dưới hình Oval."""
        if not self._message:
            return

        w = self.width()
        badge_w = min(w - 40, max(360, oval_rect.width() + 60))
        badge_h = 60
        badge_x = (w - badge_w) // 2
        badge_y = min(self.height() - badge_h - 15, oval_rect.bottom() + 18)

        badge_rect = QRectF(badge_x, badge_y, badge_w, badge_h)

        # Nền hộp mờ bo tròn
        painter.setPen(QPen(color, 2))
        painter.setBrush(QBrush(QColor(24, 24, 37, 220)))
        painter.drawRoundedRect(badge_rect, 14, 14)

        # Chữ thông điệp
        painter.setPen(color)
        painter.setFont(QFont("Segoe UI", 13, QFont.Bold))
        painter.drawText(
            badge_rect,
            Qt.AlignCenter | Qt.TextWordWrap,
            self._message,
        )
