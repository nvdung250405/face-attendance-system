"""PinController: Điều phối logic nhập mã PIN và cơ chế chống brute-force cho QML."""

import time

from PySide6.QtCore import Property, QObject, Signal, Slot

from config.logger import get_logger
from config.settings import settings
from core.security.pin_security import PinSecurityManager

logger = get_logger("pin_controller")


class PinController(QObject):
    """Controller phụ trách tương tác giữa VirtualKeypad QML và nghiệp vụ xác thực PIN."""

    pinChanged = Signal(str)
    isLockedChanged = Signal(bool)
    remainingSecondsChanged = Signal(int)
    statusMessageChanged = Signal(str)
    employeeCodeChanged = Signal(str)
    pinSubmitted = Signal(str, str)  # employee_code, pin_code
    verificationSucceeded = Signal()

    def __init__(
        self,
        security_manager: PinSecurityManager | None = None,
        parent: QObject | None = None,
    ) -> None:
        """Khởi tạo PinController."""
        super().__init__(parent)
        self.security_manager = security_manager or PinSecurityManager()
        self._employee_code: str = ""
        self._pin: str = ""
        self._is_locked: bool = False
        self._remaining_seconds: int = 0
        self._status_message: str = "Vui lòng nhập mã PIN cá nhân (6 chữ số)"

        self._check_lockout_status()

    @Property(str, notify=pinChanged)
    def currentPin(self) -> str:
        """Lấy chuỗi PIN hiện tại."""
        return self._pin

    @Property(bool, notify=isLockedChanged)
    def isLocked(self) -> bool:
        """Kiểm tra bàn phím có đang bị khóa hay không."""
        return self._is_locked

    @Property(int, notify=remainingSecondsChanged)
    def remainingSeconds(self) -> int:
        """Số giây khóa còn lại nếu bị lockout."""
        return self._remaining_seconds

    @Property(str, notify=statusMessageChanged)
    def statusMessage(self) -> str:
        """Lấy thông điệp hướng dẫn PIN."""
        return self._status_message

    @Property(str, notify=employeeCodeChanged)
    def employeeCode(self) -> str:
        """Mã nhân viên cần xác thực PIN."""
        return self._employee_code

    @employeeCode.setter
    def employeeCode(self, code: str) -> None:
        self.set_employee_code(code)

    @Slot(str)
    def setEmployeeCode(self, code: str) -> None:
        """Slot cho QML gán mã nhân viên trước khi nhập PIN."""
        self.set_employee_code(code)

    def set_employee_code(self, code: str) -> None:
        """Gán mã nhân viên trước khi nhập PIN."""
        code = code or ""
        if self._employee_code != code:
            self._employee_code = code
            self.employeeCodeChanged.emit(self._employee_code)

    def set_status_message(self, message: str) -> None:
        """Cập nhật thông điệp trạng thái cho bàn phím PIN."""
        if self._status_message != message:
            self._status_message = message
            self.statusMessageChanged.emit(self._status_message)

    def _check_lockout_status(self) -> None:
        """Kiểm tra và cập nhật trạng thái khóa bàn phím theo thời gian thực."""
        status = self.security_manager.get_status(time.time())
        if status.is_locked != self._is_locked:
            self._is_locked = status.is_locked
            self.isLockedChanged.emit(self._is_locked)

        if status.remaining_seconds != self._remaining_seconds:
            self._remaining_seconds = status.remaining_seconds
            self.remainingSecondsChanged.emit(self._remaining_seconds)

        if status.is_locked:
            msg = f"Đã khóa bàn phím do nhập sai quá 5 lần! Thử lại sau {status.remaining_seconds}s"
            if self._status_message != msg:
                self._status_message = msg
                self.statusMessageChanged.emit(self._status_message)
        elif not self._pin:
            msg = "Vui lòng nhập mã PIN cá nhân (6 chữ số)"
            if self._status_message != msg:
                self._status_message = msg
                self.statusMessageChanged.emit(self._status_message)

    @Slot(str)
    def appendDigit(self, digit: str) -> None:
        """Thêm 1 chữ số khi bấm phím trên bàn phím ảo QML."""
        self._check_lockout_status()
        if self._is_locked or len(self._pin) >= 6:
            return
        self._pin += digit
        self.pinChanged.emit(self._pin)

    @Slot()
    def backspace(self) -> None:
        """Xóa 1 ký tự cuối cùng."""
        self._check_lockout_status()
        if self._is_locked or not self._pin:
            return
        self._pin = self._pin[:-1]
        self.pinChanged.emit(self._pin)

    @Slot()
    def clear(self) -> None:
        """Xóa trắng toàn bộ mã PIN đã nhập."""
        if self._is_locked:
            return
        self._pin = ""
        self.pinChanged.emit(self._pin)

    @Slot()
    def submitPin(self) -> None:
        """Xác nhận nộp mã PIN để xác thực."""
        self._check_lockout_status()
        if self._is_locked:
            return

        if len(self._pin) < 6:
            self.set_status_message("Mã PIN phải có đúng 6 chữ số!")
            return

        logger.info("PinController nộp mã PIN cho mã NV: %s", self._employee_code)
        self.pinSubmitted.emit(self._employee_code, self._pin)

    def on_verification_failure(self) -> None:
        """Được gọi khi Backend hoặc hệ thống phản hồi sai mã PIN."""
        status = self.security_manager.record_failure(time.time())
        self.clear()
        self._check_lockout_status()
        if not status.is_locked:
            remaining = settings.max_pin_attempts - status.failed_attempts
            self.set_status_message(f"Sai mã PIN! Còn lại {remaining} lần thử.")

    def on_verification_success(self) -> None:
        """Được gọi khi xác thực mã PIN thành công."""
        self.security_manager.record_success()
        self.clear()
        self.set_status_message("Xác thực mã PIN thành công!")
        self.verificationSucceeded.emit()
