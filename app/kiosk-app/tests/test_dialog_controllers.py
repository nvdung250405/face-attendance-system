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

from core.vision.face_detector import FaceDetectionResult
from ui.controllers.enrollment_controller import EnrollmentController
from ui.controllers.pin_controller import PinController
from ui.views.pin_dialog import PinSecurityManager


def _create_mock_detection(is_valid: bool = True) -> FaceDetectionResult:
    landmarks = np.array(
        [[150, 150], [200, 150], [175, 180], [160, 220], [190, 220]],
        dtype=np.float32,
    )
    return FaceDetectionResult(
        bbox=(100, 100, 200, 200) if is_valid else (10, 10, 30, 30),
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
    controller.set_employee_id(1005)

    submitted_payload = []
    controller.pinSubmitted.connect(lambda emp_id, pin: submitted_payload.append((emp_id, pin)))

    # Nhập mã < 4 số -> không gửi
    controller.appendDigit("1")
    controller.appendDigit("2")
    controller.submitPin()
    assert len(submitted_payload) == 0

    # Nhập đủ 4 số -> phát tín hiệu
    controller.appendDigit("3")
    controller.appendDigit("4")
    controller.submitPin()
    assert len(submitted_payload) == 1
    assert submitted_payload[0] == (1005, "1234")


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
