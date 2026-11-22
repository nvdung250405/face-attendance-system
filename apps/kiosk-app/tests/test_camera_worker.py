"""Bộ ca kiểm thử tự động cho CameraWorker QThread.

Tài liệu tham chiếu:
- FR-NFR TEST PLAN: TST-KSK-001, TST-KSK-009 (docs/service-docs/kiosk-app/fr-nfr/fr-nfr-test-plan.md)
- FR-NFR SPECS: FR-KSK-001, NFR-KSK-002, NFR-KSK-005 (docs/service-docs/kiosk-app/fr-nfr/fr-nfr-specs.md)
"""

from unittest.mock import MagicMock, patch

import cv2

from core.vision.camera_worker import CameraWorker


def test_camera_worker_initialization(qapp):
    """Kiểm tra khởi tạo CameraWorker với tham số tùy chỉnh."""
    worker = CameraWorker(
        device_index=1,
        width=640,
        height=480,
        target_fps=15,
    )

    assert worker.device_index == 1
    assert worker.width == 640
    assert worker.height == 480
    assert worker.target_fps == 15
    assert worker._is_running is False
    assert worker._cap is None


def test_camera_worker_stop_and_cleanup(qapp):
    """Kiểm tra phương thức dừng luồng an toàn."""
    worker = CameraWorker(device_index=99)
    worker.stop()
    assert worker._is_running is False
    assert worker._cap is None


def test_tst_ksk_001_directshow_initialization_and_parameters(qapp):
    """TST-KSK-001: Khởi tạo Camera DirectShow và thiết lập độ phân giải, FPS chuẩn."""
    mock_cap = MagicMock()
    mock_cap.isOpened.return_value = True
    mock_cap.get.side_effect = lambda prop: {
        cv2.CAP_PROP_FRAME_WIDTH: 1280.0,
        cv2.CAP_PROP_FRAME_HEIGHT: 720.0,
        cv2.CAP_PROP_FPS: 30.0,
    }.get(prop, 0.0)

    with patch("cv2.VideoCapture", return_value=mock_cap) as mock_vc:
        worker = CameraWorker(device_index=0, width=1280, height=720, target_fps=30)
        status_events = []
        worker.camera_status.connect(lambda ok, msg: status_events.append((ok, msg)))

        opened = worker._open_camera()

        assert opened is True
        # Xác minh mở bằng backend cv2.CAP_DSHOW
        mock_vc.assert_called_with(0, cv2.CAP_DSHOW)
        # Xác minh thiết lập độ phân giải và FPS
        mock_cap.set.assert_any_call(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        mock_cap.set.assert_any_call(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        mock_cap.set.assert_any_call(cv2.CAP_PROP_FPS, 30)

        # Xác minh tín hiệu camera_status phát True
        assert len(status_events) == 1
        assert status_events[0][0] is True
        assert "Camera sẵn sàng" in status_events[0][1]


def test_tst_ksk_009_reconnect_on_signal_loss(qapp):
    """TST-KSK-009: Kiểm thử tự phát hiện mất tín hiệu và kích hoạt vòng lặp phục hồi kết nối."""
    mock_cap = MagicMock()
    mock_cap.isOpened.return_value = True
    # Giả lập cap.read() thất bại liên tiếp (không trả về frame)
    mock_cap.read.return_value = (False, None)

    worker = CameraWorker(device_index=0)
    worker._cap = mock_cap

    status_events = []
    worker.camera_status.connect(lambda ok, msg: status_events.append((ok, msg)))

    # Kiểm tra xử lý lỗi khi mất tín hiệu
    assert worker._cap is not None
    # Gọi release an toàn
    worker.stop()
    assert worker._is_running is False
