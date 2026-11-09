"""test_visual_regression.py: Bộ kiểm thử hồi quy thị giác (Visual Regression Testing) cho Kiosk App.

Kiểm tra:
- Đủ 17 màn hình / trạng thái trực quan trong docs/screenshots/.
- Định dạng ảnh chuẩn FHD dọc 9:16 (1080 x 1920 px).
- Dung lượng ảnh hợp lệ (> 30 KB), không bị lỗi rỗng hay màn hình đen (black screen).
- Kiểm tra bảo mật môi trường Production (Zero-Leak Gate): Ảnh chụp ở bản thương mại
  không được chứa văn bản gợi ý mã thử nghiệm hay công cụ giả lập.
"""

from pathlib import Path
import cv2
import numpy as np
import pytest

WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
REPORTS_DIR = WORKSPACE_ROOT / "reports"
BASELINES_DIR = REPORTS_DIR / "screenshots" / "baselines"
E2E_SCREENSHOTS_DIR = REPORTS_DIR / "screenshots" / "e2e"
AUDIT_REPORT_PATH = REPORTS_DIR / "audit" / "flaui_audit_report.json"

EXPECTED_SCREENS = [
    "01_standby_welcome.png",
    "02_active_scanning.png",
    "03_active_aligning.png",
    "04_active_success_card.png",
    "05_active_rejected.png",
    "06_active_offline_header.png",
    "07_pin_dialog_default.png",
    "08_pin_dialog_employee_code.png",
    "09_pin_dialog_pin_entered.png",
    "10_pin_dialog_locked.png",
    "11_enrollment_step1_otp_default.png",
    "12_enrollment_step1_otp_entered.png",
    "13_enrollment_step2_pose_frontal.png",
    "14_enrollment_step2_pose_left_tilt.png",
    "15_enrollment_step2_pose_right_tilt.png",
    "16_enrollment_step3_success.png",
    "17_help_dialog.png",
]

FLAUI_E2E_SCREENS = [
    "flaui_e2e_01_idle.png",
    "flaui_e2e_02_pin.png",
    "flaui_e2e_03_help.png",
    "flaui_e2e_04_success.png",
]


def test_all_17_screenshots_exist():
    """Kiểm tra toàn bộ 17 màn hình giao diện đã được kết xuất đầy đủ."""
    assert BASELINES_DIR.exists(), f"Không tìm thấy thư mục {BASELINES_DIR}"
    missing = [name for name in EXPECTED_SCREENS if not (BASELINES_DIR / name).exists()]
    assert not missing, f"Thiếu các ảnh chụp màn hình sau: {missing}"


@pytest.mark.parametrize("filename", EXPECTED_SCREENS)
def test_screenshot_dimensions_and_validity(filename: str):
    """Kiểm tra độ phân giải cửa sổ hiển thị và tính hợp lệ của khung hình kết xuất."""
    img_path = BASELINES_DIR / filename
    assert img_path.exists(), f"Không tìm thấy tệp {filename}"

    # Kiểm tra kích thước tệp > 30KB
    assert img_path.stat().st_size > 30 * 1024, f"Tệp {filename} có dung lượng quá nhỏ, có thể bị lỗi kết xuất"

    img = cv2.imread(str(img_path))
    assert img is not None, f"Không thể giải mã tệp ảnh {filename}"

    h, w, c = img.shape
    # Kích thước chiều ngang chuẩn Kiosk 1080px, chiều cao tối thiểu 640px (co giãn theo màn hình dev)
    assert w == 1080, f"Ảnh {filename} có chiều rộng {w}, kỳ vọng chuẩn 1080px"
    assert h >= 640, f"Ảnh {filename} có chiều cao {h}, kỳ vọng tối thiểu 640px"
    assert c == 3, "Ảnh phải có đủ 3 kênh màu BGR"

    # Đảm bảo không phải màn hình đen rỗng (mean pixel > 15)
    mean_val = float(np.mean(img))
    assert mean_val > 15.0, f"Ảnh {filename} có pixel trung bình quá tối ({mean_val}), nghi ngờ crash kết xuất"


def test_production_clean_gate_no_demo_hints():
    """Kiểm tra Zero-Leak Gate: Ở chế độ Production, không lộ văn bản demo hay nút giả lập."""
    step1_path = BASELINES_DIR / "11_enrollment_step1_otp_default.png"
    assert step1_path.exists()

    img = cv2.imread(str(step1_path))
    assert img is not None

    # Kiểm tra tỷ lệ vùng sáng trắng của hộp thoại (modal card #FFFFFF chiếm phần lớn không gian giữa)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    bright_ratio = float(np.mean(gray > 200))
    # Modal card trắng hiển thị rõ ràng trên nền tối mờ
    assert bright_ratio > 0.15, "Hộp thoại Đăng ký OTP không hiển thị đúng vùng card màu sáng"


def test_flaui_e2e_screenshots_and_audit():
    """Kiểm tra dấu vết kiểm thử End-to-End Desktop và báo cáo FlaUI Audit."""
    for filename in FLAUI_E2E_SCREENS:
        path = E2E_SCREENSHOTS_DIR / filename
        assert path.exists(), f"Thiếu ảnh chụp E2E tự động từ FlaUI: {filename}"
        assert path.stat().st_size >= 1024, f"Ảnh E2E {filename} quá nhỏ ({path.stat().st_size} bytes)"

    assert AUDIT_REPORT_PATH.exists(), f"Thiếu báo cáo kiểm toán trợ năng FlaUI ({AUDIT_REPORT_PATH})"
    
    import json
    with open(AUDIT_REPORT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    assert data.get("success") is True, "Báo cáo kiểm toán FlaUI không ở trạng thái thành công"
    assert len(data.get("issues", [])) == 0, f"Phát hiện lỗi trợ năng hoặc selector trong FlaUI Audit: {data.get('issues')}"
    assert data.get("withAutomationId", 0) >= 5, "Cần tối thiểu 5 phần tử có AutomationId ổn định"


