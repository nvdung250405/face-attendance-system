"""Bộ ca kiểm thử đơn vị cho VideoImageProvider (Phase 1: Foundation).

Kiểm tra:
- Khởi tạo provider mặc định
- Cập nhật frame từ OpenCV numpy ndarray
- Bỏ qua frame rỗng / None
- Yêu cầu requestPixmap trả về pixmap hợp lệ
"""

import numpy as np
from PySide6.QtGui import QPixmap

from presentation.providers.video_image_provider import VideoImageProvider


def test_video_image_provider_initialization(qapp):
    """Kiểm tra khởi tạo VideoImageProvider với frame rỗng hợp lệ."""
    provider = VideoImageProvider()
    pixmap = provider.requestPixmap("live", None, None)
    assert isinstance(pixmap, QPixmap)
    assert not pixmap.isNull()
    assert pixmap.width() == 640
    assert pixmap.height() == 480


def test_video_image_provider_update_valid_frame(qapp):
    """Kiểm tra nạp khung hình OpenCV hợp lệ và kích thước thay đổi tương ứng."""
    provider = VideoImageProvider()

    # Tạo khung hình giả lập 720x1280 BGR
    test_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
    test_frame[:, :] = (100, 150, 200)  # BGR

    provider.update_frame(test_frame)
    pixmap = provider.requestPixmap("live", None, None)

    assert not pixmap.isNull()
    assert pixmap.width() == 1280
    assert pixmap.height() == 720


def test_video_image_provider_update_none_or_empty(qapp):
    """Kiểm tra provider bỏ qua an toàn khi frame là None hoặc mảng rỗng."""
    provider = VideoImageProvider()

    # Lưu pixmap ban đầu
    initial_pixmap = provider.requestPixmap("live", None, None)
    initial_w = initial_pixmap.width()

    # Cập nhật None
    provider.update_frame(None)
    assert provider.requestPixmap("live", None, None).width() == initial_w

    # Cập nhật mảng rỗng size 0
    empty_frame = np.array([], dtype=np.uint8)
    provider.update_frame(empty_frame)
    assert provider.requestPixmap("live", None, None).width() == initial_w
