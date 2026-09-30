"""KioskViewModel: Lớp ViewModel trung gian kết nối lõi AI/Camera với giao diện QML.

Tuân thủ mô hình MVC/MVVM:
- Kế thừa QObject
- Cung cấp @Property kèm Signal notify để QML tự động cập nhật viền oval, thông điệp
- Cung cấp @Slot để QML gọi các hành động nghiệp vụ
"""

from enum import StrEnum

from PySide6.QtCore import Property, QObject, Signal, Slot


class OvalState(StrEnum):
    """Máy trạng thái 4 màu viền Oval sinh trắc học."""

    IDLE = "IDLE"          # Xám: Chờ người dùng
    ALIGNING = "ALIGNING"  # Vàng: Đang phát hiện & căn chỉnh
    SUCCESS = "SUCCESS"    # Xanh lá: Nhận diện thành công
    ERROR = "ERROR"        # Đỏ: Spoofing hoặc lỗi


class KioskViewModel(QObject):
    """ViewModel điều phối trạng thái hiển thị và hành động của Kiosk QML View."""

    ovalStateChanged = Signal(str)
    messageChanged = Signal(str)
    isProcessingChanged = Signal(bool)
    openPinDialogRequested = Signal()
    openEnrollmentDialogRequested = Signal()

    def __init__(self, parent: QObject | None = None) -> None:
        """Khởi tạo KioskViewModel."""
        super().__init__(parent)
        self._oval_state: str = OvalState.IDLE
        self._message: str = "Vui lòng nhìn vào khung hình để điểm danh"
        self._is_processing: bool = False

    @Property(str, notify=ovalStateChanged)
    def ovalState(self) -> str:
        """Lấy trạng thái viền oval hiện tại."""
        return self._oval_state

    @Property(str, notify=messageChanged)
    def message(self) -> str:
        """Lấy thông điệp tương tác hiện tại."""
        return self._message

    @Property(bool, notify=isProcessingChanged)
    def isProcessing(self) -> bool:
        """Kiểm tra có đang bận xử lý điểm danh hay không."""
        return self._is_processing

    def set_state(self, state: OvalState | str, message: str = "") -> None:
        """Cập nhật trạng thái màu viền oval và thông điệp cho QML."""
        state_str = str(state)
        changed = False
        if self._oval_state != state_str:
            self._oval_state = state_str
            self.ovalStateChanged.emit(state_str)
            changed = True
        if message and self._message != message:
            self._message = message
            self.messageChanged.emit(message)
            changed = True
        if changed:
            pass

    @Slot()
    def requestPinFallback(self) -> None:
        """Slot được gọi từ QML khi người dùng bấm nút Quẹt PIN dự phòng."""
        self.set_state(OvalState.ALIGNING, "Vui lòng nhập mã PIN trên bàn phím ảo...")
        self.openPinDialogRequested.emit()

    @Slot()
    def requestEnrollment(self) -> None:
        """Slot được gọi từ QML khi người dùng bấm Đăng ký nhân viên mới."""
        self.set_state(OvalState.ALIGNING, "Vui lòng nhập mã OTP để tiếp tục đăng ký...")
        self.openEnrollmentDialogRequested.emit()
