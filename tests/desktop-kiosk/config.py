"""Cấu hình tập trung cho Phân hệ Kiểm thử Kiosk Desktop (FlaUI & PySide6 Visual).

Tự động nhận diện công cụ môi trường (FlaUI CLI, Python Interpreter) và xác định
các đường dẫn báo cáo cục bộ (tests/reports/kiosk-app/).
"""

import os
import shutil
import sys
from pathlib import Path

# Thư mục gốc
DESKTOP_TESTS_DIR = Path(__file__).resolve().parent
TESTS_DIR = DESKTOP_TESTS_DIR.parent
WORKSPACE_DIR = TESTS_DIR.parent
KIOSK_DIR = WORKSPACE_DIR / "apps" / "kiosk-app"
KIOSK_SRC_DIR = KIOSK_DIR / "src"
KIOSK_QML_DIR = KIOSK_DIR / "resources" / "qml"

# Thư mục báo cáo & Artifacts (Local Only)
REPORTS_DIR = TESTS_DIR / "reports" / "kiosk-app"
SCREENSHOTS_DIR = REPORTS_DIR / "screenshots"
BASELINES_DIR = SCREENSHOTS_DIR / "baselines"
E2E_SCREENSHOTS_DIR = SCREENSHOTS_DIR / "e2e"
DIFFS_DIR = SCREENSHOTS_DIR / "diffs"
AUDIT_DIR = REPORTS_DIR / "audit"
AUDIT_REPORT_PATH = AUDIT_DIR / "flaui_audit_report.json"

# Thư mục tạm runtime
TMP_DIR = TESTS_DIR / ".tmp"
FLAUI_SESSION_FILE = TMP_DIR / "flaui_e2e_session.json"


def get_python_executable() -> str:
    """Xác định Python interpreter hiện tại hoặc từ môi trường."""
    if os.environ.get("PYTHON_EXE"):
        return os.environ["PYTHON_EXE"]
    return sys.executable


def get_flaui_executable() -> str:
    """Tự động phát hiện FlaUI CLI từ PATH, Env hoặc .dotnet tools."""
    if os.environ.get("FLAUI_EXE"):
        return os.environ["FLAUI_EXE"]

    which_flaui = shutil.which("flaui") or shutil.which("flaui.exe")
    if which_flaui:
        return which_flaui

    dotnet_tool = Path.home() / ".dotnet" / "tools" / "flaui.exe"
    if dotnet_tool.exists():
        return str(dotnet_tool)

    return "flaui"
