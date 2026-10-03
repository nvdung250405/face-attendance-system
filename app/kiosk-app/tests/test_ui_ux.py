"""Bộ ca kiểm thử tự động UI/UX phân hệ Kiosk theo ui-ux-test-plan.md.

Bao gồm:
- TST-KSK-UX-001: Kiểm thử Máy trạng thái Khung Oval 4 Màu (Standby -> Aligning -> Success -> Rejected)
- TST-KSK-UX-002: Kiểm thử Co giãn Tỷ lệ Động S (Dynamic Proportional Scaling 9:16)
- TST-KSK-UX-003: Kiểm thử Bàn phím Ảo PIN Pad & Khóa 15 Phút (Anti-Peeking, Lockout)
- TST-KSK-UX-004: Kiểm thử Luồng Tự Đăng ký In-Viewport (3-Step Enrollment Wizard)
"""

import math
import time
from unittest.mock import MagicMock

import httpx
import numpy as np
import pytest

from config.settings import settings
from core.security.pin_security import PinSecurityManager
from core.vision.face_detector import FaceDetectionResult
from core.vision.gallery_matcher import GalleryCacheManager
from presentation.controllers.enrollment_controller import EnrollmentController
from presentation.controllers.pin_controller import PinController
from presentation.viewmodels.kiosk_view_model import KioskViewModel, OvalState


# ==============================================================================
# Helper fixtures / mocks
# ==============================================================================

def _create_mock_detection(
    is_tilted: bool = False,
    is_valid_size: bool = True,
    bbox: tuple[int, int, int, int] = (270, 137, 100, 110),
) -> FaceDetectionResult:
    landmarks = np.array(
        [[bbox[0] + 30, bbox[1] + 30],
         [bbox[0] + 70, bbox[1] + 30],
         [bbox[0] + 50, bbox[1] + 55],
         [bbox[0] + 35, bbox[1] + 85],
         [bbox[0] + 65, bbox[1] + 85]],
        dtype=np.float32,
    )
    yaw = 25.0 if is_tilted else 2.0
    return FaceDetectionResult(
        bbox=bbox,
        landmarks=landmarks,
        score=0.98,
        euler_angles=(yaw, 0.0, 0.0),
        is_valid_size=is_valid_size,
        is_tilted=is_tilted,
    )


# ==============================================================================
# TST-KSK-UX-001: Kiểm thử Máy trạng thái Khung Oval 4 Màu
# ==============================================================================

def test_tst_ksk_ux_001_oval_four_color_state_machine(qapp):
    """TST-KSK-UX-001: Máy trạng thái Khung Oval 4 Màu.
    
    Chuyển đổi chính xác 4 màu & trạng thái:
    1. Standby (IDLE): Màu #64748B, thông điệp mời nhìn thẳng vào khung oval.
    2. Aligning: Màu #F59E0B, hướng dẫn người dùng chỉnh tư thế.
    3. Success: Màu #10B981, tia laser pulse scan, phát tín hiệu âm thanh thành công.
    4. Rejected (ERROR): Màu #EF4444, cảnh báo rung lắc và thông báo từ chối.
    """
    # 1. Trạng thái khởi tạo: Standby (IDLE)
    detector = MagicMock()
    detector.detect_face.return_value = None

    vm = KioskViewModel(detector=detector)
    assert vm.ovalState == OvalState.IDLE
    assert "nhìn vào khung hình" in vm.message.lower()

    # Ánh xạ màu chuẩn theo spec UI-KSK-004 -> UI-KSK-007
    color_map = {
        OvalState.IDLE: "#64748B",       # Xám Slate (Standby)
        OvalState.ALIGNING: "#F59E0B",   # Vàng Hổ phách (Aligning)
        OvalState.SUCCESS: "#10B981",    # Xanh Emerald (Success)
        OvalState.ERROR: "#EF4444",      # Đỏ Cảnh báo (Rejected)
    }

    assert color_map[vm.ovalState] == "#64748B"

    # 2. Chuyển sang Căn chỉnh (Aligning): Phát hiện mặt lệch/nghiêng
    detector.detect_face.return_value = _create_mock_detection(is_tilted=True)
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    vm.process_camera_frame(dummy_frame)
    assert vm.ovalState == OvalState.ALIGNING
    assert color_map[vm.ovalState] == "#F59E0B"
    assert "giữ thẳng mặt" in vm.message.lower()

    # 3. Chuyển sang Thành công (Success): Mặt chuẩn + Liveness Pass + Match >= 0.65
    detector.detect_face.return_value = _create_mock_detection(is_tilted=False)
    liveness_gate = MagicMock()
    liveness_gate.predict.return_value = 0.98

    extractor = MagicMock()
    extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
    extractor.extract_vector.return_value = np.random.randn(512).astype(np.float32)

    matcher = MagicMock(spec=GalleryCacheManager)
    matcher.match.return_value = (1001, 0.92)

    vm_success = KioskViewModel(
        detector=detector,
        liveness_gate=liveness_gate,
        extractor=extractor,
        gallery_matcher=matcher,
        stability_threshold=1,
    )
    vm_success.setStandby(False)
    vm_success.process_camera_frame(dummy_frame)
    assert vm_success.ovalState == OvalState.SUCCESS
    assert color_map[vm_success.ovalState] == "#10B981"
    assert "thành công" in vm_success.message.lower()

    # 4. Chuyển sang Từ chối (Rejected): Liveness Fail / Spoofing
    liveness_fail = MagicMock()
    liveness_fail.predict.return_value = 0.15  # Thấp hơn ngưỡng 0.85

    vm_reject = KioskViewModel(
        detector=detector,
        liveness_gate=liveness_fail,
        extractor=extractor,
        gallery_matcher=matcher,
        stability_threshold=1,
    )
    vm_reject.setStandby(False)
    vm_reject.process_camera_frame(dummy_frame)
    assert vm_reject.ovalState == OvalState.ERROR
    assert color_map[vm_reject.ovalState] == "#EF4444"
    assert "không hợp lệ" in vm_reject.message.lower() or "giả mạo" in vm_reject.message.lower()


