"""Bộ ca kiểm thử đơn vị cho PinController và EnrollmentController (Phase 3: Dialogs).

Kiểm tra:
1. PinController:
   - Gõ số, xóa 1 ký tự, xóa toàn bộ qua bàn phím ảo
   - Xác thực mã PIN hợp lệ / sai mã PIN
   - Cơ chế khóa bàn phím sau 5 lần sai (Lockout 15 phút)
2. EnrollmentController:
   - Gõ mã OTP 6 số, xóa ký tự
   - Gửi xác thực OTP (thành công chuyển sang bước 2, thất bại báo lỗi)
   - Thu thập ảnh đạt chuẩn và tự động kích hoạt gửi gói đăng ký
   - Reset hủy bỏ quy trình
"""

from unittest.mock import MagicMock

import httpx
import numpy as np
import pytest

from core.security.pin_security import PinSecurityManager
from core.vision.face_detector import FaceDetectionResult
from presentation.controllers.enrollment_controller import EnrollmentController
from presentation.controllers.pin_controller import PinController


def _create_mock_detection(is_valid: bool = True) -> FaceDetectionResult:
    landmarks = np.array(
        [[150, 150], [200, 150], [175, 180], [160, 220], [190, 220]],
        dtype=np.float32,
    )
    return FaceDetectionResult(
        bbox=(280, 142, 80, 100) if is_valid else (10, 10, 30, 30),
        landmarks=landmarks,
        score=0.98,
        euler_angles=(2.0, 0.0, 0.0),
        is_valid_size=is_valid,
        is_tilted=False,
    )


# ------------------------------------------------------------------------------
# 1. Kiểm thử PinController
# ------------------------------------------------------------------------------

def test_pin_controller_typing_and_backspace(qapp):
    """Kiểm tra gõ số, backspace và clear trên bàn phím ảo."""
    controller = PinController()
    assert controller.currentPin == ""
    assert not controller.isLocked

    # Gõ "1234"
    controller.appendDigit("1")
    controller.appendDigit("2")
    controller.appendDigit("3")
    controller.appendDigit("4")
    assert controller.currentPin == "1234"

    # Xóa 1 số -> "123"
    controller.backspace()
    assert controller.currentPin == "123"

    # Xóa trắng -> ""
    controller.clear()
    assert controller.currentPin == ""


def test_pin_controller_submission(qapp):
    """Kiểm tra tín hiệu pinSubmitted khi nộp mã PIN hợp lệ."""
    controller = PinController()
    controller.set_employee_code("NV-1005")

    submitted_payload = []
    controller.pinSubmitted.connect(lambda emp_code, pin: submitted_payload.append((emp_code, pin)))

    # Nhập mã < 6 số -> không gửi
    controller.appendDigit("1")
    controller.appendDigit("2")
    controller.submitPin()
    assert len(submitted_payload) == 0

    # Nhập đủ 6 số -> phát tín hiệu (employee_code, pin)
    controller.appendDigit("3")
    controller.appendDigit("4")
    controller.appendDigit("5")
    controller.appendDigit("6")
    controller.submitPin()
    assert len(submitted_payload) == 1
    assert submitted_payload[0] == ("NV-1005", "123456")


def test_pin_controller_lockout_on_consecutive_failures(qapp):
    """Kiểm tra khóa bàn phím sau 5 lần nhập sai mã PIN."""
    security = PinSecurityManager(max_attempts=3, lockout_minutes=5)
    controller = PinController(security_manager=security)

    controller.on_verification_failure()
    assert not controller.isLocked
    controller.on_verification_failure()
    assert not controller.isLocked

    # Lần 3 vượt ngưỡng -> Lockout
    controller.on_verification_failure()
    assert controller.isLocked
    assert controller.remainingSeconds > 0
    assert "Đã khóa bàn phím" in controller.statusMessage

    # Khi bị khóa, không cho phép gõ thêm
    controller.appendDigit("9")
    assert controller.currentPin == ""


# ------------------------------------------------------------------------------
# 2. Kiểm thử EnrollmentController
# ------------------------------------------------------------------------------

