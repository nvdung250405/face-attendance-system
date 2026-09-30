"""Bộ kiểm thử đơn vị cho MainWindow và LiveCanvasWidget (M6: GUI & Soak Testing).

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2, 4.3 & M6 - MainWindow, LiveCanvasWidget)
- TP-KIOSK-01 (Mục 4.3 - M6: GUI & Soak Testing)
- DDS.md (Mục 2.1, 3.2 & 3.5 - Máy trạng thái viền oval 4 màu)
"""

from unittest.mock import MagicMock

import numpy as np
import pytest

from core.cooldown.cooldown_tracker import CooldownTracker
from core.offline.sqlite_manager import SQLiteQueueManager
from core.vision.face_detector import FaceDetectionResult
from core.vision.gallery_matcher import GalleryCacheManager
from ui.views.main_window import MainWindow
from ui.widgets.live_canvas import LiveCanvasWidget, OvalState


class TestLiveCanvasWidget:
    """Kiểm thử widget vẽ camera và viền oval động 4 màu."""

    def test_canvas_initial_state(self, qapp):
        """Kiểm tra trạng thái mặc định của LiveCanvasWidget."""
        canvas = LiveCanvasWidget()
        assert canvas.state == OvalState.IDLE
        assert "nhìn vào khung hình" in canvas.message.lower()
        assert canvas._current_frame is None

    def test_canvas_state_transitions(self, qapp):
        """Kiểm thử chuyển đổi giữa 4 trạng thái màu viền Oval."""
        canvas = LiveCanvasWidget()

        # 1. Chuyển sang ALIGNING (Vàng)
        canvas.set_state(OvalState.ALIGNING, "Vui lòng giữ thẳng mặt")
        assert canvas.state == OvalState.ALIGNING
        assert canvas.message == "Vui lòng giữ thẳng mặt"

        # 2. Chuyển sang SUCCESS (Xanh lá)
        canvas.set_state(OvalState.SUCCESS, "Điểm danh thành công!")
        assert canvas.state == OvalState.SUCCESS
        assert canvas.message == "Điểm danh thành công!"

        # 3. Chuyển sang ERROR (Đỏ)
        canvas.set_state(OvalState.ERROR, "Cảnh báo: Không phải người thật")
        assert canvas.state == OvalState.ERROR
        assert canvas.message == "Cảnh báo: Không phải người thật"

        # 4. Quay về IDLE (Xám)
        canvas.set_state(OvalState.IDLE, "Sẵn sàng")
        assert canvas.state == OvalState.IDLE
        assert canvas.message == "Sẵn sàng"

    def test_canvas_set_frame_and_geometry(self, qapp):
        """Kiểm tra nạp khung hình và tính toán tọa độ khung oval."""
        canvas = LiveCanvasWidget()
        canvas.resize(640, 480)

        # Kiểm tra hình chữ nhật giới hạn của oval
        oval_rect = canvas.get_oval_rect()
        assert oval_rect.width() > 0
        assert oval_rect.height() > 0
        assert oval_rect.center().x() == pytest.approx(320, abs=5)

        # Nạp khung hình giả lập
        dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        canvas.set_frame(dummy_frame)
        assert canvas._current_frame is not None
        assert canvas._pixmap is not None
        assert not canvas._pixmap.isNull()

        # Nạp None
        canvas.set_frame(None)
        assert canvas._current_frame is None
        assert canvas._pixmap is None


