"""Bộ ca kiểm thử tự động cho InferenceWorker QThread và kiểm soát hàng đợi xoay vòng.

Tài liệu tham chiếu:
- ARCH-K-01: Tách rời tải tính toán AI và ghi SQLite WAL khỏi Main GUI Thread.
- Circular Queue maxsize=2, tự động loại bỏ frame cũ khi bận suy luận.
- Phát các tín hiệu Qt (face_detected, status_updated, punch_recorded, standby_wake_requested).
"""

from unittest.mock import MagicMock

import numpy as np

from core.cooldown.cooldown_tracker import CooldownTracker
from core.offline.sqlite_manager import SQLiteQueueManager
from core.vision.face_detector import FaceDetectionResult
from core.vision.gallery_matcher import GalleryCacheManager
from presentation.viewmodels.kiosk_view_model import KioskViewModel, OvalState
from presentation.workers.inference_worker import InferenceWorker


def _create_mock_detection(
    is_tilted: bool = False,
    is_valid_size: bool = True,
    bbox: tuple[int, int, int, int] | None = None,
) -> FaceDetectionResult:
    """Tạo đối tượng FaceDetectionResult giả lập cho test."""
    if bbox is None:
        if not is_valid_size:
            bbox = (300, 180, 40, 40)
        else:
            bbox = (270, 137, 100, 110)

    landmarks = np.array(
        [
            [bbox[0] + 30, bbox[1] + 30],
            [bbox[0] + 70, bbox[1] + 30],
            [bbox[0] + 50, bbox[1] + 55],
            [bbox[0] + 35, bbox[1] + 85],
            [bbox[0] + 65, bbox[1] + 85],
        ],
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


def test_inference_worker_initialization(qapp):
    """Kiểm tra khởi tạo InferenceWorker với các tham số mặc định và hàng đợi xoay vòng."""
    worker = InferenceWorker(stability_threshold=5)

    assert worker.stability_threshold == 5
    assert worker.queue_size == 0
    assert not worker.is_running
    assert worker._is_standby is True


def test_circular_queue_maxsize_and_drop_stale_frames(qapp):
    """Kiểm tra hàng đợi xoay vòng circular queue maxsize=2 tự động loại bỏ frame cũ nhất."""
    worker = InferenceWorker()
    worker._is_running = True

    f1 = np.ones((10, 10, 3), dtype=np.uint8) * 1
    f2 = np.ones((10, 10, 3), dtype=np.uint8) * 2
    f3 = np.ones((10, 10, 3), dtype=np.uint8) * 3

    assert worker.enqueue_frame(f1) is True
    assert worker.enqueue_frame(f2) is True
    assert worker.queue_size == 2

    # Đưa f3 vào: do queue đã đầy (maxsize=2), f1 bị loại bỏ, f2 và f3 được giữ lại
    assert worker.enqueue_frame(f3) is True
    assert worker.queue_size == 2

    q_first = worker._queue.get_nowait()
    q_second = worker._queue.get_nowait()
    assert np.array_equal(q_first, f2)
    assert np.array_equal(q_second, f3)


def test_inference_worker_stop_and_cleanup(qapp):
    """Kiểm tra dừng luồng an toàn và dọn sạch hàng đợi."""
    worker = InferenceWorker()
    worker._is_running = True
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    worker.enqueue_frame(dummy_frame)
    assert worker.queue_size == 1

    worker.stop()
    assert not worker.is_running
    assert worker.queue_size == 0


def test_inference_worker_standby_wake_up(qapp):
    """Kiểm tra phát tín hiệu standby_wake_requested khi phát hiện người bước tới trạm."""
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection()

    worker = InferenceWorker(detector=detector)
    worker.set_standby(True)

    wake_events = []
    worker.standby_wake_requested.connect(lambda: wake_events.append(True))

    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    worker._process_frame(dummy_frame)

    assert len(wake_events) == 1
    assert worker._is_standby is False


def test_inference_worker_liveness_rejection(qapp):
    """Kiểm tra từ chối liveness giả mạo và phát tín hiệu ERROR."""
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection()

    liveness_gate = MagicMock()
    liveness_gate.predict.return_value = 0.10

    worker = InferenceWorker(
        detector=detector,
        liveness_gate=liveness_gate,
        stability_threshold=1,
    )
    worker.set_standby(False)

    status_events = []
    worker.status_updated.connect(lambda state, msg: status_events.append((state, msg)))

    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    worker._process_frame(dummy_frame)

    assert len(status_events) == 1
    assert status_events[0][0] == OvalState.ERROR
    assert "CẢNH BÁO" in status_events[0][1]


def test_inference_worker_successful_punch_off_gui_thread(qapp, tmp_path):
    """Kiểm tra xử lý trọn vẹn chu kỳ điểm danh và ghi SQLite WAL trong worker."""
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection()

    liveness_gate = MagicMock()
    liveness_gate.predict.return_value = 0.98

    extractor = MagicMock()
    extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
    extractor.extract_vector.return_value = np.random.randn(512).astype(np.float32)

    gallery_matcher = MagicMock(spec=GalleryCacheManager)
    gallery_matcher.match.return_value = (2002, 0.94)

    cooldown_tracker = CooldownTracker(cooldown_duration=60)
    db_path = tmp_path / "worker_test.db"
    queue_manager = SQLiteQueueManager(db_path=db_path)

    worker = InferenceWorker(
        detector=detector,
        liveness_gate=liveness_gate,
        extractor=extractor,
        gallery_matcher=gallery_matcher,
        cooldown_tracker=cooldown_tracker,
        queue_manager=queue_manager,
        stability_threshold=1,
    )
    worker.set_standby(False)

    punch_events = []
    status_events = []
    worker.punch_recorded.connect(
        lambda emp_id, punch_time, score, punch_type: punch_events.append(
            (emp_id, punch_time, score, punch_type)
        )
    )
    worker.status_updated.connect(lambda state, msg: status_events.append((state, msg)))

    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    worker._process_frame(dummy_frame)

    # 1. Tín hiệu điểm danh thành công
    assert len(punch_events) == 1
    assert punch_events[0][0] == 2002
    assert punch_events[0][3] == "CHECK_IN"

    # 2. Tín hiệu trạng thái SUCCESS
    assert len(status_events) == 1
    assert status_events[0][0] == OvalState.SUCCESS
    assert "2002" in status_events[0][1]

    # 3. Ghi thành công vào SQLite WAL
    assert queue_manager.get_unsynced_count() == 1


def test_kiosk_view_model_async_delegation_to_worker(qapp):
    """Kiểm tra KioskViewModel phân quyền khung hình cho worker khi worker đang chạy."""
    mock_worker = MagicMock(spec=InferenceWorker)
    mock_worker.isRunning.return_value = True

    vm = KioskViewModel(inference_worker=mock_worker)
    assert vm.inference_worker == mock_worker

    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    vm.process_camera_frame(dummy_frame)

    # Khung hình được chuyển sang worker thông qua enqueue_frame mà không tính toán trên Main Thread
    mock_worker.enqueue_frame.assert_called_once_with(dummy_frame)


def test_inference_worker_fail_closed_without_liveness(qapp):
    """Kiểm tra nguyên tắc fail-closed: Từ chối suy luận và báo ERROR khi liveness_gate là None (FIND-AI-001)."""
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection()

    worker = InferenceWorker(
        detector=detector,
        liveness_gate=None,
        stability_threshold=1,
        allow_no_liveness=False,
    )
    worker.set_standby(False)

    status_events = []
    worker.status_updated.connect(lambda state, msg: status_events.append((state, msg)))

    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    worker._process_frame(dummy_frame)

    assert len(status_events) == 1
    assert status_events[0][0] == OvalState.ERROR
    assert "THỰC THỂ SỐNG" in status_events[0][1]


def test_inference_worker_dev_mode_no_liveness_bypass(qapp, tmp_path):
    """Kiểm tra cho phép chạy không cần liveness khi bật cờ allow_no_liveness cho dev/demo (FIND-AI-001)."""
    detector = MagicMock()
    detector.detect_face.return_value = _create_mock_detection()

    extractor = MagicMock()
    extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
    extractor.extract_vector.return_value = np.random.randn(512).astype(np.float32)

    gallery_matcher = MagicMock(spec=GalleryCacheManager)
    gallery_matcher.match.return_value = (3003, 0.92)

    db_file = tmp_path / "test_worker_demo.db"
    queue_manager = SQLiteQueueManager(db_path=db_file)
    cooldown_tracker = CooldownTracker(120)

    worker = InferenceWorker(
        detector=detector,
        liveness_gate=None,
        extractor=extractor,
        gallery_matcher=gallery_matcher,
        cooldown_tracker=cooldown_tracker,
        queue_manager=queue_manager,
        stability_threshold=1,
        allow_no_liveness=True,
    )
    worker.set_standby(False)

    status_events = []
    worker.status_updated.connect(lambda state, msg: status_events.append((state, msg)))

    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    worker._process_frame(dummy_frame)

    assert len(status_events) == 1
    assert status_events[0][0] == OvalState.SUCCESS
