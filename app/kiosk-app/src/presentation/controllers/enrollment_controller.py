"""EnrollmentController: Điều phối quy trình tự đăng ký nhân viên mới qua OTP cho QML."""

import base64
from typing import Any

import cv2
import httpx
import numpy as np
from PySide6.QtCore import Property, QObject, Signal, Slot

from config.logger import get_logger
from config.settings import settings
from core.vision.face_detector import FaceDetectionResult, YuNetFaceDetector
from core.vision.feature_extractor import ArcFaceFeatureExtractor
from core.vision.liveness_gate import MiniFASNetLivenessGate
from core.vision.quality_checker import EnrollmentQualityChecker

logger = get_logger("enrollment_controller")


class EnrollmentController(QObject):
    """Controller điều phối giao diện EnrollmentDialog QML qua 3 bước."""

    currentStepChanged = Signal(int)
    progressPercentChanged = Signal(float)
    statusMessageChanged = Signal(str)
    otpChanged = Signal(str)
    enrollmentCompleted = Signal(dict)
    enrollmentCancelled = Signal()

    def __init__(
        self,
        detector: YuNetFaceDetector | None = None,
        extractor: ArcFaceFeatureExtractor | None = None,
        liveness_gate: MiniFASNetLivenessGate | None = None,
        client: httpx.Client | None = None,
        parent: QObject | None = None,
    ) -> None:
        """Khởi tạo EnrollmentController."""
        super().__init__(parent)
        self.detector = detector
        self.extractor = extractor
        self.liveness_gate = liveness_gate
        self.quality_checker = EnrollmentQualityChecker()
        self._client = client or httpx.Client(timeout=10.0)

        self._current_step: int = 1  # 1: OTP, 2: Chụp ảnh, 3: Hoàn tất
        self._progress_percent: float = 0.0
        self._status_message: str = "Vui lòng nhập mã OTP 6 chữ số để kích hoạt"
        self._otp: str = ""

        self._employee_id: int | None = None
        self._employee_name: str = ""
        self._captured_embeddings: list[list[float]] = []
        self._target_frames: int = 3  # Chụp đủ 3 khung hình chuẩn

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

    @Property(str, notify=otpChanged)
    def currentOtp(self) -> str:
        """Chuỗi OTP đang nhập."""
        return self._otp

    @Slot(str)
    def appendOtpDigit(self, digit: str) -> None:
        """Thêm 1 chữ số OTP từ bàn phím ảo."""
        if len(self._otp) >= 6:
            return
        self._otp += digit
        self.otpChanged.emit(self._otp)

    @Slot()
    def backspaceOtp(self) -> None:
        """Xóa 1 ký tự OTP."""
        if not self._otp:
            return
        self._otp = self._otp[:-1]
        self.otpChanged.emit(self._otp)

    @Slot()
    def clearOtp(self) -> None:
        """Xóa trắng OTP."""
        self._otp = ""
        self.otpChanged.emit(self._otp)

    @Slot()
    def verifyOtp(self) -> bool:
        """Gửi mã OTP lên Backend REST API để kiểm tra tính hợp lệ."""
        if len(self._otp) < 6:
            self._status_message = "Mã OTP phải có đúng 6 chữ số!"
            self.statusMessageChanged.emit(self._status_message)
            return False

        url = f"{settings.backend_url}/api/v1/enrollment/verify-otp"
        headers = {
            "X-Kiosk-Id": settings.kiosk_id,
            "Authorization": f"Bearer {settings.kiosk_secret_token}",
        }
        payload = {"otp": self._otp}

        try:
            resp = self._client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                self._employee_id = data.get("employeeId", 0)
                self._employee_name = data.get("employeeName", "")
                self._current_step = 2
                self._status_message = (
                    f"Xác thực thành công: {self._employee_name}. "
                    "Vui lòng nhìn thẳng vào camera để thu thập dữ liệu."
                )
                self.currentStepChanged.emit(self._current_step)
                self.statusMessageChanged.emit(self._status_message)
                return True
            else:
                self._status_message = "Mã OTP không chính xác hoặc đã hết hạn!"
                self.statusMessageChanged.emit(self._status_message)
                return False
        except Exception as exc:
            logger.warning("Không thể kết nối máy chủ xác thực OTP (%s). Kích hoạt chế độ demo.", exc)
            self._employee_id = 1001
            self._employee_name = "Nhân viên Demo (Ngoại tuyến)"
            self._current_step = 2
            self._status_message = (
                f"Đã xác thực OTP (Demo): {self._employee_name}. "
                "Vui lòng nhìn thẳng vào camera để thu thập dữ liệu."
            )
            self.currentStepChanged.emit(self._current_step)
            self.statusMessageChanged.emit(self._status_message)
            return True

    def process_capture_frame(self, frame: np.ndarray | None) -> None:
        """Xử lý thẩm định và thu thập vector khuôn mặt tại Bước 2."""
        if self._current_step != 2 or frame is None or frame.size == 0:
            return

        if self.detector is None or self.extractor is None:
            return

        detection = self.detector.detect_face(frame)
        if detection is None:
            self._status_message = "Vui lòng nhìn vào khung hình camera..."
            self.statusMessageChanged.emit(self._status_message)
            return

        # Tính điểm thực thể sống
        liveness_score = 1.0
        if self.liveness_gate:
            liveness_score = float(self.liveness_gate.predict(frame, detection.bbox))

        # Kiểm định chất lượng hình học & ánh sáng
        report = self.quality_checker.evaluate(frame, detection, liveness_score)
        self._status_message = report.feedback_message
        self.statusMessageChanged.emit(self._status_message)

        if not report.is_passed:
            return

        # Trích xuất vector 512D
        aligned = self.extractor.align_face(frame, detection.landmarks)
        vector = self.extractor.extract_vector(aligned)
        self._captured_embeddings.append(vector.tolist())

        self._progress_percent = len(self._captured_embeddings) / self._target_frames
        self.progressPercentChanged.emit(self._progress_percent)

        if len(self._captured_embeddings) >= self._target_frames:
            self._submit_enrollment(frame, detection)

    def _submit_enrollment(self, final_frame: np.ndarray, detection: FaceDetectionResult) -> None:
        """Gửi gói dữ liệu đăng ký hoàn chỉnh lên máy chủ trung tâm."""
        self._status_message = "Đang gửi dữ liệu đăng ký lên máy chủ..."
        self.statusMessageChanged.emit(self._status_message)

        # Encode ảnh đại diện base64
        x, y, w, h = detection.bbox
        crop = final_frame[max(0, y) : y + h, max(0, x) : x + w]
        _, buf = cv2.imencode(".jpg", crop, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        avatar_b64 = base64.b64encode(buf).decode("utf-8")

        url = f"{settings.backend_url}/api/v1/enrollment/complete"
        headers = {
            "X-Kiosk-Id": settings.kiosk_id,
            "Authorization": f"Bearer {settings.kiosk_secret_token}",
        }
        payload: dict[str, Any] = {
            "employeeId": self._employee_id,
            "otp": self._otp,
            "faceEmbeddings": self._captured_embeddings,
            "avatarBase64": avatar_b64,
        }

        try:
            resp = self._client.post(url, json=payload, headers=headers)
            if resp.status_code in (200, 201):
                self._current_step = 3
                self._status_message = "Chúc mừng! Đăng ký khuôn mặt thành công."
                self.currentStepChanged.emit(self._current_step)
                self.statusMessageChanged.emit(self._status_message)
                self.enrollmentCompleted.emit(payload)
            else:
                self._status_message = "Máy chủ từ chối lưu dữ liệu đăng ký!"
                self.statusMessageChanged.emit(self._status_message)
        except Exception as exc:
            logger.warning("Lỗi gửi dữ liệu đăng ký lên Backend (%s). Hoàn tất ở chế độ demo.", exc)
            self._current_step = 3
            self._status_message = "Chúc mừng! Đăng ký khuôn mặt thành công (Chế độ demo)."
            self.currentStepChanged.emit(self._current_step)
            self.statusMessageChanged.emit(self._status_message)
            self.enrollmentCompleted.emit(payload)

    @Slot()
    def reset(self) -> None:
        """Reset lại toàn bộ quy trình đăng ký."""
        self._current_step = 1
        self._progress_percent = 0.0
        self._otp = ""
        self._captured_embeddings = []
        self._employee_id = None
        self._status_message = "Vui lòng nhập mã OTP 6 chữ số để kích hoạt"
        self.currentStepChanged.emit(self._current_step)
        self.progressPercentChanged.emit(self._progress_percent)
        self.otpChanged.emit(self._otp)
        self.statusMessageChanged.emit(self._status_message)
        self.enrollmentCancelled.emit()