def test_enrollment_controller_otp_typing(qapp):
    """Kiểm tra nhập mã OTP trên EnrollmentController."""
    controller = EnrollmentController()
    assert controller.currentStep == 1
    assert controller.currentOtp == ""

    for digit in "654321":
        controller.appendOtpDigit(digit)
    assert controller.currentOtp == "654321"

    controller.backspaceOtp()
    assert controller.currentOtp == "65432"

    controller.clearOtp()
    assert controller.currentOtp == ""


def test_enrollment_controller_verify_otp(qapp):
    """Kiểm tra xác thực OTP qua REST API mock."""
    mock_client = MagicMock(spec=httpx.Client)
    controller = EnrollmentController(client=mock_client)

    # Nhập chưa đủ 6 số
    controller.appendOtpDigit("1")
    assert not controller.verifyOtp()

    # Nhập đủ 6 số nhưng server trả 400
    controller.clearOtp()
    for d in "123456":
        controller.appendOtpDigit(d)

    mock_client.post.return_value = httpx.Response(400, json={"message": "Invalid OTP"})
    assert not controller.verifyOtp()
    assert controller.currentStep == 1

    # Server trả 200 OK -> Chuyển sang Bước 2
    mock_client.post.return_value = httpx.Response(
        200,
        json={"employeeId": 2002, "employeeName": "Nguyen Van A"},
    )
    assert controller.verifyOtp()
    assert controller.currentStep == 2
    assert "Nguyen Van A" in controller.statusMessage


def test_enrollment_controller_process_frame_and_submit(qapp):
    """Kiểm tra thu thập 3 frame đạt chuẩn và kích hoạt hoàn tất đăng ký."""
    mock_client = MagicMock(spec=httpx.Client)
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection(is_valid=True)

    extractor = MagicMock()
    extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
    extractor.extract_vector.return_value = np.random.randn(512).astype(np.float32)

    liveness_gate = MagicMock()
    liveness_gate.predict.return_value = 0.98

    controller = EnrollmentController(
        detector=detector,
        extractor=extractor,
        liveness_gate=liveness_gate,
        client=mock_client,
        capture_interval=0.0,
    )

    # Giả lập đã qua bước 1
    controller._current_step = 2
    controller._employee_id = 2002
    controller._otp = "123456"

    # Mock quality checker trả về đạt chuẩn
    controller.quality_checker = MagicMock()
    mock_report = MagicMock()
    mock_report.is_passed = True
    mock_report.feedback_message = "Khuôn mặt đạt chuẩn!"
    controller.quality_checker.evaluate.return_value = mock_report

    mock_client.post.return_value = httpx.Response(200, json={"status": "SUCCESS"})

    dummy_frame = np.ones((480, 640, 3), dtype=np.uint8) * 128

    # Frame 1: 33%
    controller.process_capture_frame(dummy_frame)
    assert pytest.approx(controller.progressPercent, 0.05) == 0.33

    # Frame 2: 66%
    controller.process_capture_frame(dummy_frame)
    assert pytest.approx(controller.progressPercent, 0.05) == 0.66

    # Frame 3: Hoàn tất -> chuyển sang Bước 3
    controller.process_capture_frame(dummy_frame)
    assert controller.progressPercent == 1.0
    assert controller.currentStep == 3
    assert "thành công" in controller.statusMessage.lower()


def test_enrollment_controller_real_quality_checker_integration(qapp):
    """Kiểm tra gọi thực tế với EnrollmentQualityChecker thật không bị TypeError."""
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection(is_valid=True)

    extractor = MagicMock()
    extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
    extractor.extract_vector.return_value = np.random.randn(512).astype(np.float32)

    liveness_gate = MagicMock()
    liveness_gate.predict.return_value = 0.95

    controller = EnrollmentController(
        detector=detector,
        extractor=extractor,
        liveness_gate=liveness_gate,
    )
    controller._current_step = 2
    controller._employee_id = 1001

    # Tạo frame giả lập với kết cấu để đạt độ sắc nét
    sharp_frame = np.random.randint(0, 256, (480, 640, 3), dtype=np.uint8)

    # Gọi process_capture_frame - không được ném ngoại lệ TypeError hay IndexError
    controller.process_capture_frame(sharp_frame)
    assert controller.currentStep in (2, 3)
    assert controller.statusMessage != ""


