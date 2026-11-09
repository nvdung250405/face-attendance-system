"""Adversarial Stress Test Suite for Guided Multi-Pose Enrollment (FEAT-ENROLL-001 Milestone 3).

Challenger: m3_challenger_2
Stress-testing:
1. Sequential 3-pose flow: out-of-order poses, premature advancement, dead-zone rejection (|Yaw| in (5°, 10°)).
2. Stability hold duration (0.25s): rapid transitions and sudden drops in posture, sharpness, liveness, detection.
3. Backend 400 rejection recovery: clean state reset to pose 0 for immediate retry.
4. Robustness against network failure and invalid frame inputs.
"""

from pathlib import Path
from unittest.mock import MagicMock

import httpx
import numpy as np
import pytest
from PySide6.QtCore import QEventLoop, QMetaObject, QTimer, QUrl
from PySide6.QtQml import QQmlComponent, QQmlEngine

# Root of kiosk-app (parent of tests/)
_KIOSK_ROOT = Path(__file__).resolve().parent.parent

from core.vision.face_detector import FaceDetectionResult
from core.vision.quality_checker import EnrollmentQualityChecker, PoseType
from network.http_client import KioskHttpClient
from presentation.controllers.enrollment_controller import EnrollmentController
from presentation.viewmodels.kiosk_view_model import KioskViewModel


