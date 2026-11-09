"""Kiểm thử máy trạng thái Guided Multi-Pose và Controller (FEAT-ENROLL-001, Task 7).

Kiểm tra:
1. Quy trình tuần tự 3 tư thế (FRONTAL -> LEFT_TILT -> RIGHT_TILT)
2. Thẩm định góc Euler và câu nhắc điều hướng (Directional Yaw Feedback)
3. Chốt thu nhận vector ArcFace 512D chuẩn hóa L2 = 1.0 cho từng tư thế
4. Xử lý phản hồi từ Backend (200 OK thành công, 400 lỗi -> reset tư thế để thử lại)
5. Tính năng hoàn tất thủ công (Demo mode)
"""

from unittest.mock import MagicMock

import httpx
import numpy as np
import pytest

from core.vision.face_detector import FaceDetectionResult
from presentation.controllers.enrollment_controller import (
    EnrollmentController,
)


def _create_mock_detection(yaw: float = 0.0, pitch: float = 0.0, roll: float = 0.0) -> FaceDetectionResult:
    return FaceDetectionResult(
        bbox=(280, 142, 80, 100),
        landmarks=np.array([[295, 165], [345, 165], [320, 192], [300, 222], [340, 222]], dtype=np.float32),
        score=0.98,
        euler_angles=(yaw, pitch, roll),
        is_valid_size=True,
        is_tilted=False,
    )


def test_enrollment_state_machine_sequential_3_poses(qapp):
    """Kiểm tra máy trạng thái tuần tự chuyển qua 3 tư thế: FRONTAL -> LEFT_TILT -> RIGHT_TILT."""
    mock_client = MagicMock(spec=httpx.Client)
    detector = MagicMock()
    extractor = MagicMock()
    extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
    extractor.extract_vector.return_value = np.ones(512, dtype=np.float32)

    liveness_gate = MagicMock()
    liveness_gate.predict.return_value = 0.95

    controller = EnrollmentController(
        detector=detector,
        extractor=extractor,
        liveness_gate=liveness_gate,
        client=mock_client,
        capture_interval=0.0,
        pose_hold_duration=0.0,
    )

    controller._current_step = 2
    controller._employee_id = 888
    controller._otp = "123456"

    rng = np.random.default_rng(42)
    dummy_frame = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)

    # 1. Bước 1/3: FRONTAL (Yaw = 0.0°)
    detector.detect_face.return_value = _create_mock_detection(yaw=0.0)
    assert controller.currentPose == "FRONTAL"
    assert controller.poseIndex == 0
    assert controller.poseStep == 1
    assert controller.targetYawMin == -5.0
    assert controller.targetYawMax == 5.0
    assert controller.targetDirection == "CENTER"

    controller.process_capture_frame(dummy_frame)
    assert controller.poseIndex == 1
    assert controller.currentPose == "LEFT_TILT"
    assert pytest.approx(controller.progressPercent, 0.05) == 0.33
    assert len(controller.capturedTemplates) == 1
    assert controller.capturedTemplates[0]["poseType"] == "FRONTAL"

    # 2. Bước 2/3: LEFT_TILT (Yaw = 16.0°)
    detector.detect_face.return_value = _create_mock_detection(yaw=16.0)
    assert controller.targetYawMin == 10.0
    assert controller.targetYawMax == 25.0
    assert controller.targetDirection == "LEFT"

    controller.process_capture_frame(dummy_frame)
    assert controller.poseIndex == 2
    assert controller.currentPose == "RIGHT_TILT"
    assert pytest.approx(controller.progressPercent, 0.05) == 0.66
    assert len(controller.capturedTemplates) == 2
    assert controller.capturedTemplates[1]["poseType"] == "LEFT_TILT"

    # 3. Bước 3/3: RIGHT_TILT (Yaw = -16.0°)
    detector.detect_face.return_value = _create_mock_detection(yaw=-16.0)
    assert controller.targetYawMin == -25.0
    assert controller.targetYawMax == -10.0
    assert controller.targetDirection == "RIGHT"

    mock_client.post.return_value = httpx.Response(200, json={"status": "ACTIVATED"})
    controller.process_capture_frame(dummy_frame)

    assert controller.currentStep == 3
    assert controller.progressPercent == 1.0
    assert len(controller.capturedTemplates) == 3
    assert controller.capturedTemplates[2]["poseType"] == "RIGHT_TILT"
    assert "thành công" in controller.statusMessage.lower()

    # Kiểm tra payload gửi lên Backend
    submit_call = mock_client.post.call_args_list[0]
    payload = submit_call[1]["json"]
    assert "templates" in payload
    assert len(payload["templates"]) == 3
    assert [t["poseType"] for t in payload["templates"]] == ["FRONTAL", "LEFT_TILT", "RIGHT_TILT"]
    assert "vector512" in payload
    assert len(payload["vector512"]) == 512
    vec_norm = float(np.linalg.norm(np.array(payload["vector512"])))
    assert pytest.approx(vec_norm, 1e-4) == 1.0