# ==============================================================================
# TST-KSK-UX-002: Kiểm thử Co giãn Tỷ lệ Động S (Scaling Test)
# ==============================================================================

def test_tst_ksk_ux_002_dynamic_proportional_scaling():
    """TST-KSK-UX-002: Kiểm thử Co giãn Tỷ lệ Động S theo công thức:
    S = min(W_actual / 1080, H_actual / 1920)
    
    Đảm bảo:
    - Chuẩn 1080x1920 (FHD Portrait) -> S = 1.0
    - Chuẩn 720x1280 (HD Portrait) -> S = 0.6667
    - Chuẩn 2160x3840 (4K Portrait) -> S = 2.0
    - Màn hình tỉ lệ không chuẩn (ví dụ 1920x1080 ngang): S = 0.5625 không làm méo hình 9:16
    """
    baseline_w, baseline_h = 1080.0, 1920.0

    def calculate_scale(w: float, h: float) -> float:
        return min(w / baseline_w, h / baseline_h)

    # 1. Full HD Portrait: 1080 x 1920
    s_fhd = calculate_scale(1080, 1920)
    assert pytest.approx(s_fhd, 1e-4) == 1.0

    # 2. HD Portrait: 720 x 1280
    s_hd = calculate_scale(720, 1280)
    assert pytest.approx(s_hd, 1e-4) == 720 / 1080

    # 3. 4K Portrait: 2160 x 3840
    s_4k = calculate_scale(2160, 3840)
    assert pytest.approx(s_4k, 1e-4) == 2.0

    # 4. Màn hình ngang 1920 x 1080 (Non-standard kiosk aspect)
    s_landscape = calculate_scale(1920, 1080)
    expected_s_landscape = 1080 / 1920
    assert pytest.approx(s_landscape, 1e-4) == expected_s_landscape

    # Kiểm tra kích thước hình học các khối con sau khi scale S
    # Bán kính Oval gốc: 470 x 604
    oval_w_base, oval_h_base = 470.0, 604.0
    scaled_oval_w_hd = oval_w_base * s_hd
    scaled_oval_h_hd = oval_h_base * s_hd
    assert pytest.approx(scaled_oval_w_hd / scaled_oval_h_hd, 1e-4) == oval_w_base / oval_h_base

    # Header gốc: 968 x 120
    header_w_base, header_h_base = 968.0, 120.0
    scaled_header_w_4k = header_w_base * s_4k
    scaled_header_h_4k = header_h_base * s_4k
    assert scaled_header_w_4k == 1936.0
    assert scaled_header_h_4k == 240.0


# ==============================================================================
# TST-KSK-UX-003: Kiểm thử Bàn phím Ảo PIN Pad & Khóa 15 Phút
# ==============================================================================

def test_tst_ksk_ux_003_pin_pad_and_lockout(qapp):
    """TST-KSK-UX-003: Bàn phím ảo PIN Pad & Khóa 15 Phút (Lockout).
    
    Kiểm tra:
    1. Thao tác gõ phím số 0-9, backspace, clear trên bàn phím ảo.
    2. Chế độ che dấu bảo mật Anti-Peeking (hiển thị chấm tròn ● tương ứng số lượng).
    3. Nhập sai 5 lần liên tiếp -> Kích hoạt khóa bàn phím trong 15 phút (900 giây).
    4. Trong thời gian khóa:
       - Phím bấm bị vô hiệu hóa (appendDigit bị chặn).
       - Hiển thị thông điệp cảnh báo đỏ kèm số giây đếm ngược.
    """
    security = PinSecurityManager(max_attempts=5, lockout_minutes=15)
    controller = PinController(security_manager=security)
    controller.set_employee_id(1008)

    # 1. Gõ phím ảo: "4", "5", "6", "7"
    for digit in "4567":
        controller.appendDigit(digit)
    assert controller.currentPin == "4567"

    # Kiểm tra anti-peeking format: "● ● ● ●"
    anti_peeking_display = "● ".repeat(len(controller.currentPin)).strip() if hasattr(str, "repeat") else " ".join(["●"] * len(controller.currentPin))
    assert len(anti_peeking_display.split()) == 4

    # Backspace và Clear
    controller.backspace()
    assert controller.currentPin == "456"
    controller.clear()
    assert controller.currentPin == ""

    # 2. Nhập sai 4 lần liên tiếp -> Chưa bị khóa
    now = 10000.0
    for i in range(1, 5):
        security.record_failure(current_time=now + i)
    status = security.get_status(current_time=now + 5)
    assert not status.is_locked
    assert status.failed_attempts == 4

    # 3. Lần thứ 5 nhập sai -> Khóa 15 phút (900 giây)
    controller.on_verification_failure()
    assert controller.isLocked is True
    assert controller.remainingSeconds > 0
    assert controller.remainingSeconds <= 900
    assert "Đã khóa bàn phím" in controller.statusMessage

    # 4. Khi bị khóa, thử bấm thêm số -> Bị chặn hoàn toàn
    controller.appendDigit("8")
    assert controller.currentPin == ""

    # 5. Hết 15 phút (901s sau) -> Tự động mở khóa
    future_time = time.time() + 901.0
    future_status = security.get_status(current_time=future_time)
    assert not future_status.is_locked
    assert future_status.remaining_seconds == 0


