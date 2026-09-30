"""Điểm khởi động chính của Phân hệ Trạm Điểm danh Kiosk Desktop (FAS Kiosk).

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 2.5 - Khởi tạo & chạy dự án)
- DDS.md (Mục 2.1 & 3.5 - Giao diện người dùng Kiosk)
"""

import platform
import sqlite3
import sys
from pathlib import Path

from config.logger import get_logger
from config.settings import settings

logger = get_logger("main")


def check_sqlite_wal(db_path: Path) -> bool:
    """Kiểm tra và kích hoạt chế độ SQLite WAL an toàn.

    Args:
        db_path: Đường dẫn tệp database SQLite.

    Returns:
        bool: True nếu SQLite sẵn sàng ở chế độ WAL.
    """
    try:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        mode = cursor.fetchone()[0]
        cursor.execute("PRAGMA synchronous=NORMAL;")
        conn.close()
        logger.info("Khởi tạo SQLite database: %s [journal_mode=%s]", db_path.name, mode)
        return True
    except Exception as exc:
        logger.error("Không thể cấu hình SQLite WAL: %s", exc)
        return False


def main() -> int:
    """Hàm khởi động chính của ứng dụng Kiosk Desktop."""
    logger.info("=" * 60)
    logger.info("KHỞI ĐỘNG PHÂN HỆ TRẠM ĐIỂM DANH KIOSK DESKTOP (FAS)")
    logger.info("=" * 60)
    logger.info("Phiên bản Python: %s (%s)", platform.python_version(), platform.platform())
    logger.info("Kiosk ID:        %s", settings.kiosk_id)
    logger.info("Backend REST:    %s", settings.backend_url)
    logger.info("WebSocket STOMP: %s", settings.stomp_ws_url)
    logger.info("Camera Index:    %d (%dx%d @ %d FPS)",
                settings.camera_device_index,
                settings.camera_frame_width,
                settings.camera_frame_height,
                settings.camera_fps)
    logger.info("Ngưỡng Liveness: %.2f", settings.liveness_threshold)
    logger.info("Ngưỡng Cosine:   %.2f", settings.cosine_similarity_threshold)
    logger.info("Thời gian chờ:   %d giây (Cooldown)", settings.cooldown_seconds)

    # 1. Kiểm tra CSDL SQLite cục bộ chế độ WAL
    sqlite_ok = check_sqlite_wal(settings.db_path)
    if not sqlite_ok:
        logger.warning("Cảnh báo: CSDL cục bộ SQLite gặp vấn đề khởi tạo!")

    # 2. Kiểm tra trạng thái các mô hình ONNX
    models_status = {
        "YuNet Face Detector": settings.yunet_model_path.exists(),
        "MiniFASNet Liveness Gate": settings.minifasnet_model_path.exists(),
        "ArcFace MobileFaceNet": settings.arcface_model_path.exists(),
    }
    for model_name, exists in models_status.items():
        status_text = "SẴN SÀNG" if exists else "CHƯA TẢI (Sẽ tải qua download_models.py)"
        logger.info("Mô hình AI: %-26s -> [%s]", model_name, status_text)

    logger.info("-" * 60)
    logger.info("Môi trường Kiosk đã được thiết lập thành công và sẵn sàng để xây dựng các module nghiệp vụ.")
    logger.info("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
