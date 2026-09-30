"""Cấu hình fixtures dùng chung cho toàn bộ bộ kiểm thử Pytest của Kiosk.

Tuân thủ quy chuẩn PySide6:
- Khởi tạo duy nhất một đối tượng QApplication cho cả test suite.
"""

import pytest
from PySide6.QtWidgets import QApplication


@pytest.fixture(scope="session")
def qapp():
    """Khởi tạo QApplication duy nhất phục vụ kiểm thử cả tín hiệu QThread và Widget GUI."""
    app = QApplication.instance()
    if app is None:
        app = QApplication([])
    return app
