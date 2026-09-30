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
    import stomp

    assert np.__version__ is not None
    assert cv2.__version__ is not None
    assert ort.__version__ is not None
    assert httpx.__version__ is not None
    assert stomp.__version__ is not None
    assert PySide6.__version__ is not None


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
