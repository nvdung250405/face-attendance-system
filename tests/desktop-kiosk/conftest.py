"""conftest.py cho Phân hệ Kiểm thử Kiosk Desktop.

Ngăn chặn ô nhiễm thư mục gốc (Root Pollution) bằng cách di chuyển / dọn dẹp
.pytest_cache khỏi thư mục gốc Monorepo sau khi kết thúc phiên kiểm thử.
"""

import shutil
from pathlib import Path
import pytest


def pytest_unconfigure(config: pytest.Config) -> None:
    """Dọn dẹp .pytest_cache tại repository root nếu phát sinh."""
    root_cache = config.rootpath / ".pytest_cache"
    kiosk_cache = config.rootpath / "app" / "kiosk-app" / ".pytest_cache"
    if root_cache.exists():
        if not kiosk_cache.exists():
            shutil.copytree(root_cache, kiosk_cache, dirs_exist_ok=True)
        shutil.rmtree(root_cache, ignore_errors=True)
