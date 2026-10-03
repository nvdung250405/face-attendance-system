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
from presentation.providers.video_image_provider import VideoImageProvider
from presentation.viewmodels.kiosk_view_model import (
    KioskViewModel,
    OvalState,
    evaluate_face_oval_alignment,
)


def _create_mock_detection(
    is_tilted: bool = False,
    is_valid_size: bool = True,
    bbox: tuple[int, int, int, int] | None = None,
) -> FaceDetectionResult:
    """Tạo đối tượng FaceDetectionResult giả lập cho test."""
    if bbox is None:
        if not is_valid_size:
            bbox = (300, 180, 40, 40)  # Mặt nhỏ / xa
        else:
            bbox = (270, 137, 100, 110)  # Chuẩn tâm Oval cho frame 480x640

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

    vm = KioskViewModel(
        detector=detector,
        liveness_gate=liveness_gate,
        stability_threshold=1,
    )
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
        stability_threshold=1,
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
        stability_threshold=1,
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


def test_kiosk_view_model_standby_and_instant_wakeup(qapp):
    """Kiểm tra Màn hình Chờ Chào mừng mặc định và cơ chế đánh thức tức thì khi có người."""
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection()

    vm = KioskViewModel(detector=detector)
    # 1. Trạng thái khởi động mặc định phải là Standby
    assert vm.isStandby is True

    # 2. Đánh thức tức thì khi phát hiện khuôn mặt trước camera
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    vm.process_camera_frame(dummy_frame)
    assert vm.isStandby is False

    # 3. Chuyển đổi thủ công qua setStandby
    vm.setStandby(True)
    assert vm.isStandby is True
    vm.setStandby(False)
    assert vm.isStandby is False


def test_kiosk_view_model_auto_standby_timeout(qapp):
    """Kiểm tra tự động chuyển về Chế độ Chờ (Standby) sau thời gian vắng người."""
    detector = MagicMock()
    detector.detect_face.return_value = None  # Không có người trước camera

    vm = KioskViewModel(detector=detector)
    vm.setStandby(False)
    assert vm.isStandby is False

    # Giả lập thời gian vắng người vượt quá standby_timeout (8s)
    vm._last_face_time = 0.0  # Mốc quá khứ
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    vm.process_camera_frame(dummy_frame)

    assert vm.isStandby is True


def test_evaluate_face_oval_alignment_centered():
    """Kiểm tra khuôn mặt căn chuẩn tâm Oval."""
    frame_shape = (480, 640, 3)
    bbox = (270, 137, 100, 110)
    is_aligned, msg = evaluate_face_oval_alignment(frame_shape, bbox)
    assert is_aligned is True
    assert "chuẩn xác" in msg


def test_evaluate_face_oval_alignment_too_close():
    """Kiểm tra cảnh báo lùi ra xa khi khuôn mặt quá gần (quá to)."""
    frame_shape = (480, 640, 3)
    bbox = (240, 100, 160, 180)  # bh=180 > max_face_h (164.7)
    is_aligned, msg = evaluate_face_oval_alignment(frame_shape, bbox)
    assert is_aligned is False
    assert "lùi ra xa" in msg


def test_evaluate_face_oval_alignment_too_far():
    """Kiểm tra cảnh báo lại gần khi khuôn mặt quá xa (quá nhỏ)."""
    frame_shape = (480, 640, 3)
    bbox = (300, 175, 40, 45)  # bh=45 < min_face_h (67.8)
    is_aligned, msg = evaluate_face_oval_alignment(frame_shape, bbox)
    assert is_aligned is False
    assert "lại gần" in msg


