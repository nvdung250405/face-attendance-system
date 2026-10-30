"""Kiểm thử tính sẵn sàng và tính toàn vẹn của môi trường phân hệ Kiosk.

Tuân thủ:
- BP-KIOSK-01 (Mục 2.2, 2.3, 2.4 & 4.3)
"""

import sqlite3


def test_core_dependencies_importable():
    """Kiểm tra toàn bộ thư viện cốt lõi đã được cài đặt và import thành công."""
    import cv2
    import httpx
    import numpy as np
    import onnxruntime as ort
    import PySide6
    import PySide6.QtQml
    import PySide6.QtQuick
    import stomp

    assert np.__version__ is not None
    assert cv2.__version__ is not None
    assert ort.__version__ is not None
    assert httpx.__version__ is not None
    assert stomp.__version__ is not None
    assert PySide6.__version__ is not None
    assert PySide6.QtQml.QQmlApplicationEngine is not None
    assert PySide6.QtQuick.QQuickImageProvider is not None


def test_kiosk_settings_configuration():
    """Kiểm tra đối tượng KioskConfig nạp đầy đủ tham số và ngưỡng hợp lệ."""
    from config.settings import settings

    assert isinstance(settings.kiosk_id, str) and len(settings.kiosk_id) > 0
    assert 0.0 < settings.liveness_threshold <= 1.0
    assert 0.0 < settings.cosine_similarity_threshold <= 1.0
    assert settings.cooldown_seconds >= 30
    assert settings.camera_frame_width >= 640
    assert settings.camera_frame_height >= 480
    assert settings.db_path.name == "kiosk_local.db"
    assert isinstance(settings.is_default_secret, bool)


def test_sqlite_wal_mode(tmp_path):
    """Kiểm tra khả năng kích hoạt chế độ SQLite WAL."""
    test_db = tmp_path / "test_kiosk.db"
    conn = sqlite3.connect(str(test_db))
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    mode = cursor.fetchone()[0]
    conn.close()

    assert mode.lower() == "wal"


def test_kiosk_logger_initialization(tmp_path):
    """Kiểm tra logger Kiosk tạo thành công và không bị crash."""
    from config.logger import get_logger

    test_logger = get_logger("unit_test")
    test_logger.info("Kiểm thử ghi log Kiosk thành công.")
    assert test_logger is not None


def test_qml_mvc_environment_readiness(qapp):
    """Kiểm tra tính sẵn sàng của kiến trúc MVC QML toàn diện."""
    from pathlib import Path

    from presentation.controllers.enrollment_controller import EnrollmentController
    from presentation.controllers.pin_controller import PinController
    from presentation.providers.video_image_provider import VideoImageProvider
    from presentation.viewmodels.kiosk_view_model import KioskViewModel, OvalState

    # Kiểm tra Controllers
    provider = VideoImageProvider()
    vm = KioskViewModel()
    pin = PinController()
    enroll = EnrollmentController()

    assert provider is not None
    assert vm.ovalState == OvalState.IDLE
    assert pin.currentPin == ""
    assert enroll.currentStep == 1

    # Kiểm tra cấu trúc Views QML trong resources/qml
    kiosk_root = Path(__file__).resolve().parent.parent
    expected_files = [
        "resources.qrc",
        "resources/qml/main.qml",
        "resources/qml/theme/Theme.qml",
        "resources/qml/theme/qmldir",
        "resources/qml/components/LiveCanvas.qml",
        "resources/qml/components/OvalOverlay.qml",
        "resources/qml/components/StatusBadge.qml",
        "resources/qml/components/VirtualKeypad.qml",
        "resources/qml/components/PortraitHeaderBar.qml",
        "resources/qml/components/WelcomeCanvas.qml",
        "resources/qml/components/PortraitCameraPanel.qml",
        "resources/qml/components/PortraitResultCard.qml",
        "resources/qml/components/PortraitActionDock.qml",
        "resources/qml/dialogs/PinDialog.qml",
        "resources/qml/dialogs/EnrollmentDialog.qml",
        "resources/qml/dialogs/HelpDialog.qml",
    ]
    for rel_path in expected_files:
        target = kiosk_root / rel_path
        assert target.exists(), f"Thiếu file: {target}"
        assert target.stat().st_size > 0, f"File rỗng: {target}"


