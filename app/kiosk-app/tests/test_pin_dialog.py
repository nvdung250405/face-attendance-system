"""Bộ ca kiểm thử tự động cho VirtualPinDialog và PinSecurityManager.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-04)
- TP-KIOSK-01 (Mục 6.2 & TC-KIOSK-10, TC-KIOSK-11, TC-KIOSK-12)
"""

import pytest

try:
    from ui.views.pin_dialog import PinLockoutStatus, PinSecurityManager, VirtualPinDialog
    HAS_PIN_DIALOG = True
except (ImportError, Exception):
    HAS_PIN_DIALOG = False

pytestmark = pytest.mark.skipif(
    not HAS_PIN_DIALOG,
    reason="Yêu cầu thư viện hệ thống đồ họa Qt (libEGL / display)",
)

# ------------------------------------------------------------------------------
# 1. Kiểm thử PinSecurityManager (Logic chống Brute-Force 15 phút - TC-KIOSK-12)
# ------------------------------------------------------------------------------

def test_pin_security_initial_state():
    """Kiểm tra trạng thái ban đầu của bộ quản lý bảo mật PIN."""
    manager = PinSecurityManager(max_attempts=5, lockout_minutes=15)
    status = manager.get_status()

    assert isinstance(status, PinLockoutStatus)
    assert status.is_locked is False
    assert status.remaining_seconds == 0
    assert status.failed_attempts == 0


def test_pin_security_consecutive_failures_lockout():
    """Kiểm tra khóa cưỡng bức 15 phút sau 5 lần nhập sai liên tiếp (TC-KIOSK-12)."""
    manager = PinSecurityManager(max_attempts=5, lockout_minutes=15)
    t0 = 2000.0

    # Lần 1 đến 4: Chưa khóa
    for i in range(1, 5):
        st = manager.record_failure(current_time=t0)
        assert st.is_locked is False
        assert st.failed_attempts == i

    # Lần 5: Đạt ngưỡng -> Kích hoạt khóa 15 phút (900 giây)
    st5 = manager.record_failure(current_time=t0)
    assert st5.is_locked is True
    assert st5.failed_attempts == 5
    assert st5.remaining_seconds == 900

    # Kiểm tra sau 300 giây (5 phút): Vẫn còn khóa 600 giây (10 phút)
    st_mid = manager.get_status(current_time=t0 + 300.0)
    assert st_mid.is_locked is True
    assert st_mid.remaining_seconds == 600

    # Kiểm tra sau 901 giây: Tự động hết hạn khóa và reset số lần sai
    st_end = manager.get_status(current_time=t0 + 901.0)
    assert st_end.is_locked is False
    assert st_end.remaining_seconds == 0
    assert st_end.failed_attempts == 0


def test_pin_security_reset_on_success():
    """Kiểm tra nhập đúng mã PIN trước 5 lần thì reset bộ đếm lỗi về 0."""
    manager = PinSecurityManager(max_attempts=5, lockout_minutes=15)
    t0 = 2000.0

    # Nhập sai 3 lần
    manager.record_failure(current_time=t0)
    manager.record_failure(current_time=t0)
    manager.record_failure(current_time=t0)
    assert manager.get_status(current_time=t0).failed_attempts == 3

    # Lần tiếp theo nhập đúng
    manager.record_success()
    st = manager.get_status(current_time=t0)
    assert st.failed_attempts == 0
    assert st.is_locked is False


# ------------------------------------------------------------------------------
# 2. Kiểm thử VirtualPinDialog (Giao diện Bàn phím số ảo - TC-KIOSK-10, TC-KIOSK-11)
# ------------------------------------------------------------------------------

def test_pin_dialog_initialization(qapp):
    """Kiểm tra khởi tạo hộp thoại VirtualPinDialog thành công (TC-KIOSK-10)."""
    dialog = VirtualPinDialog()
    assert dialog.windowTitle() == "Điểm danh Dự phòng bằng Mã PIN - FAS"
    assert dialog.id_input.text() == ""
    assert dialog.pin_input.text() == ""
    assert dialog.active_field == "id"
    assert dialog.keypad_widget.isEnabled() is True


def test_pin_dialog_keypad_typing(qapp):
    """Kiểm tra gõ số bằng phím ảo và thao tác xóa Backspace, Clear (TC-KIOSK-10)."""
    dialog = VirtualPinDialog()

    # 1. Gõ mã nhân viên "102"
    dialog._set_active_field("id")
    dialog._handle_digit("1")
    dialog._handle_digit("0")
    dialog._handle_digit("2")
    assert dialog.id_input.text() == "102"

    # Thử Backspace
    dialog._handle_backspace()
    assert dialog.id_input.text() == "10"

    # Thử Clear
    dialog._handle_clear()
    assert dialog.id_input.text() == ""

    # Gõ lại ID chuẩn
    dialog.id_input.setText("105")

    # 2. Chuyển sang ô PIN và gõ "123456"
    dialog._set_active_field("pin")
    for d in "123456":
        dialog._handle_digit(d)
    assert dialog.pin_input.text() == "123456"


def test_pin_dialog_validation_and_submission(qapp):
    """Kiểm tra validate dữ liệu đầu vào và phát tín hiệu pin_submitted (TC-KIOSK-11)."""
    dialog = VirtualPinDialog()

    submitted_payload = []
    dialog.pin_submitted.connect(lambda emp_id, pin: submitted_payload.append((emp_id, pin)))

    # 1. Bỏ trống Mã NV
    dialog.id_input.setText("")
    dialog.pin_input.setText("123456")
    dialog._handle_submit()
    assert len(submitted_payload) == 0
    assert "Mã nhân viên" in dialog.banner_label.text()

    # 2. Mã NV không phải số
    dialog.id_input.setText("ABC")
    dialog._handle_submit()
    assert len(submitted_payload) == 0

    # 3. Mã PIN thiếu ký tự (< 6 số)
    dialog.id_input.setText("105")
    dialog.pin_input.setText("12345")
    dialog._handle_submit()
    assert len(submitted_payload) == 0
    assert "đúng 6 chữ số" in dialog.banner_label.text()

    # 4. Hợp lệ hoàn toàn (ID: 105, PIN: "654321")
    dialog.pin_input.setText("654321")
    dialog._handle_submit()
    assert len(submitted_payload) == 1
    assert submitted_payload[0] == (105, "654321")


def test_pin_dialog_lockout_disables_keypad(qapp):
    """Kiểm tra khi bị khóa 15 phút, toàn bộ bàn phím ảo và nút bấm bị vô hiệu hóa (TC-KIOSK-12)."""
    manager = PinSecurityManager(max_attempts=2, lockout_minutes=15)
    dialog = VirtualPinDialog(security_manager=manager)

    # Lần 1 sai: Vẫn cho phép
    dialog.handle_auth_result(is_success=False)
    assert dialog.keypad_widget.isEnabled() is True
    assert "1 lần thử" in dialog.banner_label.text()

    # Lần 2 sai: Kích hoạt khóa
    dialog.handle_auth_result(is_success=False)
    assert dialog.keypad_widget.isEnabled() is False
    assert dialog.submit_button.isEnabled() is False
    assert "ĐÃ KHÓA 15 PHÚT" in dialog.banner_label.text()

    # Thử gõ phím khi đang khóa -> không có tác dụng
    dialog._handle_digit("9")
    assert "9" not in dialog.pin_input.text()
