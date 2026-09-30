"""PinController: Điều phối logic nhập mã PIN và cơ chế chống brute-force cho QML."""

from PySide6.QtCore import Property, QObject, Signal, Slot


class PinController(QObject):
    """Controller phụ trách tương tác giữa VirtualKeypad QML và nghiệp vụ xác thực PIN."""

    pinChanged = Signal(str)
    isLockedChanged = Signal(bool)
    statusMessageChanged = Signal(str)

    def __init__(self, parent: QObject | None = None) -> None:
        """Khởi tạo PinController."""
        super().__init__(parent)
        self._pin: str = ""
        self._is_locked: bool = False
        self._status_message: str = "Vui lòng nhập mã PIN cá nhân (4-6 chữ số)"
        self._failed_attempts: int = 0

    @Property(str, notify=pinChanged)
    def currentPin(self) -> str:
        """Lấy chuỗi PIN hiện tại."""
        return self._pin

    @Property(bool, notify=isLockedChanged)
    def isLocked(self) -> bool:
        """Kiểm tra bàn phím có đang bị khóa hay không."""
        return self._is_locked

    @Property(str, notify=statusMessageChanged)
    def statusMessage(self) -> str:
        """Lấy thông điệp hướng dẫn PIN."""
        return self._status_message

    @Slot(str)
    def appendDigit(self, digit: str) -> None:
        """Thêm 1 chữ số khi bấm phím trên bàn phím ảo QML."""
        if self._is_locked or len(self._pin) >= 6:
            return
        self._pin += digit
        self.pinChanged.emit(self._pin)

    @Slot()
    def backspace(self) -> None:
        """Xóa 1 ký tự cuối cùng."""
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