def _make_detection(
    bbox: tuple[int, int, int, int] = (280, 142, 80, 100),
    yaw: float = 0.0,
    pitch: float = 0.0,
    roll: float = 0.0,
    score: float = 0.98,
) -> FaceDetectionResult:
    landmarks = np.array(
        [[295, 165], [345, 165], [320, 192], [300, 222], [340, 222]],
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


def _setup_controller(
    mock_client: MagicMock | None = None,
    capture_interval: float = 0.35,
    pose_hold_duration: float = 0.25,
) -> tuple[EnrollmentController, MagicMock, MagicMock, MagicMock]:
    detector = MagicMock()
    extractor = MagicMock()
    extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
    extractor.extract_vector.return_value = np.ones(512, dtype=np.float32)

    liveness_gate = MagicMock()
    liveness_gate.predict.return_value = 0.95

    client = mock_client or MagicMock(spec=httpx.Client)

    ctrl = EnrollmentController(
        detector=detector,
        extractor=extractor,
        liveness_gate=liveness_gate,
        client=client,
        capture_interval=capture_interval,
        pose_hold_duration=pose_hold_duration,
        demo_mode=False,
    )
    ctrl._current_step = 2
    ctrl._employee_id = 101
    ctrl._employee_code = "EMP-00101"
    ctrl._employee_name = "Nguyen Van A"
    ctrl._session_token = "valid-session-token"
    ctrl._otp = "839201"
    return ctrl, detector, extractor, liveness_gate


# ==============================================================================
# Challenge Area 1: Sequential 3-Pose Flow & Dead-Zone Rejection
# ==============================================================================

class TestSequentialFlowAndDeadZone:
    """Stress-test sequential ordering and dead-zone rejection."""

    def test_out_of_order_poses_rejected_at_each_step(self, qapp):
        """Kiosk MUST NOT accept out-of-order poses at any step in the sequence."""
        ctrl, detector, _, _ = _setup_controller(capture_interval=0.0, pose_hold_duration=0.0)
        rng = np.random.default_rng(42)
        sharp_frame = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)

        # --- Step 1: Target is FRONTAL ---
        assert ctrl.currentPose == "FRONTAL"
        assert ctrl.poseIndex == 0

        # Present LEFT_TILT (Yaw = 18.0°) -> REJECTED
        detector.detect_face.return_value = _make_detection(yaw=18.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 0
        assert ctrl.currentPose == "FRONTAL"
        assert ctrl.isPoseValid is False
        assert len(ctrl.capturedTemplates) == 0

        # Present RIGHT_TILT (Yaw = -18.0°) -> REJECTED
        detector.detect_face.return_value = _make_detection(yaw=-18.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 0
        assert ctrl.currentPose == "FRONTAL"
        assert ctrl.isPoseValid is False
        assert len(ctrl.capturedTemplates) == 0

        # Present FRONTAL (Yaw = 0.0°) -> ACCEPTED
        detector.detect_face.return_value = _make_detection(yaw=0.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 1
        assert ctrl.currentPose == "LEFT_TILT"
        assert len(ctrl.capturedTemplates) == 1
        assert ctrl.capturedTemplates[0]["poseType"] == "FRONTAL"

        # --- Step 2: Target is LEFT_TILT ---
        # Present FRONTAL (Yaw = 0.0°) -> REJECTED
        detector.detect_face.return_value = _make_detection(yaw=0.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 1
        assert ctrl.currentPose == "LEFT_TILT"
        assert ctrl.isPoseValid is False
        assert len(ctrl.capturedTemplates) == 1

        # Present RIGHT_TILT (Yaw = -18.0°) -> REJECTED
        detector.detect_face.return_value = _make_detection(yaw=-18.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 1
        assert ctrl.currentPose == "LEFT_TILT"
        assert ctrl.isPoseValid is False
        assert len(ctrl.capturedTemplates) == 1

        # Present LEFT_TILT (Yaw = 15.0°) -> ACCEPTED
        detector.detect_face.return_value = _make_detection(yaw=15.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 2
        assert ctrl.currentPose == "RIGHT_TILT"
        assert len(ctrl.capturedTemplates) == 2
        assert ctrl.capturedTemplates[1]["poseType"] == "LEFT_TILT"

        # --- Step 3: Target is RIGHT_TILT ---
        # Present FRONTAL (Yaw = 0.0°) -> REJECTED
        detector.detect_face.return_value = _make_detection(yaw=0.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 2
        assert ctrl.currentPose == "RIGHT_TILT"
        assert ctrl.isPoseValid is False
        assert len(ctrl.capturedTemplates) == 2

        # Present LEFT_TILT (Yaw = 15.0°) -> REJECTED
        detector.detect_face.return_value = _make_detection(yaw=15.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 2
        assert ctrl.currentPose == "RIGHT_TILT"
        assert ctrl.isPoseValid is False
        assert len(ctrl.capturedTemplates) == 2

    @pytest.mark.parametrize(
        "dead_yaw",
        [
            5.01, 5.5, 6.0, 7.0, 7.5, 8.0, 9.0, 9.5, 9.99,
            -5.01, -5.5, -6.0, -7.0, -7.5, -8.0, -9.0, -9.5, -9.99,
        ],
    )
    def test_dead_zone_yaw_rejection_across_all_poses(self, dead_yaw):
        """Every yaw in |Yaw| in (5.0°, 10.0°) MUST be rejected by all 3 poses."""
        checker = EnrollmentQualityChecker()
        sharp_crop = np.random.randint(0, 256, (140, 140, 3), dtype=np.uint8)

        for pose in [PoseType.FRONTAL, PoseType.LEFT_TILT, PoseType.RIGHT_TILT]:
            rep = checker.evaluate(
                bbox=(50, 50, 140, 140),
                euler_angles=(dead_yaw, 0.0, 0.0),
                face_crop=sharp_crop,
                liveness_score=0.95,
                target_pose=pose,
            )
            assert rep.is_passed is False, f"Dead-zone yaw {dead_yaw}° unexpectedly passed for {pose}"
            assert rep.euler_passed is False

    @pytest.mark.parametrize(
        "pose,boundary_yaw,should_pass",
        [
            # FRONTAL: [-5.0, 5.0]
            (PoseType.FRONTAL, 0.0, True),
            (PoseType.FRONTAL, 5.0, True),
            (PoseType.FRONTAL, -5.0, True),
            (PoseType.FRONTAL, 5.01, False),
            (PoseType.FRONTAL, -5.01, False),
            # LEFT_TILT: [10.0, 25.0]
            (PoseType.LEFT_TILT, 10.0, True),
            (PoseType.LEFT_TILT, 25.0, True),
            (PoseType.LEFT_TILT, 9.99, False),
            (PoseType.LEFT_TILT, 25.01, False),
            # RIGHT_TILT: [-25.0, -10.0]
            (PoseType.RIGHT_TILT, -10.0, True),
            (PoseType.RIGHT_TILT, -25.0, True),
            (PoseType.RIGHT_TILT, -9.99, False),
            (PoseType.RIGHT_TILT, -25.01, False),
        ],
    )
    def test_exact_yaw_boundary_thresholds(self, pose, boundary_yaw, should_pass):
        """Verify strict adherence to exact threshold boundaries."""
        checker = EnrollmentQualityChecker()
        sharp_crop = np.random.randint(0, 256, (140, 140, 3), dtype=np.uint8)

        rep = checker.evaluate(
            bbox=(50, 50, 140, 140),
            euler_angles=(boundary_yaw, 0.0, 0.0),
            face_crop=sharp_crop,
            liveness_score=0.95,
            target_pose=pose,
        )
        assert rep.is_passed is should_pass, (
            f"Pose {pose} at yaw {boundary_yaw}°: expected pass={should_pass}, got {rep.is_passed}"
        )


# ==============================================================================
# Challenge Area 2: Stability Hold Duration (0.25s) & Sudden Drops
# ==============================================================================

class TestStabilityHoldAndDrops:
    """Stress-test 0.25s stability hold requirement under perturbations."""

    def test_stability_hold_duration_blocks_premature_capture(self, monkeypatch, qapp):
        """Controller must require continuous hold >= 0.25s before capturing."""
        ctrl, detector, _, _ = _setup_controller(capture_interval=0.35, pose_hold_duration=0.25)
        rng = np.random.default_rng(42)
        sharp_frame = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)
        detector.detect_face.return_value = _make_detection(yaw=0.0)

        # t = 100.0: first valid frame initiates hold
        monkeypatch.setattr("time.time", lambda: 100.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 0
        assert len(ctrl.capturedTemplates) == 0
        assert ctrl._pose_hold_start == 100.0
        assert ctrl.isPoseValid is True

        # t = 100.10 (elapsed 0.10s < 0.25s): should NOT capture
        monkeypatch.setattr("time.time", lambda: 100.10)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 0
        assert len(ctrl.capturedTemplates) == 0

        # t = 100.24 (elapsed 0.24s < 0.25s): still NOT captured
        monkeypatch.setattr("time.time", lambda: 100.24)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 0
        assert len(ctrl.capturedTemplates) == 0

        # t = 100.26 (elapsed 0.26s >= 0.25s): CAPTURED!
        monkeypatch.setattr("time.time", lambda: 100.26)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 1
        assert len(ctrl.capturedTemplates) == 1
        assert ctrl.capturedTemplates[0]["poseType"] == "FRONTAL"
        assert ctrl._pose_hold_start is None

    def test_sudden_posture_deviation_resets_stability_timer(self, monkeypatch, qapp):
        """If user moves head out of bounds at t=0.15, timer resets and requires another full 0.25s."""
        ctrl, detector, _, _ = _setup_controller(capture_interval=0.35, pose_hold_duration=0.25)
        rng = np.random.default_rng(42)
        sharp_frame = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)

        # t = 100.0: Valid FRONTAL
        detector.detect_face.return_value = _make_detection(yaw=0.0)
        monkeypatch.setattr("time.time", lambda: 100.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl._pose_hold_start == 100.0

        # t = 100.15: Sudden head turn (Yaw = 15° -> invalid for FRONTAL)
        detector.detect_face.return_value = _make_detection(yaw=15.0)
        monkeypatch.setattr("time.time", lambda: 100.15)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl._pose_hold_start is None  # RESET!
        assert ctrl.isPoseValid is False
        assert len(ctrl.capturedTemplates) == 0

        # t = 100.20: User returns to FRONTAL
        detector.detect_face.return_value = _make_detection(yaw=0.0)
        monkeypatch.setattr("time.time", lambda: 100.20)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl._pose_hold_start == 100.20  # New timer started from 100.20!
        assert len(ctrl.capturedTemplates) == 0

        # t = 100.30 (only 0.10s since new start): NOT captured even though total elapsed is 0.30s
        monkeypatch.setattr("time.time", lambda: 100.30)
        ctrl.process_capture_frame(sharp_frame)
        assert len(ctrl.capturedTemplates) == 0
        assert ctrl.poseIndex == 0

        # t = 100.46 (0.26s >= 0.25s since new start): CAPTURED!
        monkeypatch.setattr("time.time", lambda: 100.46)
        ctrl.process_capture_frame(sharp_frame)
        assert len(ctrl.capturedTemplates) == 1
        assert ctrl.poseIndex == 1

    def test_sudden_sharpness_drop_resets_stability_timer(self, monkeypatch, qapp):
        """Blurry frame during hold resets stability timer."""
        ctrl, detector, _, _ = _setup_controller(capture_interval=0.35, pose_hold_duration=0.25)
        rng = np.random.default_rng(42)
        sharp_frame = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)
        blur_frame = np.ones((480, 640, 3), dtype=np.uint8) * 128  # Laplacian = 0

        detector.detect_face.return_value = _make_detection(yaw=0.0)

        # t = 100.0: Sharp frame
        monkeypatch.setattr("time.time", lambda: 100.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl._pose_hold_start == 100.0

        # t = 100.15: Motion blur frame
        monkeypatch.setattr("time.time", lambda: 100.15)
        ctrl.process_capture_frame(blur_frame)
        assert ctrl._pose_hold_start is None
        assert ctrl.isPoseValid is False

    def test_sudden_liveness_drop_resets_stability_timer(self, monkeypatch, qapp):
        """Liveness drop (spoof detection) during hold resets stability timer."""
        ctrl, detector, _, liveness_gate = _setup_controller(capture_interval=0.35, pose_hold_duration=0.25)
        rng = np.random.default_rng(42)
        sharp_frame = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)
        detector.detect_face.return_value = _make_detection(yaw=0.0)

        # t = 100.0: Live
        liveness_gate.predict.return_value = 0.96
        monkeypatch.setattr("time.time", lambda: 100.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl._pose_hold_start == 100.0

        # t = 100.15: Liveness drops to 0.40 (< 0.90)
        liveness_gate.predict.return_value = 0.40
        monkeypatch.setattr("time.time", lambda: 100.15)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl._pose_hold_start is None
        assert ctrl.isPoseValid is False

    def test_sudden_face_disappearance_resets_stability_timer(self, monkeypatch, qapp):
        """User step out of frame during hold resets stability timer."""
        ctrl, detector, _, _ = _setup_controller(capture_interval=0.35, pose_hold_duration=0.25)
        rng = np.random.default_rng(42)
        sharp_frame = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)

        # t = 100.0: Face detected
        detector.detect_face.return_value = _make_detection(yaw=0.0)
        monkeypatch.setattr("time.time", lambda: 100.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl._pose_hold_start == 100.0

        # t = 100.15: Face lost
        detector.detect_face.return_value = None
        monkeypatch.setattr("time.time", lambda: 100.15)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl._pose_hold_start is None
        assert ctrl.isPoseValid is False

    def test_rapid_transition_blocked_by_capture_interval(self, monkeypatch, qapp):
        """After Step 1 capture, Step 2 CANNOT capture during capture_interval cooldown."""
        ctrl, detector, _, _ = _setup_controller(capture_interval=0.35, pose_hold_duration=0.25)
        rng = np.random.default_rng(42)
        sharp_frame = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)

        # Complete Step 1 at t = 100.26
        detector.detect_face.return_value = _make_detection(yaw=0.0)
        monkeypatch.setattr("time.time", lambda: 100.0)
        ctrl.process_capture_frame(sharp_frame)
        monkeypatch.setattr("time.time", lambda: 100.26)
        ctrl.process_capture_frame(sharp_frame)
        assert len(ctrl.capturedTemplates) == 1

        # At t = 100.35 (elapsed 0.09s < 0.35s since last capture):
        # User is already holding valid LEFT_TILT (Yaw = 16.0°)
        detector.detect_face.return_value = _make_detection(yaw=16.0)
        monkeypatch.setattr("time.time", lambda: 100.35)
        ctrl.process_capture_frame(sharp_frame)
        # MUST NOT trigger hold or capture during capture_interval
        assert ctrl._pose_hold_start is None
        assert len(ctrl.capturedTemplates) == 1

        # At t = 100.62 (elapsed 0.36s > 0.35s cooldown):
        # Now stability hold starts
        monkeypatch.setattr("time.time", lambda: 100.62)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl._pose_hold_start == 100.62
        assert len(ctrl.capturedTemplates) == 1

        # At t = 100.88 (elapsed 0.26s >= 0.25s hold):
        # Step 2 captures cleanly
        monkeypatch.setattr("time.time", lambda: 100.88)
        ctrl.process_capture_frame(sharp_frame)
        assert len(ctrl.capturedTemplates) == 2
        assert ctrl.capturedTemplates[1]["poseType"] == "LEFT_TILT"


# ==============================================================================
# Challenge Area 3: Backend 400 Rejection Recovery & End-to-End Retry
# ==============================================================================

class TestBackendRejectionRecovery:
    """Stress-test clean state recovery after Backend 400 rejection."""

    def test_complete_recovery_and_retry_after_backend_400(self, qapp):
        """Verify full retry cycle after 400 INVALID_TEMPLATE_SET rejection."""
        mock_client = MagicMock(spec=httpx.Client)
        ctrl, detector, extractor, liveness_gate = _setup_controller(
            mock_client=mock_client,
            capture_interval=0.0,
            pose_hold_duration=0.0,
        )
        rng = np.random.default_rng(42)
        sharp_frame = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)

        # --- First Attempt: Captures 3 poses, but Backend returns 400 ---
        detector.detect_face.return_value = _make_detection(yaw=0.0)
        ctrl.process_capture_frame(sharp_frame)

        detector.detect_face.return_value = _make_detection(yaw=16.0)
        ctrl.process_capture_frame(sharp_frame)

        detector.detect_face.return_value = _make_detection(yaw=-16.0)
        mock_client.post.return_value = httpx.Response(
            400,
            json={"code": "INVALID_TEMPLATE_SET", "message": "Biometric templates missing pose"},
        )
        ctrl.process_capture_frame(sharp_frame)

        # Assert clean reset state:
        assert ctrl.currentStep == 2, "Must stay in Step 2 for immediate retry"
        assert ctrl.poseIndex == 0, "Pose index must reset to 0"
        assert ctrl.currentPose == "FRONTAL", "Current pose must reset to FRONTAL"
        assert ctrl.progressPercent == 0.0, "Progress must reset to 0%"
        assert len(ctrl.capturedTemplates) == 0, "Captured templates must be cleared"
        assert len(ctrl._captured_embeddings) == 0, "Captured embeddings must be cleared"
        assert ctrl._pose_hold_start is None, "Hold timer must be None"
        assert ctrl.employeeId == 101, "Employee ID must be preserved"
        assert ctrl.employeeName == "Nguyen Van A", "Employee name must be preserved"
        assert ctrl._otp == "839201", "OTP must be preserved"
        assert "INVALID_TEMPLATE_SET" in ctrl.statusMessage or "Biometric templates" in ctrl.statusMessage

        # --- Second Attempt (Immediate Retry without re-authenticating) ---
        # 1. FRONTAL
        detector.detect_face.return_value = _make_detection(yaw=0.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 1
        assert ctrl.currentPose == "LEFT_TILT"
        assert len(ctrl.capturedTemplates) == 1

        # 2. LEFT_TILT
        detector.detect_face.return_value = _make_detection(yaw=18.0)
        ctrl.process_capture_frame(sharp_frame)
        assert ctrl.poseIndex == 2
        assert ctrl.currentPose == "RIGHT_TILT"
        assert len(ctrl.capturedTemplates) == 2

        # 3. RIGHT_TILT - Backend now returns 200 OK
        mock_client.post.return_value = httpx.Response(
            200,
            json={"status": "ACTIVATED", "templateCount": 3},
        )
        completed_signals = []
        ctrl.enrollmentCompleted.connect(lambda p: completed_signals.append(p))

        detector.detect_face.return_value = _make_detection(yaw=-18.0)
        ctrl.process_capture_frame(sharp_frame)

        # Assert successful finalization:
        assert ctrl.currentStep == 3
        assert ctrl.progressPercent == 1.0
        assert len(ctrl.capturedTemplates) == 3
        assert len(completed_signals) == 1
        assert completed_signals[0]["employeeId"] == 101
        assert len(completed_signals[0]["templates"]) == 3
        assert "thành công" in ctrl.statusMessage.lower()

    def test_network_connection_error_resets_cleanly_for_retry(self, qapp):
        """Verify network exception during submit triggers clean reset."""
        mock_client = MagicMock(spec=httpx.Client)
        ctrl, detector, _, _ = _setup_controller(
            mock_client=mock_client,
            capture_interval=0.0,
            pose_hold_duration=0.0,
        )
        rng = np.random.default_rng(42)
        sharp_frame = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)

        detector.detect_face.return_value = _make_detection(yaw=0.0)
        ctrl.process_capture_frame(sharp_frame)
        detector.detect_face.return_value = _make_detection(yaw=16.0)
        ctrl.process_capture_frame(sharp_frame)

        # On 3rd step, simulate network drop
        mock_client.post.side_effect = httpx.ConnectError("Connection refused to backend")
        detector.detect_face.return_value = _make_detection(yaw=-16.0)
        ctrl.process_capture_frame(sharp_frame)

        # Must reset cleanly, not crash
        assert ctrl.currentStep == 2
        assert ctrl.poseIndex == 0
        assert ctrl.currentPose == "FRONTAL"
        assert len(ctrl.capturedTemplates) == 0
        assert "máy chủ" in ctrl.statusMessage.lower()


# ==============================================================================
# Challenge Area 4: Boundary & Input Robustness
# ==============================================================================

class TestInputAndStateRobustness:
    """Stress-test unexpected or malformed inputs and state guards."""

    def test_null_and_empty_frames_handled_gracefully(self, qapp):
        """Empty or None frames must not crash controller."""
        ctrl, _, _, _ = _setup_controller()
        ctrl.process_capture_frame(None)
        ctrl.process_capture_frame(np.zeros((0, 0, 3), dtype=np.uint8))
        assert ctrl.poseIndex == 0
        assert len(ctrl.capturedTemplates) == 0

    def test_frames_ignored_when_not_in_step_2(self, qapp):
        """Frames arriving when currentStep is 1 (OTP) or 3 (Completed) must be ignored."""
        ctrl, detector, _, _ = _setup_controller()
        detector.detect_face.return_value = _make_detection(yaw=0.0)
        sharp_frame = np.ones((480, 640, 3), dtype=np.uint8) * 128

        # Step 1
        ctrl._current_step = 1
        ctrl.process_capture_frame(sharp_frame)
        assert len(ctrl.capturedTemplates) == 0
        assert detector.detect_face.call_count == 0

        # Step 3
        ctrl._current_step = 3
        ctrl.process_capture_frame(sharp_frame)
        assert len(ctrl.capturedTemplates) == 0
        assert detector.detect_face.call_count == 0

    def test_l2_normalization_strictly_enforced_on_all_vectors(self, qapp):
        """All extracted vectors in templates and vector512 must have Euclidean norm == 1.0."""
        mock_client = MagicMock(spec=httpx.Client)
        ctrl, detector, extractor, _ = _setup_controller(
            mock_client=mock_client,
            capture_interval=0.0,
            pose_hold_duration=0.0,
        )
        rng = np.random.default_rng(42)
        sharp_frame = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)

        # Set extractor to return unnormalized vectors with norm != 1.0 (e.g. norm = sqrt(512) ~ 22.6)
        extractor.extract_vector.return_value = np.ones(512, dtype=np.float32)

        mock_client.post.return_value = httpx.Response(200, json={"status": "ACTIVATED"})

        for yaw in [0.0, 16.0, -16.0]:
            detector.detect_face.return_value = _make_detection(yaw=yaw)
            ctrl.process_capture_frame(sharp_frame)

        assert len(ctrl.capturedTemplates) == 3
        for t in ctrl.capturedTemplates:
            vec = np.array(t["vector512"])
            norm = float(np.linalg.norm(vec))
            assert pytest.approx(norm, 1e-4) == 1.0, f"Template {t['poseType']} vector not L2 normalized"

        submit_json = mock_client.post.call_args[1]["json"]
        fallback_norm = float(np.linalg.norm(np.array(submit_json["vector512"])))
        assert pytest.approx(fallback_norm, 1e-4) == 1.0


# ==============================================================================
# Challenge Area 5: Milestone 3 Round 2 Lifecycle & Network Validation
# ==============================================================================

class TestM3Round2LifecycleAndNetworkValidation:
    """Stress-test state machine reset lifecycle, touch cancel recovery, and network validation."""

    def test_state_machine_reset_during_step_2_prevents_deadlock(self, qapp):
        """Stress-test calling reset() during Step 2 capture mode:
        1. Assert isDialogOpen is False and isEnrolling is False.
        2. Assert dialogOpenChanged(False) was emitted.
        3. Assert subsequent incoming camera frames are ignored by process_capture_frame without crashing.
        4. Assert kiosk_view_model.process_frame is NOT permanently blocked by isDialogOpen or isEnrolling.
        """
        detector = MagicMock()
        extractor = MagicMock()
        liveness = MagicMock()
        ctrl = EnrollmentController(
            detector=detector,
            extractor=extractor,
            liveness_gate=liveness,
            capture_interval=0.0,
            pose_hold_duration=0.0,
        )

        vm_detector = MagicMock()
        vm_detector.detect_face.return_value = None
        vm = KioskViewModel(detector=vm_detector, enrollment_controller=ctrl)
        vm.setStandby(False)

        # 1. Enter step 2 capture mode
        ctrl.setDialogOpen(True)
        ctrl.setCurrentStep(2)
        assert ctrl.isDialogOpen is True
        assert ctrl.isEnrolling is True

        # When enrollment is active, KioskViewModel must suspend attendance processing
        dummy_frame = np.ones((480, 640, 3), dtype=np.uint8) * 100
        vm.process_camera_frame(dummy_frame)
        assert vm_detector.detect_face.call_count == 0, "VM should be blocked by active enrollment"

        # 2. Reset during step 2 (simulating touch cancel or ESC)
        signals_emitted: list[bool] = []
        ctrl.dialogOpenChanged.connect(lambda val: signals_emitted.append(val))

        ctrl.reset()

        assert ctrl.isDialogOpen is False, "isDialogOpen must be False after reset()"
        assert ctrl.isEnrolling is False, "isEnrolling must be False after reset()"
        assert False in signals_emitted, "dialogOpenChanged(False) must be emitted on reset()"

        # 3. Subsequent frames sent to enrollment controller must be safely ignored
        detector.reset_mock()
        extractor.reset_mock()
        ctrl.process_capture_frame(dummy_frame)
        assert detector.detect_face.call_count == 0, "Detector must not be called after reset"
        assert extractor.extract_vector.call_count == 0, "Extractor must not be called after reset"
        assert len(ctrl.capturedTemplates) == 0

        # 4. Check kiosk_view_model is NOT permanently blocked by isDialogOpen or isEnrolling
        is_dialog_blocked = getattr(vm.enrollment_controller, "isDialogOpen", False) or getattr(
            vm.enrollment_controller, "isEnrolling", False
        )
        assert is_dialog_blocked is False, "VM must not see isDialogOpen or isEnrolling as True"

        # Clear post-enrollment grace period cooldown to verify camera frame processing resumes
        vm._enrollment_cooldown_until = 0.0
        vm.process_camera_frame(dummy_frame)
        assert vm_detector.detect_face.call_count == 1, "VM attendance processing must resume"

    def test_reopen_after_cancel_qml_lifecycle(self, qapp):
        """Stress-test calling open() after reset():
        1. Verify dialog opens cleanly (isDialogOpen is True, opacity = 1.0, currentStep = 1).
        2. Verify OTP entry and verification transition to Step 2 smoothly.
        """
        mock_client = MagicMock(spec=httpx.Client)
        ctrl = EnrollmentController(client=mock_client)

        engine = QQmlEngine()
        engine.rootContext().setContextProperty("enrollmentController", ctrl)
        qml_path = _KIOSK_ROOT / "resources" / "qml" / "dialogs" / "EnrollmentDialog.qml"
        comp = QQmlComponent(engine, QUrl.fromLocalFile(str(qml_path)))
        dialog = comp.create()
        assert dialog is not None, "Failed to instantiate EnrollmentDialog.qml"

        # Simulate user previously being in Step 2 then canceling
        ctrl.setDialogOpen(True)
        ctrl.setCurrentStep(2)
        ctrl.reset()

        assert ctrl.isDialogOpen is False
        assert ctrl.currentStep == 1
        assert dialog.property("isOpen") is False

        # 1. Call open() after reset()
        QMetaObject.invokeMethod(dialog, "open")

        # Allow animation to settle
        loop = QEventLoop()
        QTimer.singleShot(300, loop.quit)
        loop.exec()

        assert ctrl.isDialogOpen is True, "isDialogOpen must be True after open()"
        assert ctrl.currentStep == 1, "currentStep must be 1 after open()"
        assert dialog.property("isOpen") is True, "QML isOpen must be True"
        assert abs(dialog.property("opacity") - 1.0) < 1e-3, "QML opacity must animate to 1.0"

        # 2. Enter OTP and verify
        for d in "849201":
            ctrl.appendOtpDigit(d)
        assert ctrl.currentOtp == "849201"

        mock_client.post.return_value = httpx.Response(
            200,
            json={
                "sessionToken": "tok-stress-01",
                "employeeId": 4004,
                "employeeCode": "NV-4004",
                "fullName": "Vu Thi E",
            },
        )

        success = ctrl.verifyOtp()
        assert success is True, "OTP verification should succeed"
        assert ctrl.currentStep == 2, "State machine must advance to Step 2"
        assert ctrl.currentPose == "FRONTAL"
        assert ctrl.poseIndex == 0
        assert ctrl.isDialogOpen is True

        # Allow hiding animation to settle
        loop2 = QEventLoop()
        QTimer.singleShot(300, loop2.quit)
        loop2.exec()

        assert dialog.property("isOpen") is False, "QML isOpen must be False in Step 2 capture mode"
        assert abs(dialog.property("opacity") - 0.0) < 1e-3, "QML opacity must be 0.0 in Step 2"

    @pytest.mark.parametrize(
        ("case_name", "templates", "vector512"),
        [
            ("empty_list", [], None),
            ("1_template", [{"poseType": "FRONTAL", "vector512": [0.1] * 512}], None),
            (
                "2_templates",
                [
                    {"poseType": "FRONTAL", "vector512": [0.1] * 512},
                    {"poseType": "LEFT_TILT", "vector512": [0.1] * 512},
                ],
                None,
            ),
            ("4_templates", [{"poseType": "FRONTAL", "vector512": [0.1] * 512}] * 4, None),
            ("none_and_none", None, None),
        ],
    )
    def test_multi_template_validation_boundary_conditions(self, case_name, templates, vector512):
        """Stress-test boundary conditions for templates parameter in KioskHttpClient.enroll_face."""
        client = KioskHttpClient(base_url="http://127.0.0.1:8080")
        with pytest.raises(ValueError) as excinfo:
            client.enroll_face(
                otp="123456",
                session_token="mock-token",
                vector512=vector512,
                templates=templates,
            )
        assert len(str(excinfo.value)) > 0