def test_enrollment_controller_manual_complete_step(qapp):
    """Kiểm tra nút hoàn tất thủ công bước 2 sang bước 3 (CHỈ ở chế độ demo)."""
    # Production (demo_mode=False): completeCaptureStep bị chặn
    controller = EnrollmentController()
    controller._current_step = 2
    controller.completeCaptureStep()
    assert controller.currentStep == 2

    # Demo mode: cho phép hoàn tất thủ công
    demo_controller = EnrollmentController(demo_mode=True)
    demo_controller._current_step = 2
    demo_controller.completeCaptureStep()
    assert demo_controller.currentStep == 3
    assert demo_controller.progressPercent == 1.0
    assert "thành công" in demo_controller.statusMessage.lower()

    # Kiểm tra setter currentStep
    controller.currentStep = 1
    assert controller.currentStep == 1


def test_tst_ksk_026_api_contract_alignment(qapp):
    """TST-KSK-026: Kiểm thử hợp đồng API xác thực OTP và nạp mẫu theo chuẩn Backend."""
    mock_client = MagicMock(spec=httpx.Client)
    controller = EnrollmentController(client=mock_client)

    # 1. Nhập OTP và gọi verify-otp
    for d in "123456":
        controller.appendOtpDigit(d)

    mock_client.post.return_value = httpx.Response(
        200,
        json={
            "code": "OTP_VERIFIED",
            "message": "Xác thực mã OTP thành công",
            "data": {
                "sessionToken": "test-session-token-xyz",
                "employeeId": 888,
                "employeeCode": "NV-888",
                "fullName": "Tran Van Test",
                "department": "Engineering",
            },
        },
    )

    ok = controller.verifyOtp()
    assert ok is True
    assert controller.currentStep == 2
    assert controller.employeeId == 888
    assert controller.employeeName == "Tran Van Test"
    assert controller._session_token == "test-session-token-xyz"

    # Xác minh mock_client nhận đúng url và payload
    verify_call = mock_client.post.call_args_list[0]
    verify_url = verify_call[0][0]
    verify_payload = verify_call[1]["json"]
    verify_headers = verify_call[1]["headers"]

    assert "/kiosk/verify-otp" in verify_url
    assert verify_payload["otp"] == "123456"
    assert "kioskId" in verify_payload
    assert "X-Kiosk-Id" in verify_headers
    assert "X-Kiosk-Secret" in verify_headers

    # 2. Giả lập nạp 3 embeddings và submit enrollment
    vec1 = np.ones(512, dtype=np.float32)
    vec1 = vec1 / np.linalg.norm(vec1)
    controller._captured_embeddings = [vec1.tolist(), vec1.tolist()]

    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    dummy_detection = _create_mock_detection(is_valid=True)

    mock_client.post.return_value = httpx.Response(
        200,
        json={
            "code": "FACE_ENROLLED",
            "message": "Đăng ký khuôn mặt thành công",
            "data": {"employeeId": 888, "status": "ACTIVE"},
        },
    )

    completed_events = []
    controller.enrollmentCompleted.connect(lambda p: completed_events.append(p))

    controller._submit_enrollment(dummy_frame, dummy_detection)

    assert controller.currentStep == 3
    assert len(completed_events) == 1
    assert completed_events[0]["employeeId"] == 888

    # Xác minh request enroll-face
    enroll_call = mock_client.post.call_args_list[1]
    enroll_url = enroll_call[0][0]
    enroll_payload = enroll_call[1]["json"]

    assert "/kiosk/enroll-face" in enroll_url
    assert enroll_payload["otp"] == "123456"
    assert enroll_payload["sessionToken"] == "test-session-token-xyz"
    assert len(enroll_payload["vector512"]) == 512
    # L2 norm phải bằng 1.0 (sai số float 1e-4)
    vec_norm = np.linalg.norm(np.array(enroll_payload["vector512"]))
    assert pytest.approx(vec_norm, 1e-4) == 1.0


