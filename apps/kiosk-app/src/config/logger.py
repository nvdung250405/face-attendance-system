"""Module khởi tạo và quản lý nhật ký hệ thống (Logging) cho Kiosk.

Tuân thủ:
- BP-KIOSK-01 Mục 3.5 (Error handling / logging)
- RotatingFileHandler: 10 MB/tệp, backupCount=5
- Ghi song song ra tệp logs/kiosk/kiosk_runtime.log và console
"""

import logging
import sys
from logging.handlers import RotatingFileHandler

from config.settings import settings


def setup_kiosk_logger(log_name: str = "kiosk_app") -> logging.Logger:
    """Khởi tạo và cấu hình bộ ghi log xoay vòng cho Kiosk.

    Args:
        log_name: Tên logger cần lấy.

    Returns:
        logging.Logger: Đối tượng logger đã gắn Handler console và xoay vòng tệp.
    """
    logger = logging.getLogger(log_name)

    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)

    log_format = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] [%(name)s:%(lineno)d] - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # 1. Console Handler (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(log_format)
    console_handler.setLevel(logging.INFO)
    logger.addHandler(console_handler)

    # 2. Rotating File Handler (10MB x 5 backups)
    logs_dir = settings.logs_dir
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_file_path = logs_dir / "kiosk_runtime.log"

    try:
        file_handler = RotatingFileHandler(
            filename=str(log_file_path),
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5,
            encoding="utf-8",
        )
        file_handler.setFormatter(log_format)
        file_handler.setLevel(logging.INFO)
        logger.addHandler(file_handler)
    except Exception as exc:
        logger.warning("Không thể khởi tạo file log handler tại %s: %s", log_file_path, exc)

    return logger


def get_logger(name: str) -> logging.Logger:
    """Lấy logger con theo tên module.

    Args:
        name: Tên module (__name__).

    Returns:
        logging.Logger: Logger tương ứng.
    """
    setup_kiosk_logger("kiosk_app")
    return logging.getLogger(f"kiosk_app.{name}")
