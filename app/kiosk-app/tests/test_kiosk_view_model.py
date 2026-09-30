"""Bộ ca kiểm thử đơn vị toàn diện cho KioskViewModel (Phase 2: Controller & AI Pipeline).

Kiểm tra:
- Khởi tạo mặc định: OvalState.IDLE, message ban đầu
- Nhận diện không có mặt -> Giữ trạng thái IDLE
- Mặt nghiêng góc Euler -> Chuyển ALIGNING
- Mặt quá nhỏ -> Chuyển ALIGNING
- Khuôn mặt giả mạo (Spoof) -> Chuyển ERROR (Liveness rejected)
- Khuôn mặt chưa đăng ký Gallery -> Chuyển ERROR
- Điểm danh thành công -> Chuyển SUCCESS, ghi nhận Cooldown và SQLite WAL
- Quẹt lại trong thời gian Cooldown -> Chuyển ERROR
- Bấm nút PIN / Đăng ký mới -> Emit Signal mở Dialog
"""

from unittest.mock import MagicMock

import numpy as np

from core.cooldown.cooldown_tracker import CooldownTracker
from core.offline.sqlite_manager import SQLiteQueueManager
from core.vision.face_detector import FaceDetectionResult
from core.vision.gallery_matcher import GalleryCacheManager
from ui.controllers.kiosk_view_model import KioskViewModel, OvalState
from ui.controllers.video_image_provider import VideoImageProvider


def _create_mock_detection(
    is_tilted: bool = False,
    is_valid_size: bool = True,
    bbox: tuple[int, int, int, int] = (100, 100, 200, 200),
) -> FaceDetectionResult:
    """Tạo đối tượng FaceDetectionResult giả lập cho test."""
    landmarks = np.array(
        [[150, 150], [200, 150], [175, 180], [160, 220], [190, 220]],
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


def test_kiosk_view_model_initial_state(qapp):
    """Kiểm tra khởi tạo ban đầu của KioskViewModel."""
    vm = KioskViewModel()
    assert vm.ovalState == OvalState.IDLE
    assert "nhìn vào khung hình" in vm.message.lower()
    assert not vm.isProcessing
    assert vm.pendingSyncCount == 0


def test_kiosk_view_model_no_face_idle(qapp):
    """Kiểm tra luồng khi không phát hiện thấy khuôn mặt."""
    detector = MagicMock()
    detector.detect_face.return_value = None

    vm = KioskViewModel(detector=detector)
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    vm.process_camera_frame(dummy_frame)

    assert vm.ovalState == OvalState.IDLE
    assert "nhìn vào khung hình" in vm.message


def test_kiosk_view_model_tilted_face_aligning(qapp):
    """Kiểm tra phản hồi hướng dẫn khi mặt bị nghiêng góc lớn."""
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection(is_tilted=True)

    vm = KioskViewModel(detector=detector)
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    vm.process_camera_frame(dummy_frame)

    assert vm.ovalState == OvalState.ALIGNING
    assert "giữ thẳng mặt" in vm.message.lower()


def test_kiosk_view_model_small_face_aligning(qapp):
    """Kiểm tra hướng dẫn đứng lại gần khi mặt quá nhỏ."""
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection(is_valid_size=False)

    vm = KioskViewModel(detector=detector)
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    vm.process_camera_frame(dummy_frame)

    assert vm.ovalState == OvalState.ALIGNING
    assert "gần camera" in vm.message.lower()


def test_kiosk_view_model_spoof_detection_error(qapp):
    """Kiểm tra cảnh báo đỏ khi bị MiniFASNet từ chối liveness."""
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection()

    liveness_gate = MagicMock()
    liveness_gate.predict.return_value = 0.15  # < Ngưỡng liveness

    vm = KioskViewModel(detector=detector, liveness_gate=liveness_gate)
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    vm.process_camera_frame(dummy_frame)

    assert vm.ovalState == OvalState.ERROR
    assert "CẢNH BÁO" in vm.message


def test_kiosk_view_model_unregistered_face_error(qapp):
    """Kiểm tra báo lỗi khi khuôn mặt chưa đăng ký trong Gallery."""
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection()

    liveness_gate = MagicMock()
    liveness_gate.predict.return_value = 0.95

    extractor = MagicMock()
    extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
    extractor.extract_vector.return_value = np.random.randn(512).astype(np.float32)

    gallery_matcher = MagicMock(spec=GalleryCacheManager)
    gallery_matcher.match.return_value = (None, 0.35)  # Không khớp ai

    vm = KioskViewModel(
        detector=detector,
        liveness_gate=liveness_gate,
        extractor=extractor,
        gallery_matcher=gallery_matcher,
    )
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    vm.process_camera_frame(dummy_frame)

    assert vm.ovalState == OvalState.ERROR
    assert "chưa được đăng ký" in vm.message.lower()


def test_kiosk_view_model_successful_punch(qapp, tmp_path):
    """Kiểm tra quy trình điểm danh thành công hoàn chỉnh."""
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection()

    liveness_gate = MagicMock()
    liveness_gate.predict.return_value = 0.96

    extractor = MagicMock()
    extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
    extractor.extract_vector.return_value = np.random.randn(512).astype(np.float32)

    gallery_matcher = MagicMock(spec=GalleryCacheManager)
    gallery_matcher.match.return_value = (1001, 0.88)

    cooldown_tracker = CooldownTracker(cooldown_duration=60)
    db_path = tmp_path / "kiosk_test.db"
    queue_manager = SQLiteQueueManager(db_path=db_path)
    image_provider = VideoImageProvider()

    vm = KioskViewModel(
        image_provider=image_provider,
        detector=detector,
        liveness_gate=liveness_gate,
        extractor=extractor,
        gallery_matcher=gallery_matcher,
        cooldown_tracker=cooldown_tracker,
        queue_manager=queue_manager,
    )

    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    vm.process_camera_frame(dummy_frame)

    # 1. Trạng thái phải là SUCCESS
    assert vm.ovalState == OvalState.SUCCESS
    assert "thành công" in vm.message.lower()
    assert "1001" in vm.message

    # 2. SQLite WAL phải có 1 bản ghi
    assert queue_manager.get_unsynced_count() == 1
    assert vm.pendingSyncCount == 1

    # 3. Quẹt lại ngay lập tức phải bị chặn Cooldown
    vm._holding_result = False  # Bỏ qua cờ hold để test cooldown
    vm.process_camera_frame(dummy_frame)
    assert vm.ovalState == OvalState.ERROR
    assert "vừa điểm danh" in vm.message.lower()


def test_kiosk_view_model_dialog_signals(qapp):
    """Kiểm tra phát signal mở PinDialog và EnrollmentDialog."""
    vm = KioskViewModel()

    pin_signal_emitted = []
    enroll_signal_emitted = []

    vm.openPinDialogRequested.connect(lambda: pin_signal_emitted.append(True))
    vm.openEnrollmentDialogRequested.connect(lambda: enroll_signal_emitted.append(True))

    vm.requestPinFallback()
    assert len(pin_signal_emitted) == 1
    assert vm.ovalState == OvalState.ALIGNING

    vm.requestEnrollment()
    assert len(enroll_signal_emitted) == 1
    assert vm.ovalState == OvalState.ALIGNING