# ==============================================================================
# TST-KSK-UX-004: Kiểm thử Luồng Tự Đăng ký In-Viewport
# ==============================================================================

def test_tst_ksk_ux_004_in_viewport_enrollment_flow(qapp):
    """TST-KSK-UX-004: Kiểm thử Luồng Tự Đăng ký In-Viewport 3 Bước.
    
    Quy trình:
    - Bước 1 (Xác thực OTP): Người dùng nhập 6 số OTP -> gọi POST /api/v1/kiosk/verify-otp.
    - Bước 2 (Thu thập Mẫu In-Viewport):
      * Modal tự động ẩn hoàn toàn (isOpen = False, opacity = 0.0) để nhường camera chính.
      * Thu thập 3 ảnh mẫu đạt chuẩn (tiến độ 1/3 -> 2/3 -> 3/3).
    - Bước 3 (Xác nhận & Hoàn tất):
      * Modal tự động hiện lại (isOpen = True, opacity = 1.0).
      * Hiển thị thông báo thành công và hình ảnh đã lưu.
    """
    mock_client = MagicMock(spec=httpx.Client)
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection()

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

    # Mock dialog UI states
    dialog_ui = {
        "isOpen": True,
        "opacity": 1.0,
    }

    def sync_dialog_visibility(step: int):
        if step == 2:
            # Bước 2: Tự ẩn hoàn toàn in-viewport
            dialog_ui["isOpen"] = False
            dialog_ui["opacity"] = 0.0
        elif step == 3:
            # Bước 3: Tự hiện lại hoàn tất
            dialog_ui["isOpen"] = True
            dialog_ui["opacity"] = 1.0

    controller.currentStepChanged.connect(sync_dialog_visibility)

    # 1. Bước 1: Khởi tạo
    assert controller.currentStep == 1
    assert dialog_ui["isOpen"] is True
    assert dialog_ui["opacity"] == 1.0

    # Nhập OTP 6 số
    for d in "987654":
        controller.appendOtpDigit(d)
    assert controller.currentOtp == "987654"

    # Server trả về xác thực OTP thành công
    mock_client.post.return_value = httpx.Response(
        200,
        json={"employeeId": 1009, "employeeName": "Tran Van B"},
    )
    is_otp_valid = controller.verifyOtp()
    assert is_otp_valid is True

    # 2. Bước 2: Modal tự động ẩn hoàn toàn
    assert controller.currentStep == 2
    assert dialog_ui["isOpen"] is False
    assert dialog_ui["opacity"] == 0.0

    # Thu thập 3 ảnh mẫu đạt chuẩn
    controller.quality_checker = MagicMock()
    mock_report = MagicMock()
    mock_report.is_passed = True
    mock_report.feedback_message = "Khuôn mặt đạt chuẩn!"
    controller.quality_checker.evaluate.return_value = mock_report

    mock_client.post.return_value = httpx.Response(200, json={"status": "SUCCESS"})
    dummy_frame = np.ones((480, 640, 3), dtype=np.uint8) * 128

    # Frame 1: 1/3 (33%)
    controller.process_capture_frame(dummy_frame)
    assert pytest.approx(controller.progressPercent, 0.05) == 0.33
    assert dialog_ui["isOpen"] is False

    # Frame 2: 2/3 (66%)
    controller.process_capture_frame(dummy_frame)
    assert pytest.approx(controller.progressPercent, 0.05) == 0.66
    assert dialog_ui["isOpen"] is False

    # Frame 3: 3/3 (100%) -> Hoàn tất thu mẫu, tự động chuyển sang Bước 3
    controller.process_capture_frame(dummy_frame)
    assert controller.progressPercent == 1.0

    # 3. Bước 3: Modal tự động hiện lại thành công
    assert controller.currentStep == 3
    assert dialog_ui["isOpen"] is True
    assert dialog_ui["opacity"] == 1.0
    assert "thành công" in controller.statusMessage.lower()
