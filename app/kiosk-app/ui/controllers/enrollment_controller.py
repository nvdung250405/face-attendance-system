"""EnrollmentController: Điều phối quy trình tự đăng ký nhân viên mới qua OTP cho QML."""

from PySide6.QtCore import Property, QObject, Signal, Slot


class EnrollmentController(QObject):
    """Controller điều phối giao diện EnrollmentDialog QML qua 3 bước."""

    currentStepChanged = Signal(int)
    progressPercentChanged = Signal(float)
    statusMessageChanged = Signal(str)

    def __init__(self, parent: QObject | None = None) -> None:
        """Khởi tạo EnrollmentController."""
        super().__init__(parent)
        self._current_step: int = 1  # 1: OTP, 2: Chụp ảnh, 3: Hoàn tất
        self._progress_percent: float = 0.0
        self._status_message: str = "Vui lòng nhập mã OTP xác thực"

    @Property(int, notify=currentStepChanged)
    def currentStep(self) -> int:
        """Bước hiện tại trong quy trình đăng ký."""
        return self._current_step

    @Property(float, notify=progressPercentChanged)
    def progressPercent(self) -> float:
        """Tỷ lệ phần trăm hoàn thành bước chụp ảnh."""
        return self._progress_percent

    @Property(str, notify=statusMessageChanged)
    def statusMessage(self) -> str:
        """Thông điệp hướng dẫn tương tác."""
        return self._status_message

    @Slot(int)
    def setStep(self, step: int) -> None:
        """Chuyển đổi bước trên giao diện QML."""
        if self._current_step != step:
            self._current_step = step
            self.currentStepChanged.emit(step)

    @Slot()
    def reset(self) -> None:
        """Reset lại toàn bộ quy trình đăng ký."""
        self._current_step = 1
        self._progress_percent = 0.0
        self._status_message = "Vui lòng nhập mã OTP xác thực"
        self.currentStepChanged.emit(self._current_step)
        self.progressPercentChanged.emit(self._progress_percent)
        self.statusMessageChanged.emit(self._status_message)