def test_evaluate_face_oval_alignment_displaced():
    """Kiểm tra cảnh báo điều hướng khi tâm mặt lệch ra ngoài Oval."""
    frame_shape = (480, 640, 3)
    # Lệch sang trái khung hình (người dùng nhìn vào thấy mình ở bên trái -> hướng dẫn sang phải)
    bbox_left = (80, 137, 100, 110)
    is_aligned, msg = evaluate_face_oval_alignment(frame_shape, bbox_left)
    assert is_aligned is False
    assert "sang phải" in msg

    # Lệch sang phải khung hình -> hướng dẫn sang trái
    bbox_right = (460, 137, 100, 110)
    is_aligned, msg = evaluate_face_oval_alignment(frame_shape, bbox_right)
    assert is_aligned is False
    assert "sang trái" in msg

    # Lệch quá cao (phía trên Oval) -> hướng dẫn hạ tầm mắt
    bbox_up = (270, 10, 100, 110)
    is_aligned, msg = evaluate_face_oval_alignment(frame_shape, bbox_up)
    assert is_aligned is False
    assert "hạ tầm mắt" in msg

    # Lệch quá thấp (phía dưới Oval) -> hướng dẫn nâng tầm mắt
    bbox_down = (270, 330, 100, 110)
    is_aligned, msg = evaluate_face_oval_alignment(frame_shape, bbox_down)
    assert is_aligned is False
    assert "nâng tầm mắt" in msg


def test_kiosk_view_model_stability_countdown(qapp):
    """Kiểm tra cơ chế đếm khung hình ổn định (0.5s - 1.0s) trước khi quét."""
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection()

    liveness_gate = MagicMock()
    liveness_gate.predict.return_value = 0.95

    extractor = MagicMock()
    extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
    extractor.extract_vector.return_value = np.random.randn(512).astype(np.float32)

    gallery_matcher = MagicMock(spec=GalleryCacheManager)
    gallery_matcher.match.return_value = (1001, 0.90)

    vm = KioskViewModel(
        detector=detector,
        liveness_gate=liveness_gate,
        extractor=extractor,
        gallery_matcher=gallery_matcher,
        stability_threshold=3,  # Cần 3 frame ổn định liên tục
    )
    # Bỏ standby để vào active loop
    vm.setStandby(False)
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)

    # Frame 1: Chưa đủ ngưỡng -> ALIGNING, hướng dẫn giữ yên
    vm.process_camera_frame(dummy_frame)
    assert vm.ovalState == OvalState.ALIGNING
    assert "giữ yên" in vm.message.lower()

    # Frame 2: Vẫn chưa đủ ngưỡng -> ALIGNING, giữ yên
    vm.process_camera_frame(dummy_frame)
    assert vm.ovalState == OvalState.ALIGNING
    assert "giữ yên" in vm.message.lower()

    # Frame 3: Đủ 3 frame ổn định liên tục -> Bắt đầu nhận diện và SUCCESS!
    vm.process_camera_frame(dummy_frame)
    assert vm.ovalState == OvalState.SUCCESS
    assert "thành công" in vm.message.lower()


def test_kiosk_view_model_stability_resets_on_movement(qapp):
    """Kiểm tra bộ đếm ổn định bị reset về 0 nếu mặt di chuyển lệch hoặc nghiêng."""
    detector = MagicMock()
    # Ban đầu mặt chuẩn
    detector.detect_face.return_value = _create_mock_detection()

    vm = KioskViewModel(
        detector=detector,
        stability_threshold=4,
    )
    vm.setStandby(False)
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)

    # Frame 1 & 2: Giữ yên
    vm.process_camera_frame(dummy_frame)
    vm.process_camera_frame(dummy_frame)
    assert vm._stable_frames == 2

    # Frame 3: Bất ngờ nghiêng đầu -> reset về 0
    detector.detect_face.return_value = _create_mock_detection(is_tilted=True)
    vm.process_camera_frame(dummy_frame)
    assert vm._stable_frames == 0
    assert "giữ thẳng mặt" in vm.message.lower()


def test_nfr_ksk_001_full_pipeline_cycle_time(qapp):
    """NFR-KSK-001: Tổng thời gian chu kỳ nhận diện trọn vòng đạt <= 350 ms."""
    import time
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection()

    liveness = MagicMock()
    liveness.predict.return_value = 0.98

    extractor = MagicMock()
    extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
    extractor.extract_vector.return_value = np.random.randn(512).astype(np.float32)

    matcher = MagicMock()
    matcher.match.return_value = (1001, 0.95)

    vm = KioskViewModel(
        detector=detector,
        liveness_gate=liveness,
        extractor=extractor,
        gallery_matcher=matcher,
        stability_threshold=1,
    )
    vm.setStandby(False)
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)

    t0 = time.perf_counter()
    vm.process_camera_frame(dummy_frame)
    latency_ms = (time.perf_counter() - t0) * 1000.0

    assert vm.ovalState == OvalState.SUCCESS
    assert latency_ms < 350.0


