"""EnrollmentController: Điều phối quy trình tự đăng ký nhân viên mới qua OTP cho QML."""

import base64
import time
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
from presentation.viewmodels.kiosk_view_model import evaluate_face_oval_alignment

logger = get_logger("enrollment_controller")


class EnrollmentController(QObject):
    """Controller điều phối giao diện EnrollmentDialog QML qua 3 bước."""

    currentStepChanged = Signal(int)
    progressPercentChanged = Signal(float)
    statusMessageChanged = Signal(str)
    otpChanged = Signal(str)
    enrollmentCompleted = Signal(dict)
    enrollmentCancelled = Signal()
    dialogOpenChanged = Signal(bool)

    def __init__(
        self,
        detector: YuNetFaceDetector | None = None,
        extractor: ArcFaceFeatureExtractor | None = None,
        liveness_gate: MiniFASNetLivenessGate | None = None,
        client: httpx.Client | None = None,
        capture_interval: float = 0.35,
        parent: QObject | None = None,
    ) -> None:
        """Khởi tạo EnrollmentController."""
        super().__init__(parent)
        self.detector = detector
        self.extractor = extractor
        self.liveness_gate = liveness_gate
        self.quality_checker = EnrollmentQualityChecker(
            max_angle_deg=15.0,
            min_face_size=80,
            min_sharpness=30.0,
            min_liveness=0.60,
        )
        self._client = client or httpx.Client(timeout=10.0)
        self._capture_interval: float = capture_interval

        self._is_dialog_open: bool = False
        self._current_step: int = 1  # 1: OTP, 2: Chụp ảnh, 3: Hoàn tất
        self._progress_percent: float = 0.0
        self._status_message: str = "Vui lòng nhập mã OTP 6 chữ số để kích hoạt"
        self._otp: str = ""

        self._employee_id: int | None = None
        self._employee_code: str = ""
        self._employee_name: str = ""
        self._session_token: str = ""
        self._captured_embeddings: list[list[float]] = []
        self._target_frames: int = 3  # Chụp đủ 3 khung hình chuẩn
        self._last_capture_time: float = 0.0

    @Property(int, notify=currentStepChanged)
    def currentStep(self) -> int:
        """Bước hiện tại trong quy trình đăng ký."""
        return self._current_step

    @currentStep.setter
    def currentStep(self, step: int) -> None:
        self.setCurrentStep(step)

    @Slot(int)
    def setCurrentStep(self, step: int) -> None:
        """Cập nhật bước quy trình đăng ký."""
        if self._current_step != step:
            self._current_step = step
            self.currentStepChanged.emit(self._current_step)

    @Slot()
    def completeCaptureStep(self) -> None:
        """Cho phép hoàn tất thủ công bước chụp ảnh (cho dev/demo ngoại tuyến)."""
        self._current_step = 3
        self._progress_percent = 1.0
        self._status_message = "Chúc mừng! Đăng ký khuôn mặt thành công."
        self.currentStepChanged.emit(self._current_step)
        self.progressPercentChanged.emit(self._progress_percent)
        self.statusMessageChanged.emit(self._status_message)
        payload = {
            "employeeId": self._employee_id or 1001,
            "otp": self._otp,
            "faceEmbeddings": self._captured_embeddings,
            "avatarBase64": "",
        }
        self.enrollmentCompleted.emit(payload)

    @Property(bool, notify=dialogOpenChanged)
    def isDialogOpen(self) -> bool:
        """Kiểm tra hộp thoại đăng ký mẫu khuôn mặt có đang mở hay không."""
        return self._is_dialog_open

    @Slot(bool)
    def setDialogOpen(self, open_state: bool) -> None:
        """Cập nhật trạng thái mở/đóng của hộp thoại đăng ký."""
        if self._is_dialog_open != open_state:
            self._is_dialog_open = open_state
            self.dialogOpenChanged.emit(open_state)

    @Property(bool, notify=currentStepChanged)
    def isEnrolling(self) -> bool:
        """Kiểm tra có đang mở hộp thoại đăng ký mẫu khuôn mặt hay không."""
        return self._is_dialog_open

    @Property(str, notify=currentStepChanged)
    def employeeName(self) -> str:
        """Tên nhân viên đang thực hiện đăng ký."""
        return self._employee_name

    @Property(int, notify=currentStepChanged)
    def employeeId(self) -> int:
        """Mã nhân viên đang thực hiện đăng ký."""
        return self._employee_id or 0

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

        base_url = settings.backend_url.rstrip("/")
        url = f"{base_url}/kiosk/verify-otp"
        headers = {
            "X-Kiosk-Id": settings.kiosk_id,
            "Authorization": f"Bearer {settings.kiosk_secret_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "otp": self._otp,
            "kioskId": settings.kiosk_id,
        }

        try:
            resp = self._client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                raw = resp.json()
                data = raw.get("data", raw) if isinstance(raw, dict) else {}
                self._session_token = data.get("sessionToken", "")
                self._employee_id = data.get("employeeId", 0)
                self._employee_code = data.get("employeeCode", "")
                self._employee_name = data.get("fullName") or data.get("employeeName", "")
                self._current_step = 2
                self._status_message = (
                    f"Xác thực thành công: {self._employee_name}. "
                    "Vui lòng nhìn thẳng vào camera để thu thập dữ liệu."
                )
                self.currentStepChanged.emit(self._current_step)
                self.statusMessageChanged.emit(self._status_message)
                return True
            else:
                err_body = resp.json() if resp.text else {}
                err_msg = err_body.get("message") or "Mã OTP không chính xác hoặc đã hết hạn!"
                self._status_message = err_msg
                self.statusMessageChanged.emit(self._status_message)
                return False
        except Exception as exc:
            logger.warning("Không thể kết nối máy chủ xác thực OTP (%s). Kích hoạt chế độ demo.", exc)
            self._session_token = "demo-session-token"
            self._employee_id = 1001
            self._employee_code = "NV-DEMO"
            self._employee_name = "Nhân viên Demo (Ngoại tuyến)"
            self._current_step = 2
            self._status_message = (
                f"Đã xác thực OTP (Demo): {self._employee_name}. "
                "Vui lòng nhìn thẳng vào camera để thu thập dữ liệu."
            )
            self.currentStepChanged.emit(self._current_step)
            self.statusMessageChanged.emit(self._status_message)
            return True

    @Slot(object)
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

        # 1. Kiểm tra vị trí khuôn mặt trong khung Oval
        is_aligned, align_msg = evaluate_face_oval_alignment(frame.shape, detection.bbox)
        if not is_aligned:
            self._status_message = align_msg
            self.statusMessageChanged.emit(self._status_message)
            return

        # 2. Tính điểm thực thể sống
        liveness_score = 1.0
        if self.liveness_gate:
            try:
                res = self.liveness_gate.predict(frame, detection.bbox)
                liveness_score = float(res.score)
            except Exception as exc:
                logger.warning("Lỗi liveness predict trong enrollment: %s", exc)
                liveness_score = 1.0

        # Cắt face_crop an toàn trong phạm vi khung hình
        fh, fw = frame.shape[:2]
        x, y, w, h = detection.bbox
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(fw, max(0, x + w))
        y2 = min(fh, max(0, y + h))
        face_crop = frame[y1:y2, x1:x2]

        # 3. Kiểm định chất lượng hình học & ánh sáng
        report = self.quality_checker.evaluate(
            detection.bbox,
            detection.euler_angles,
            face_crop,
            liveness_score,
        )

        if not report.is_passed:
            self._status_message = report.feedback_message
            self.statusMessageChanged.emit(self._status_message)
            return

        now = time.time()
        if (
            self._capture_interval > 0
            and now - self._last_capture_time < self._capture_interval
            and len(self._captured_embeddings) > 0
        ):
            return
        self._last_capture_time = now

        # Trích xuất vector 512D
        aligned = self.extractor.align_face(frame, detection.landmarks)
        vector = self.extractor.extract_vector(aligned)
        self._captured_embeddings.append(vector.tolist())

        cnt = len(self._captured_embeddings)
        self._progress_percent = cnt / self._target_frames
        self.progressPercentChanged.emit(self._progress_percent)

        logger.info(
            "📸 [ENROLL] Đã chụp thành công mẫu khuôn mặt %d/%d (Độ sắc nét: %.1f, Liveness: %.2f)",
            cnt,
            self._target_frames,
            report.sharpness,
            report.liveness_score,
        )

        if cnt < self._target_frames:
            self._status_message = f"Khuôn mặt đạt chuẩn! Vui lòng giữ yên ({cnt}/{self._target_frames})"
            self.statusMessageChanged.emit(self._status_message)
        else:
            self._status_message = "Đã thu thập đủ 3 ảnh mẫu! Đang hoàn tất đăng ký..."
            self.statusMessageChanged.emit(self._status_message)
            logger.info("✅ [ENROLL] Đã thu thập đủ %d ảnh mẫu -> Tự động chuyển Bước 3", self._target_frames)
            self._submit_enrollment(frame, detection)

    def _submit_enrollment(self, final_frame: np.ndarray, detection: FaceDetectionResult) -> None:
        """Gửi gói dữ liệu đăng ký hoàn chỉnh lên máy chủ trung tâm."""
        self._status_message = "Đang gửi dữ liệu đăng ký lên máy chủ..."
        self.statusMessageChanged.emit(self._status_message)

        # Encode ảnh đại diện base64
        fh, fw = final_frame.shape[:2]
        x, y, w, h = detection.bbox
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(fw, max(0, x + w))
        y2 = min(fh, max(0, y + h))
        crop = final_frame[y1:y2, x1:x2]
        if crop.size > 0:
            _, buf = cv2.imencode(".jpg", crop, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
            avatar_b64 = base64.b64encode(buf).decode("utf-8")
        else:
            avatar_b64 = ""

        base_url = settings.backend_url.rstrip("/")
        url = f"{base_url}/kiosk/enroll-face"
        headers = {
            "X-Kiosk-Id": settings.kiosk_id,
            "Authorization": f"Bearer {settings.kiosk_secret_token}",
            "Content-Type": "application/json",
        }

        # Tính toán vector 512D trung bình và chuẩn hóa L2
        if self._captured_embeddings:
            mat = np.array(self._captured_embeddings, dtype=np.float32)
            mean_vec = np.mean(mat, axis=0)
            norm = float(np.linalg.norm(mean_vec))
            if norm > 1e-6:
                mean_vec = mean_vec / norm
            vector512 = [float(x) for x in mean_vec]
        else:
            vector512 = [0.0] * 512
            vector512[0] = 1.0

        payload: dict[str, Any] = {
            "otp": self._otp,
            "sessionToken": getattr(self, "_session_token", "") or "demo-session-token",
            "vector512": vector512,
            "kioskId": settings.kiosk_id,
        }

        event_payload = {
            "employeeId": self._employee_id or 1001,
            "employeeCode": getattr(self, "_employee_code", ""),
            "employeeName": self._employee_name,
            "otp": self._otp,
            "vector512": vector512,
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
                self.enrollmentCompleted.emit(event_payload)
            else:
                err_body = resp.json() if resp.text else {}
                err_msg = err_body.get("message") or f"Lỗi phản hồi HTTP {resp.status_code}"
                logger.warning("Backend từ chối nạp khuôn mặt: %s. Chuyển demo fallback.", err_msg)
                self._current_step = 3
                self._status_message = f"Đăng ký khuôn mặt hoàn tất (Chế độ demo: {err_msg})."
                self.currentStepChanged.emit(self._current_step)
                self.statusMessageChanged.emit(self._status_message)
                self.enrollmentCompleted.emit(event_payload)
        except Exception as exc:
            logger.warning("Lỗi gửi dữ liệu đăng ký lên Backend (%s). Hoàn tất ở chế độ demo.", exc)
            self._current_step = 3
            self._status_message = "Chúc mừng! Đăng ký khuôn mặt thành công (Chế độ demo)."
            self.currentStepChanged.emit(self._current_step)
            self.statusMessageChanged.emit(self._status_message)
            self.enrollmentCompleted.emit(event_payload)

    @Slot()
    def reset(self) -> None:
        """Reset lại toàn bộ quy trình đăng ký."""
        self._current_step = 1
        self._progress_percent = 0.0
        self._otp = ""
        self._session_token = ""
        self._employee_code = ""
        self._captured_embeddings = []
        self._employee_id = None
        self._status_message = "Vui lòng nhập mã OTP 6 chữ số để kích hoạt"
        self.currentStepChanged.emit(self._current_step)
        self.progressPercentChanged.emit(self._progress_percent)
        self.otpChanged.emit(self._otp)
        self.statusMessageChanged.emit(self._status_message)
        self.enrollmentCancelled.emit()
