import pytest

try:
    from PySide6.QtWidgets import QApplication
    HAS_QT_WIDGETS = True
except (ImportError, Exception):
    QApplication = None
    HAS_QT_WIDGETS = False


@pytest.fixture(scope="session")
def qapp():
    """Khởi tạo QApplication duy nhất phục vụ kiểm thử cả tín hiệu QThread và Widget GUI."""
    if not HAS_QT_WIDGETS or QApplication is None:
        pytest.skip("PySide6.QtWidgets không thể khởi tạo trên môi trường thiếu libEGL/GUI")
    app = QApplication.instance()
    if app is None:
        app = QApplication([])
    return app