def test_enrollment_directional_yaw_feedback(qapp):
    """Kiểm tra chỉ dẫn hướng dẫn người dùng khi sai góc nghiêng mặt."""
    detector = MagicMock()
    extractor = MagicMock()
    controller = EnrollmentController(detector=detector, extractor=extractor)
    controller._current_step = 2

    dummy_frame = np.ones((480, 640, 3), dtype=np.uint8) * 128

    # FRONTAL nhưng quay mặt sang trái quá nhiều (Yaw = 12°) -> hướng dẫn quay sang phải về giữa
    detector.detect_face.return_value = _create_mock_detection(yaw=12.0)
    controller.process_capture_frame(dummy_frame)
    assert controller.isPoseValid is False
    assert "quay mặt sang phải một chút" in controller.statusMessage

    # FRONTAL nhưng quay mặt sang phải quá nhiều (Yaw = -12°) -> hướng dẫn quay sang trái về giữa
    detector.detect_face.return_value = _create_mock_detection(yaw=-12.0)
    controller.process_capture_frame(dummy_frame)
    assert controller.isPoseValid is False
    assert "quay mặt sang trái một chút" in controller.statusMessage


def test_enrollment_backend_rejection_resets_for_retry(qapp):
    """Kiểm tra khi Backend từ chối (400 INVALID_TEMPLATE_SET) thì reset lại bước chụp để thử lại."""
    mock_client = MagicMock(spec=httpx.Client)
    detector = MagicMock()
    extractor = MagicMock()
    extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
    extractor.extract_vector.return_value = np.ones(512, dtype=np.float32)

    controller = EnrollmentController(
        detector=detector,
        extractor=extractor,
        client=mock_client,
        capture_interval=0.0,
        pose_hold_duration=0.0,
    )
    controller._current_step = 2
    controller._employee_id = 999
    controller._otp = "123456"

    rng = np.random.default_rng(42)
    dummy_frame = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)

    # Chụp đủ 3 bước
    detector.detect_face.return_value = _create_mock_detection(yaw=0.0)
    controller.process_capture_frame(dummy_frame)

    detector.detect_face.return_value = _create_mock_detection(yaw=15.0)
    controller.process_capture_frame(dummy_frame)

    detector.detect_face.return_value = _create_mock_detection(yaw=-15.0)
    # Giả lập backend từ chối
    mock_client.post.return_value = httpx.Response(400, json={"message": "INVALID_TEMPLATE_SET"})
    controller.process_capture_frame(dummy_frame)

    # Không được chuyển sang Bước 3, mà reset về tư thế đầu tiên để người dùng quét lại
    assert controller.currentStep == 2
    assert controller.poseIndex == 0
    assert controller.currentPose == "FRONTAL"
    assert controller.progressPercent == 0.0
    assert "INVALID_TEMPLATE_SET" in controller.statusMessage


def test_enrollment_manual_complete_step_demo(qapp):
    """Kiểm tra chế độ completeCaptureStep trong demo mode tạo đủ 3 templates."""
    controller = EnrollmentController(demo_mode=True)
    controller._current_step = 2
    completed_events = []
    controller.enrollmentCompleted.connect(lambda p: completed_events.append(p))

    controller.completeCaptureStep()
    assert controller.currentStep == 3
    assert controller.progressPercent == 1.0
    assert len(controller.capturedTemplates) == 3
    assert len(completed_events) == 1
    event = completed_events[0]
    assert "templates" in event
    assert len(event["templates"]) == 3
    assert "vector512" in event
    assert len(event["vector512"]) == 512


