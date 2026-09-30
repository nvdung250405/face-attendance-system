"""Bộ ca kiểm thử tự động cho CameraWorker QThread.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & Mục 4.3)
"""

import pytest
from PySide6.QtCore import QCoreApplication

from core.vision.camera_worker import CameraWorker


@pytest.fixture(scope="session")
def qapp():
    """Khởi tạo QCoreApplication phục vụ kiểm thử tín hiệu Qt."""
    app = QCoreApplication.instance()
    if app is None:
        app = QCoreApplication([])
    return app


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
