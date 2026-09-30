"""Module giao diện bàn phím số ảo cảm ứng (VirtualPinDialog) phục vụ điểm danh mã PIN dự phòng.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-04 - VirtualPinDialog)
- TP-KIOSK-01 (Mục 6.2 & TC-KIOSK-10, TC-KIOSK-11, TC-KIOSK-12)
- DDS.md (Mục 3.4 - Luồng điểm danh bằng mã PIN & Khóa 15 phút chống brute-force)
"""

import math
import time
from dataclasses import dataclass

from PySide6.QtCore import Qt, QTimer, Signal
from PySide6.QtGui import QFont
from PySide6.QtWidgets import (
    QDialog,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

from config.logger import get_logger
from config.settings import settings

logger = get_logger("pin_dialog")


@dataclass(frozen=True)
class PinLockoutStatus:
    """Trạng thái khóa bàn phím do nhập sai mã PIN liên tiếp."""

    is_locked: bool
    remaining_seconds: int
    failed_attempts: int


class PinSecurityManager:
    """Quản lý số lần nhập sai mã PIN và cơ chế khóa cưỡng bức 15 phút chống brute-force."""

    def __init__(
        self,
        max_attempts: int | None = None,
        lockout_minutes: int | None = None,
    ) -> None:
        """Khởi tạo PinSecurityManager.

        Args:
            max_attempts: Số lần nhập sai tối đa cho phép trước khi khóa (mặc định: 5).
            lockout_minutes: Thời gian khóa trạm (phút) sau khi vượt ngưỡng (mặc định: 15).
        """
        self.max_attempts: int = (
            max_attempts if max_attempts is not None else settings.max_pin_attempts
        )
        self.lockout_duration_sec: int = (
            (lockout_minutes if lockout_minutes is not None else settings.pin_lockout_minutes)
            * 60
        )
        self.failed_attempts: int = 0
        self.lockout_until_timestamp: float | None = None

    def get_status(self, current_time: float | None = None) -> PinLockoutStatus:
        """Lấy trạng thái khóa hiện thời của bàn phím.

        Args:
            current_time: Mốc thời gian kiểm tra (Unix timestamp).

        Returns:
            PinLockoutStatus: Trạng thái có bị khóa hay không, số giây còn lại và số lần sai.
        """
        now = current_time if current_time is not None else time.time()

        if self.lockout_until_timestamp is not None:
            if now < self.lockout_until_timestamp:
                remaining = int(math.ceil(self.lockout_until_timestamp - now))
                return PinLockoutStatus(
                    is_locked=True,
                    remaining_seconds=max(1, remaining),
                    failed_attempts=self.failed_attempts,
                )
            # Hết thời hạn khóa -> tự động mở khóa và reset số lần sai
            self.lockout_until_timestamp = None
            self.failed_attempts = 0

        return PinLockoutStatus(
            is_locked=False,
            remaining_seconds=0,
            failed_attempts=self.failed_attempts,
        )

    def record_failure(self, current_time: float | None = None) -> PinLockoutStatus:
        """Ghi nhận một lần nhập sai mã PIN và kích hoạt khóa nếu đạt ngưỡng 5 lần.

        Args:
            current_time: Mốc thời gian ghi nhận (Unix timestamp).

        Returns:
            PinLockoutStatus: Trạng thái sau khi ghi nhận lỗi.
        """
        now = current_time if current_time is not None else time.time()
        self.failed_attempts += 1
        logger.warning(
            "Nhập sai mã PIN lần thứ %d/%d", self.failed_attempts, self.max_attempts
        )

        if self.failed_attempts >= self.max_attempts:
            self.lockout_until_timestamp = now + self.lockout_duration_sec
            logger.error(
                "Đã khóa bàn phím PIN trong %d phút do nhập sai quá %d lần!",
                self.lockout_duration_sec // 60,
                self.max_attempts,
            )

        return self.get_status(current_time=now)

    def record_success(self) -> None:
        """Ghi nhận nhập mã PIN thành công, reset lại số lần sai về 0."""
        self.failed_attempts = 0
        self.lockout_until_timestamp = None
        logger.info("Xác thực PIN thành công, đã reset bộ đếm lỗi về 0.")

    def reset(self) -> None:
        """Reset khẩn cấp trạng thái khóa."""
        self.failed_attempts = 0
        self.lockout_until_timestamp = None


class VirtualPinDialog(QDialog):
    """Hộp thoại bàn phím số ảo cảm ứng phục vụ điểm danh dự phòng bằng mã PIN."""

    # Tín hiệu phát khi người dùng xác nhận nhập (employee_id, pin_code)
    pin_submitted = Signal(int, str)

    def __init__(
        self,
        security_manager: PinSecurityManager | None = None,
        parent: QWidget | None = None,
    ) -> None:
        """Khởi tạo VirtualPinDialog.

        Args:
            security_manager: Đối tượng quản lý khóa brute-force (nếu None sẽ dùng mặc định).
            parent: Đối tượng cha Qt.
        """
        super().__init__(parent)
        self.security = security_manager or PinSecurityManager()
        self.active_field: str = "id"  # "id" hoặc "pin"

        self.setWindowTitle("Điểm danh Dự phòng bằng Mã PIN - FAS")
        self.setFixedSize(480, 680)
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowContextHelpButtonHint)
        self.setStyleSheet("background-color: #1E1E2E; color: #FFFFFF;")

        self._init_ui()
        self._setup_timer()
        self._update_lockout_ui()

    def _init_ui(self) -> None:
        """Xây dựng bố cục giao diện đồ họa cảm ứng lớn."""
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(24, 20, 24, 20)
        main_layout.setSpacing(12)

        # 1. Tiêu đề
        title_label = QLabel("ĐIỂM DANH DỰ PHÒNG", self)
        title_label.setAlignment(Qt.AlignCenter)
        title_label.setFont(QFont("Segoe UI", 16, QFont.Bold))
        title_label.setStyleSheet("color: #89B4FA; margin-bottom: 4px;")
        main_layout.addWidget(title_label)

        sub_label = QLabel("Vui lòng nhập Mã nhân viên và Mã PIN 6 số", self)
        sub_label.setAlignment(Qt.AlignCenter)
        sub_label.setStyleSheet("color: #A6ADC8; font-size: 13px; margin-bottom: 8px;")
        main_layout.addWidget(sub_label)

        # 2. Banner cảnh báo lỗi / Khóa bàn phím
        self.banner_label = QLabel("", self)
        self.banner_label.setAlignment(Qt.AlignCenter)
        self.banner_label.setWordWrap(True)
        self.banner_label.setStyleSheet(
            "background-color: transparent; color: #F38BA8; font-size: 13px; font-weight: bold; padding: 4px;"
        )
        main_layout.addWidget(self.banner_label)

        # 3. Khu vực ô nhập dữ liệu
        fields_layout = QVBoxLayout()
        fields_layout.setSpacing(8)

        # Ô Mã nhân viên
        id_box = QHBoxLayout()
        id_tag = QLabel("Mã NV:", self)
        id_tag.setFixedWidth(75)
        id_tag.setStyleSheet("color: #CDD6F4; font-size: 14px; font-weight: bold;")
        self.id_input = QLineEdit(self)
        self.id_input.setPlaceholderText("Nhập mã số nhân viên")
        self.id_input.setMaxLength(8)
        self.id_input.setStyleSheet(self._input_style(active=True))
        self.id_input.mousePressEvent = lambda e: self._set_active_field("id")
        id_box.addWidget(id_tag)
        id_box.addWidget(self.id_input)
        fields_layout.addLayout(id_box)

        # Ô Mã PIN
        pin_box = QHBoxLayout()
        pin_tag = QLabel("Mã PIN:", self)
        pin_tag.setFixedWidth(75)
        pin_tag.setStyleSheet("color: #CDD6F4; font-size: 14px; font-weight: bold;")
        self.pin_input = QLineEdit(self)
        self.pin_input.setPlaceholderText("Nhập 6 số bảo mật")
        self.pin_input.setEchoMode(QLineEdit.Password)
        self.pin_input.setMaxLength(6)
        self.pin_input.setStyleSheet(self._input_style(active=False))
        self.pin_input.mousePressEvent = lambda e: self._set_active_field("pin")
        pin_box.addWidget(pin_tag)
        pin_box.addWidget(self.pin_input)
        fields_layout.addLayout(pin_box)

        main_layout.addLayout(fields_layout)

        # 4. Bàn phím số ảo cảm ứng (3x4 Grid)
        self.keypad_widget = QWidget(self)
        grid_layout = QGridLayout(self.keypad_widget)
        grid_layout.setSpacing(10)
        grid_layout.setContentsMargins(0, 8, 0, 8)

        buttons = [
            ("1", 0, 0), ("2", 0, 1), ("3", 0, 2),
            ("4", 1, 0), ("5", 1, 1), ("6", 1, 2),
            ("7", 2, 0), ("8", 2, 1), ("9", 2, 2),
            ("C", 3, 0), ("0", 3, 1), ("⌫", 3, 2),
        ]

        self.num_buttons: list[QPushButton] = []
        for text, row, col in buttons:
            btn = QPushButton(text, self)
            btn.setFixedHeight(56)
            btn.setFont(QFont("Segoe UI", 16, QFont.Bold))
            if text in ("C", "⌫"):
                btn.setStyleSheet(self._action_key_style())
            else:
                btn.setStyleSheet(self._num_key_style())

            if text == "C":
                btn.clicked.connect(self._handle_clear)
            elif text == "⌫":
                btn.clicked.connect(self._handle_backspace)
            else:
                digit = text
                btn.clicked.connect(lambda _, d=digit: self._handle_digit(d))

            self.num_buttons.append(btn)
            grid_layout.addWidget(btn, row, col)

        main_layout.addWidget(self.keypad_widget)

        # 5. Nút điều khiển xác nhận / hủy
        bottom_layout = QHBoxLayout()
        bottom_layout.setSpacing(12)

        self.cancel_button = QPushButton("Hủy bỏ (Esc)", self)
        self.cancel_button.setFixedHeight(48)
        self.cancel_button.setFont(QFont("Segoe UI", 13, QFont.Bold))
        self.cancel_button.setStyleSheet(
            "background-color: #313244; color: #CDD6F4; border-radius: 8px; border: 1px solid #45475A;"
        )
        self.cancel_button.clicked.connect(self.reject)
        bottom_layout.addWidget(self.cancel_button)

        self.submit_button = QPushButton("✓ Xác nhận Điểm danh", self)
        self.submit_button.setFixedHeight(48)
        self.submit_button.setFont(QFont("Segoe UI", 13, QFont.Bold))
        self.submit_button.setStyleSheet(
            "background-color: #A6E3A1; color: #11111B; border-radius: 8px; font-weight: bold;"
        )
        self.submit_button.clicked.connect(self._handle_submit)
        bottom_layout.addWidget(self.submit_button)

        main_layout.addLayout(bottom_layout)

    def _setup_timer(self) -> None:
        """Khởi tạo QTimer cập nhật đếm lùi thời gian khóa mỗi giây."""
        self.lock_timer = QTimer(self)
        self.lock_timer.setInterval(1000)
        self.lock_timer.timeout.connect(self._update_lockout_ui)
        self.lock_timer.start()

    def _set_active_field(self, field_name: str) -> None:
        """Đổi tiêu điểm giữa ô Mã nhân viên và ô Mã PIN."""
        self.active_field = field_name
        self.id_input.setStyleSheet(self._input_style(active=(field_name == "id")))
        self.pin_input.setStyleSheet(self._input_style(active=(field_name == "pin")))

    def _handle_digit(self, digit: str) -> None:
        """Gõ một chữ số vào ô đang chọn."""
        status = self.security.get_status()
        if status.is_locked:
            return

        target = self.id_input if self.active_field == "id" else self.pin_input
        current_text = target.text()
        max_len = target.maxLength()

        if len(current_text) < max_len:
            target.setText(current_text + digit)

        # Tự động nhảy sang ô PIN nếu đã gõ xong mã NV (ví dụ 4-8 ký tự) hoặc gõ đủ PIN
        if self.active_field == "pin" and len(target.text()) == 6:
            # Người dùng đã gõ đủ 6 số PIN
            pass

    def _handle_backspace(self) -> None:
        """Xóa ký tự cuối cùng của ô đang chọn."""
        target = self.id_input if self.active_field == "id" else self.pin_input
        current_text = target.text()
        if current_text:
            target.setText(current_text[:-1])

    def _handle_clear(self) -> None:
        """Xóa trắng ô đang chọn."""
        target = self.id_input if self.active_field == "id" else self.pin_input
        target.clear()

    def _handle_submit(self) -> None:
        """Xác thực định dạng và phát tín hiệu nộp mã PIN."""
        status = self.security.get_status()
        if status.is_locked:
            return

        raw_id = self.id_input.text().strip()
        raw_pin = self.pin_input.text().strip()

        if not raw_id:
            self._show_error("Vui lòng nhập Mã nhân viên!")
            self._set_active_field("id")
            return

        try:
            emp_id = int(raw_id)
        except ValueError:
            self._show_error("Mã nhân viên phải là số nguyên!")
            self._set_active_field("id")
            return

        if len(raw_pin) != 6 or not raw_pin.isdigit():
            self._show_error("Mã PIN bắt buộc phải có đúng 6 chữ số!")
            self._set_active_field("pin")
            return

        # Định dạng hợp lệ -> phát tín hiệu nộp về Controller/Backend
        self.banner_label.setText("Đang kiểm tra thông tin...")
        self.banner_label.setStyleSheet("color: #F9E2AF; font-size: 13px; font-weight: bold;")
        self.pin_submitted.emit(emp_id, raw_pin)

    def handle_auth_result(self, is_success: bool, error_msg: str = "") -> None:
        """Nhận kết quả xác thực từ Backend hoặc CSDL cục bộ.

        Args:
            is_success: True nếu mã PIN chính xác.
            error_msg: Thông điệp lỗi chi tiết từ máy chủ (nếu thất bại).
        """
        if is_success:
            self.security.record_success()
            self.accept()
        else:
            status = self.security.record_failure()
            if status.is_locked:
                self._update_lockout_ui()
            else:
                remaining_attempts = self.security.max_attempts - status.failed_attempts
                msg = error_msg or f"Mã PIN không chính xác. Còn lại {remaining_attempts} lần thử!"
                self._show_error(msg)
                self.pin_input.clear()
                self._set_active_field("pin")

    def _show_error(self, message: str) -> None:
        """Hiển thị thông điệp lỗi trực quan."""
        self.banner_label.setText(message)
        self.banner_label.setStyleSheet("color: #F38BA8; font-size: 13px; font-weight: bold;")

    def _update_lockout_ui(self) -> None:
        """Cập nhật giao diện đếm lùi thời gian khóa và vô hiệu hóa bàn phím nếu bị khóa."""
        status = self.security.get_status()

        if status.is_locked:
            minutes = status.remaining_seconds // 60
            seconds = status.remaining_seconds % 60
            self.banner_label.setText(
                f"ĐÃ KHÓA 15 PHÚT CHỐNG DÒ PIN!\nVui lòng chờ: {minutes:02d}:{seconds:02d}"
            )
            self.banner_label.setStyleSheet(
                "background-color: #450A0A; color: #F87171; font-size: 14px; font-weight: bold; border-radius: 6px; padding: 6px;"
            )
            self._set_keypad_enabled(False)
            self.submit_button.setEnabled(False)
        else:
            if not self.keypad_widget.isEnabled():
                self._set_keypad_enabled(True)
                self.submit_button.setEnabled(True)
                self.banner_label.setText("")
                self.banner_label.setStyleSheet("background-color: transparent;")

    def _set_keypad_enabled(self, enabled: bool) -> None:
        """Bật/tắt trạng thái toàn bộ nút trên bàn phím ảo."""
        self.keypad_widget.setEnabled(enabled)
        self.id_input.setEnabled(enabled)
        self.pin_input.setEnabled(enabled)

    def _input_style(self, active: bool) -> str:
        """Sinh mã CSS cho ô nhập liệu."""
        border_color = "#89B4FA" if active else "#45475A"
        bg_color = "#181825" if active else "#11111B"
        return f"""
            QLineEdit {{
                background-color: {bg_color};
                color: #CDD6F4;
                border: 2px solid {border_color};
                border-radius: 8px;
                padding: 10px 14px;
                font-size: 16px;
                font-weight: bold;
            }}
        """

    def _num_key_style(self) -> str:
        """Sinh mã CSS cho các phím số 0-9."""
        return """
            QPushButton {
                background-color: #313244;
                color: #CDD6F4;
                border-radius: 8px;
                border: 1px solid #45475A;
            }
            QPushButton:pressed {
                background-color: #89B4FA;
                color: #11111B;
            }
            QPushButton:disabled {
                background-color: #181825;
                color: #585B70;
                border: 1px solid #313244;
            }
        """

    def _action_key_style(self) -> str:
        """Sinh mã CSS cho phím chức năng C và Backspace."""
        return """
            QPushButton {
                background-color: #45475A;
                color: #FAB387;
                border-radius: 8px;
                border: 1px solid #585B70;
            }
            QPushButton:pressed {
                background-color: #FAB387;
                color: #11111B;
            }
            QPushButton:disabled {
                background-color: #181825;
                color: #585B70;
                border: 1px solid #313244;
            }
        """
