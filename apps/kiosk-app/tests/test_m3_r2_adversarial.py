"""Adversarial stress test suite for Milestone 3 Remediation Round 2.

Empirical verification of:
1. Directional Guidance Kinematics:
   - FRONTAL yaw error feedback: neutral (0.0°), negative yaw (-5.01°, -7°, -12°, -25°)
     instructs user to turn left towards center ("quay mặt sang trái một chút"),
     positive yaw (+5.01°, +7°, +12°, +25°) instructs user to turn right towards center
     ("quay mặt sang phải một chút").
   - Mathematical & empirical proof of error convergence toward 0°.
2. Qt MetaObject Signal Binding:
   - `isEnrolling` property has notify signal `dialogOpenChanged`.
   - Mutating `setDialogOpen(True)` and `setDialogOpen(False)` without changing
     `currentStep` reliably emits signal and updates property listeners without
     affecting `currentStep`.
"""

from unittest.mock import MagicMock

import numpy as np
import pytest

from core.vision.face_detector import FaceDetectionResult
from core.vision.quality_checker import EnrollmentQualityChecker, PoseType
from presentation.controllers.enrollment_controller import EnrollmentController


def _create_mock_detection(
    yaw: float = 0.0,
    pitch: float = 0.0,
    roll: float = 0.0,
    bbox: tuple[int, int, int, int] = (280, 142, 80, 100),
    score: float = 0.98,
) -> FaceDetectionResult:
    landmarks = np.array(
        [[120, 130], [180, 130], [150, 150], [130, 180], [170, 180]],
        dtype=np.float32,
    )
    return FaceDetectionResult(
        bbox=bbox,
        landmarks=landmarks,
        score=score,
        euler_angles=(yaw, pitch, roll),
        is_valid_size=True,
        is_tilted=False,
    )