class TestMainWindow:
    """Kiểm thử tích hợp giao diện chính MainWindow và toàn trình pipeline AI."""

    @pytest.fixture
    def temp_db(self, tmp_path):
        return tmp_path / "kiosk_main_test.db"

    @pytest.fixture
    def queue_mgr(self, temp_db):
        return SQLiteQueueManager(db_path=temp_db)

    @pytest.fixture
    def cooldown_tracker(self):
        return CooldownTracker(cooldown_duration=120)

    @pytest.fixture
    def gallery_matcher(self):
        matcher = GalleryCacheManager(default_threshold=0.50)
        # Nạp 1 nhân viên mẫu ID 1024
        vec = np.ones(512, dtype=np.float32)
        matcher.load_gallery([(1024, vec)])
        return matcher

    def test_main_window_initialization(
        self, qapp, queue_mgr, cooldown_tracker, gallery_matcher
    ):
        """Kiểm tra khởi tạo giao diện MainWindow và các thành phần con."""
        window = MainWindow(
            gallery_matcher=gallery_matcher,
            cooldown_tracker=cooldown_tracker,
            queue_manager=queue_mgr,
        )

        assert window.canvas is not None
        assert window.clock_label is not None
        assert window.network_badge is not None
        assert window.queue_badge is not None
        assert window.btn_pin is not None
        assert window.btn_enroll is not None

        # Kiểm tra đồng hồ được cập nhật
        assert ":" in window.clock_label.text()

        window.close()

    def test_pipeline_no_face_idle_state(
        self, qapp, queue_mgr, cooldown_tracker, gallery_matcher
    ):
        """Kiểm thử pipeline khi không phát hiện khuôn mặt -> Trạng thái IDLE."""
        mock_detector = MagicMock()
        mock_detector.detect_face.return_value = None

        window = MainWindow(
            detector=mock_detector,
            gallery_matcher=gallery_matcher,
            cooldown_tracker=cooldown_tracker,
            queue_manager=queue_mgr,
        )

        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        window.process_camera_frame(frame)

        assert window.canvas.state == OvalState.IDLE
        assert "nhìn vào khung hình" in window.canvas.message.lower()
        window.close()

    def test_pipeline_tilted_face_aligning_state(
        self, qapp, queue_mgr, cooldown_tracker, gallery_matcher
    ):
        """Kiểm thử pipeline khi mặt bị nghiêng -> Trạng thái ALIGNING."""
        mock_detector = MagicMock()
        mock_detector.detect_face.return_value = FaceDetectionResult(
            bbox=(100, 100, 150, 150),
            landmarks=np.zeros((5, 2), dtype=np.float32),
            score=0.95,
            euler_angles=(18.0, 0.0, 0.0),  # Nghiêng > 15 độ
            is_valid_size=True,
            is_tilted=True,
        )

        window = MainWindow(
            detector=mock_detector,
            gallery_matcher=gallery_matcher,
            cooldown_tracker=cooldown_tracker,
            queue_manager=queue_mgr,
        )

        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        window.process_camera_frame(frame)

        assert window.canvas.state == OvalState.ALIGNING
        assert "giữ thẳng mặt" in window.canvas.message.lower()
        window.close()

    def test_pipeline_spoof_detection_error_state(
        self, qapp, queue_mgr, cooldown_tracker, gallery_matcher
    ):
        """Kiểm thử pipeline khi phát hiện giả mạo (Liveness < 0.85) -> Trạng thái ERROR."""
        mock_detector = MagicMock()
        mock_detector.detect_face.return_value = FaceDetectionResult(
            bbox=(100, 100, 150, 150),
            landmarks=np.zeros((5, 2), dtype=np.float32),
            score=0.95,
            euler_angles=(0.0, 0.0, 0.0),
            is_valid_size=True,
            is_tilted=False,
        )

        mock_liveness = MagicMock()
        mock_liveness.predict.return_value = 0.35  # Điểm liveness giả mạo

        window = MainWindow(
            detector=mock_detector,
            liveness_gate=mock_liveness,
            gallery_matcher=gallery_matcher,
            cooldown_tracker=cooldown_tracker,
            queue_manager=queue_mgr,
        )

        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        window.process_camera_frame(frame)

        assert window.canvas.state == OvalState.ERROR
        assert "không hợp lệ" in window.canvas.message.lower()
        assert queue_mgr.get_unsynced_count() == 0  # Tuyệt đối không ghi nhận điểm danh
        window.close()

    def test_pipeline_successful_face_punch(
        self, qapp, queue_mgr, cooldown_tracker, gallery_matcher
    ):
        """Kiểm thử toàn trình điểm danh khuôn mặt thành công -> Trạng thái SUCCESS."""
        mock_detector = MagicMock()
        mock_detector.detect_face.return_value = FaceDetectionResult(
            bbox=(100, 100, 150, 150),
            landmarks=np.zeros((5, 2), dtype=np.float32),
            score=0.98,
            euler_angles=(1.0, 0.0, 0.0),
            is_valid_size=True,
            is_tilted=False,
        )

        mock_liveness = MagicMock()
        mock_liveness.predict.return_value = 0.96  # Người thật

        mock_extractor = MagicMock()
        mock_extractor.align_face.return_value = np.zeros((112, 112, 3), dtype=np.uint8)
        # Khớp với vector nhân viên 1024 trong gallery_matcher
        mock_extractor.extract_vector.return_value = np.ones(512, dtype=np.float32)

        window = MainWindow(
            detector=mock_detector,
            liveness_gate=mock_liveness,
            extractor=mock_extractor,
            gallery_matcher=gallery_matcher,
            cooldown_tracker=cooldown_tracker,
            queue_manager=queue_mgr,
        )

        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        window.process_camera_frame(frame)

        # Kiểm tra trạng thái và CSDL
        assert window.canvas.state == OvalState.SUCCESS
        assert "thành công" in window.canvas.message.lower()
        assert "1024" in window.canvas.message

        # Đã ghi vào hàng đợi SQLite WAL
        assert queue_mgr.get_unsynced_count() == 1
        punches = queue_mgr.get_unsynced_punches()
        assert punches[0]["employee_id"] == 1024
        assert punches[0]["punch_type"] == "FACE"

        # Kiểm tra quẹt lại lập tức bị Cooldown chặn
        window._holding_result = False  # Giả lập hết thời gian giữ kết quả
        window.process_camera_frame(frame)
        assert window.canvas.state == OvalState.ERROR
        assert "vừa điểm danh rồi" in window.canvas.message.lower()
        assert queue_mgr.get_unsynced_count() == 1  # Không bị tạo thêm bản ghi

        window.close()

    def test_pin_submission_handling(
        self, qapp, queue_mgr, cooldown_tracker, gallery_matcher
    ):
        """Kiểm tra xử lý điểm danh qua mã PIN dự phòng."""
        window = MainWindow(
            gallery_matcher=gallery_matcher,
            cooldown_tracker=cooldown_tracker,
            queue_manager=queue_mgr,
        )

        # Giả lập tín hiệu gửi mã PIN từ VirtualPinDialog
        window._handle_pin_submission(emp_id=2048, pin="123456")

        assert window.canvas.state == OvalState.SUCCESS
        assert "mã pin" in window.canvas.message.lower()
        assert "2048" in window.canvas.message

        # Bản ghi được lưu với punch_type = PIN
        assert queue_mgr.get_unsynced_count() == 1
        record = queue_mgr.get_unsynced_punches()[0]
        assert record["employee_id"] == 2048
        assert record["punch_type"] == "PIN"

        window.close()
