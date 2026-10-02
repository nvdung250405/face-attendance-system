"""Bộ ca kiểm thử đơn vị cho PinSecurityManager (Logic chống Brute-Force 15 phút - TC-KIOSK-12).

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-04)
- TP-KIOSK-01 (Mục 6.2 & TC-KIOSK-12)
"""

from core.security.pin_security import PinLockoutStatus, PinSecurityManager


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