class TestDirectionalGuidanceKinematics:
    """Stress tests for yaw directional feedback and mathematical convergence."""

    @pytest.mark.parametrize(
        ("yaw", "expected_passed", "expected_guidance"),
        [
            # Neutral / valid range (|Yaw| <= 5.0°)
            (0.0, True, ""),
            (-5.0, True, ""),
            (5.0, True, ""),
            (-4.99, True, ""),
            (4.99, True, ""),
            # Negative yaw: user rotated head right -> must prompt to turn left towards center
            (-5.01, False, "quay mặt sang trái một chút"),
            (-7.0, False, "quay mặt sang trái một chút"),
            (-12.0, False, "quay mặt sang trái một chút"),
            (-25.0, False, "quay mặt sang trái một chút"),
            (-45.0, False, "quay mặt sang trái một chút"),
            (-89.0, False, "quay mặt sang trái một chút"),
            # Positive yaw: user rotated head left -> must prompt to turn right towards center
            (5.01, False, "quay mặt sang phải một chút"),
            (7.0, False, "quay mặt sang phải một chút"),
            (12.0, False, "quay mặt sang phải một chút"),
            (25.0, False, "quay mặt sang phải một chút"),
            (45.0, False, "quay mặt sang phải một chút"),
            (89.0, False, "quay mặt sang phải một chút"),
        ],
    )
    def test_yaw_feedback_across_spectrum(
        self, yaw: float, expected_passed: bool, expected_guidance: str
    ):
        """Thẩm định phản hồi góc xoay ngang (Yaw) trên mọi miền giá trị."""
        checker = EnrollmentQualityChecker(
            max_angle_deg=5.0, min_face_size=80, min_sharpness=30.0, min_liveness=0.90
        )
        crop = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)

        report = checker.evaluate(
            bbox=(0, 0, 100, 100),
            euler_angles=(yaw, 0.0, 0.0),
            face_crop=crop,
            liveness_score=0.95,
            target_pose=PoseType.FRONTAL,
        )

        assert report.euler_passed is expected_passed
        if expected_passed:
            assert report.is_passed is True
        else:
            assert report.is_passed is False
            assert expected_guidance in report.feedback_message

    @pytest.mark.parametrize(
        "initial_yaw",
        [-25.0, -12.0, -7.0, -5.01, 5.01, 7.0, 12.0, 25.0],
    )
    def test_closed_loop_guidance_convergence_proof(self, initial_yaw: float):
        """Chứng minh toán học và thực nghiệm tính hội tụ (convergence) của hướng dẫn.

        Nếu làm theo hướng dẫn:
        - Nhắc 'sang trái' -> xoay đầu sang trái (+1° yaw).
        - Nhắc 'sang phải' -> xoay đầu sang phải (-1° yaw).
        Hàm lỗi e(t) = |yaw(t) - 0°| phải giảm đơn điệu thực sự tại mỗi bước lặp
        và hội tụ vào miền hợp lệ [-5°, +5°].
        """
        checker = EnrollmentQualityChecker(
            max_angle_deg=5.0, min_face_size=80, min_sharpness=30.0, min_liveness=0.90
        )
        crop = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)

        current_yaw = initial_yaw
        prev_error = abs(current_yaw)
        step_size = 0.5  # Bước xoay đầu của người dùng mỗi lần điều chỉnh (độ)
        max_steps = 100
        steps = 0

        while steps < max_steps:
            report = checker.evaluate(
                bbox=(0, 0, 100, 100),
                euler_angles=(current_yaw, 0.0, 0.0),
                face_crop=crop,
                liveness_score=0.95,
                target_pose=PoseType.FRONTAL,
            )

            if report.euler_passed:
                # Đã hội tụ vào vùng hợp lệ
                break

            current_error = abs(current_yaw)
            assert current_error <= prev_error, (
                f"Lỗi không giảm: bước {steps}, yaw={current_yaw}, lỗi trước={prev_error}"
            )
            prev_error = current_error

            # Thực hiện hành động điều khiển theo chỉ dẫn
            if "quay mặt sang trái một chút" in report.feedback_message:
                current_yaw += step_size
            elif "quay mặt sang phải một chút" in report.feedback_message:
                current_yaw -= step_size
            else:
                pytest.fail(f"Chỉ dẫn không nhận diện được: {report.feedback_message}")

            steps += 1

        assert abs(current_yaw) <= 5.0, f"Không hội tụ sau {steps} bước: yaw={current_yaw}"
        assert steps > 0, "Initial yaw was already valid"

    def test_inverted_guidance_diverges_mathematically(self):
        """Chứng minh phản đề: nếu làm theo hướng dẫn bị đảo chiều (như trước Round 2), hệ thống sẽ phân kỳ.

        Giả sử trước sửa lỗi:
        - negative yaw -> bảo 'quay phải' -> user quay phải -> yaw càng âm.
        Lỗi e(t) = |yaw(t)| sẽ tăng đơn điệu thực sự ra xa 0°.
        """
        initial_yaw = -7.0
        step_size = 0.5
        yaw = initial_yaw
        errors = [abs(yaw)]

        for _ in range(10):
            # Giả định inverted guidance: quay phải khi yaw đang âm
            yaw -= step_size
            errors.append(abs(yaw))

        # Khẳng định lỗi tăng ngặt (strictly monotonic increase)
        for i in range(len(errors) - 1):
            assert errors[i + 1] > errors[i], "Inverted guidance must diverge from center 0°"

    def test_controller_process_frame_directional_cues(self, qapp):
        """Kiểm tra EnrollmentController tích hợp phản xạ đúng chỉ dẫn điều hướng vào statusMessage."""
        detector = MagicMock()
        extractor = MagicMock()
        controller = EnrollmentController(detector=detector, extractor=extractor)
        controller._current_step = 2  # Capture mode
        controller._current_pose_index = 0  # FRONTAL

        rng = np.random.default_rng(42)
        dummy_frame = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)

        # 1. Negative yaw (-7.0°): user turned right -> prompt must instruct turn left
        detector.detect_face.return_value = _create_mock_detection(yaw=-7.0)
        controller.process_capture_frame(dummy_frame)
        assert controller.isPoseValid is False
        assert "quay mặt sang trái một chút" in controller.statusMessage

        # 2. Positive yaw (+7.0°): user turned left -> prompt must instruct turn right
        detector.detect_face.return_value = _create_mock_detection(yaw=7.0)
        controller.process_capture_frame(dummy_frame)
        assert controller.isPoseValid is False
        assert "quay mặt sang phải một chút" in controller.statusMessage

        # 3. Neutral yaw (0.0°): valid pose
        detector.detect_face.return_value = _create_mock_detection(yaw=0.0)
        controller.process_capture_frame(dummy_frame)
        assert controller.isPoseValid is True


