import sys
from pathlib import Path

import pytest

src_dir = Path(__file__).resolve().parent.parent / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

try:
    from PySide6.QtWidgets import QApplication

    HAS_QT_WIDGETS = True
except (ImportError, Exception):
    QApplication = None
    HAS_QT_WIDGETS = False


@pytest.fixture(autouse=True)
def isolate_test_db(tmp_path):
    """Cách ly database cục bộ trong thư mục tạm tmp_path cho từng test case (tránh ô nhiễm state giữa các test)."""
    from config.settings import settings

    original_db = settings.db_path
    test_db = tmp_path / "kiosk_local.db"
    object.__setattr__(settings, "db_path", test_db)
    yield test_db
    object.__setattr__(settings, "db_path", original_db)


@pytest.fixture(scope="session")
def qapp():
    """Khởi tạo QApplication duy nhất phục vụ kiểm thử cả tín hiệu QThread và Widget GUI."""
    if not HAS_QT_WIDGETS or QApplication is None:
        pytest.skip("PySide6.QtWidgets không thể khởi tạo trên môi trường thiếu libEGL/GUI")
    app = QApplication.instance()
    if app is None:
        app = QApplication([])
    return app