def test_enrollment_reset_clears_dialog_and_enrolling_state(qapp):
    """FEAT-ENROLL-001 M3: c.reset() dứt khoát xóa isDialogOpen và isEnrolling về False, đồng thời phát tín hiệu."""
    controller = EnrollmentController()

    # 1. Giả lập mở dialog và chuyển sang Bước 2 (Guided Face Capture)
    controller.setDialogOpen(True)
    controller.setCurrentStep(2)
    controller._current_pose_index = 1
    controller._captured_templates = [{"poseType": "FRONTAL", "vector": [0.1] * 512}]
    controller._captured_embeddings = [[0.1] * 512]
    controller._otp = "123456"
    controller._session_token = "sess_xyz"
    controller._employee_id = 999
    controller._employee_name = "Nguyen Van A"

    assert controller.isDialogOpen is True
    assert controller.isEnrolling is True
    assert controller.currentStep == 2

    # Lắng nghe các tín hiệu bắt buộc phải phát ra khi reset
    dialog_signals = []
    step_signals = []
    cancel_signals = []
    controller.dialogOpenChanged.connect(lambda s: dialog_signals.append(s))
    controller.currentStepChanged.connect(lambda s: step_signals.append(s))
    controller.enrollmentCancelled.connect(lambda: cancel_signals.append(True))

    # 2. Thực hiện reset()
    controller.reset()

    # 3. Khẳng định trạng thái sau reset:
    assert controller.isDialogOpen is False, "isDialogOpen bắt buộc phải là False sau khi reset"
    assert controller.isEnrolling is False, "isEnrolling bắt buộc phải là False sau khi reset"
    assert controller.currentStep == 1, "currentStep bắt buộc phải quay về 1"
    assert controller.poseIndex == 0, "poseIndex bắt buộc phải quay về 0"
    assert controller.currentPose == "FRONTAL", "currentPose bắt buộc phải là FRONTAL"
    assert controller.progressPercent == 0.0, "progressPercent bắt buộc phải là 0.0"
    assert controller.currentOtp == "", "currentOtp bắt buộc phải rỗng"
    assert len(controller.capturedTemplates) == 0, "capturedTemplates bắt buộc phải được dọn dẹp"
    assert len(controller._captured_embeddings) == 0, "captured_embeddings bắt buộc phải được dọn dẹp"

    # 4. Khẳng định tín hiệu được phát:
    assert dialog_signals == [False], "dialogOpenChanged(False) bắt buộc phải được phát ra khi reset"
    assert step_signals == [1], "currentStepChanged(1) bắt buộc phải được phát ra khi reset"
    assert len(cancel_signals) == 1, "enrollmentCancelled bắt buộc phải được phát ra khi reset"


def test_is_enrolling_property_notify_signal_binding(qapp):
    """FEAT-ENROLL-001 M3: isEnrolling khai báo notify=dialogOpenChanged để QML cập nhật ngay khi đóng/mở dialog."""
    controller = EnrollmentController()

    # 1. Kiểm tra Qt MetaObject signal binding
    mo = controller.metaObject()
    prop_enrolling = mo.property(mo.indexOfProperty("isEnrolling"))
    prop_dialog = mo.property(mo.indexOfProperty("isDialogOpen"))

    assert prop_enrolling.isValid(), "Thuộc tính isEnrolling phải hợp lệ trong MetaObject"
    assert prop_enrolling.hasNotifySignal(), "Thuộc tính isEnrolling phải có notify signal"
    assert prop_enrolling.notifySignal().name().data().decode() == "dialogOpenChanged", (
        "isEnrolling bắt buộc phải thông báo qua tín hiệu dialogOpenChanged"
    )
    assert prop_dialog.notifySignal().name().data().decode() == "dialogOpenChanged"

    # 2. Kiểm tra thay đổi setDialogOpen độc lập với currentStep
    controller.setDialogOpen(True)
    assert controller.isEnrolling is True
    assert controller.isDialogOpen is True
    assert controller.currentStep == 1

    controller.setDialogOpen(False)
    assert controller.isEnrolling is False
    assert controller.isDialogOpen is False
    assert controller.currentStep == 1