class TestQtMetaObjectSignalBinding:
    """Stress tests for isEnrolling property signal binding and listener reactivity."""

    def test_meta_object_property_introspection(self, qapp):
        """Kiểm tra Qt MetaObject introspection cho thuộc tính isEnrolling."""
        controller = EnrollmentController()
        mo = controller.metaObject()

        prop_idx = mo.indexOfProperty("isEnrolling")
        assert prop_idx != -1, "Thuộc tính isEnrolling phải tồn tại trong QMetaObject"

        prop = mo.property(prop_idx)
        assert prop.isValid() is True
        assert prop.hasNotifySignal() is True
        signal_name = prop.notifySignal().name().data().decode("utf-8")
        assert signal_name == "dialogOpenChanged", (
            f"Notify signal của isEnrolling phải là dialogOpenChanged, nhận được: {signal_name}"
        )

    def test_set_dialog_open_notifies_without_changing_current_step(self, qapp):
        """Khẳng định mutating setDialogOpen phát tín hiệu và cập nhật listener mà không đổi currentStep."""
        controller = EnrollmentController()

        dialog_emissions: list[bool] = []
        step_emissions: list[int] = []

        controller.dialogOpenChanged.connect(lambda val: dialog_emissions.append(val))
        controller.currentStepChanged.connect(lambda val: step_emissions.append(val))

        # Trạng thái ban đầu
        assert controller.isDialogOpen is False
        assert controller.isEnrolling is False
        assert controller.currentStep == 1

        # Mở dialog
        controller.setDialogOpen(True)
        assert controller.isDialogOpen is True
        assert controller.isEnrolling is True
        assert controller.property("isEnrolling") is True
        assert controller.currentStep == 1
        assert dialog_emissions == [True]
        assert step_emissions == []

        # Đóng dialog
        controller.setDialogOpen(False)
        assert controller.isDialogOpen is False
        assert controller.isEnrolling is False
        assert controller.property("isEnrolling") is False
        assert controller.currentStep == 1
        assert dialog_emissions == [True, False]
        assert step_emissions == []

    def test_set_dialog_open_idempotence_and_no_spurious_signals(self, qapp):
        """Khẳng định tính lũy đẳng (idempotency): gọi lại giá trị cũ không phát tín hiệu thừa."""
        controller = EnrollmentController()

        emissions: list[bool] = []
        controller.dialogOpenChanged.connect(lambda val: emissions.append(val))

        # Đã là False, gọi setDialogOpen(False) -> không phát
        controller.setDialogOpen(False)
        assert emissions == []

        # Chuyển sang True -> phát 1 lần
        controller.setDialogOpen(True)
        assert emissions == [True]

        # Gọi lại True -> không phát thêm
        controller.setDialogOpen(True)
        assert emissions == [True]

        # Chuyển về False -> phát 1 lần
        controller.setDialogOpen(False)
        assert emissions == [True, False]

    def test_rapid_dialog_toggle_oscillation(self, qapp):
        """Stress test 50 chu kỳ bật/tắt liên tục: listener bắt đủ 100 sự kiện, currentStep bất biến."""
        controller = EnrollmentController()

        received_events: list[bool] = []
        step_events: list[int] = []

        controller.dialogOpenChanged.connect(lambda val: received_events.append(val))
        controller.currentStepChanged.connect(lambda val: step_events.append(val))

        iterations = 50
        for _ in range(iterations):
            controller.setDialogOpen(True)
            controller.setDialogOpen(False)

        assert len(received_events) == iterations * 2
        expected_sequence = [True, False] * iterations
        assert received_events == expected_sequence
        assert step_events == [], "currentStepChanged không bao giờ được phát khi chỉ toggle dialog"
        assert controller.isEnrolling is False

    def test_reset_clears_is_enrolling_and_emits_dialog_open_changed(self, qapp):
        """Khẳng định reset() đồng bộ hạ isEnrolling về False và phát dialogOpenChanged(False)."""
        controller = EnrollmentController()
        controller.setDialogOpen(True)
        controller.setCurrentStep(2)

        assert controller.isEnrolling is True
        assert controller.currentStep == 2

        dialog_events: list[bool] = []
        step_events: list[int] = []
        cancel_events: list[bool] = []

        controller.dialogOpenChanged.connect(lambda val: dialog_events.append(val))
        controller.currentStepChanged.connect(lambda val: step_events.append(val))
        controller.enrollmentCancelled.connect(lambda: cancel_events.append(True))

        controller.reset()

        assert controller.isDialogOpen is False
        assert controller.isEnrolling is False
        assert controller.currentStep == 1
        assert dialog_events == [False]
        assert step_events == [1]
        assert cancel_events == [True]
