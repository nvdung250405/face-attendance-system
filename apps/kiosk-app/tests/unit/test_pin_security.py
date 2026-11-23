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


def test_pin_security_sqlite_persistence_across_restarts(tmp_path):
    """FIND-SEC-003: Kiểm tra lưu trữ trạng thái khóa PIN vào SQLite qua các lần khởi động lại app."""
    from core.offline.sqlite_manager import SQLiteQueueManager

    db_path = tmp_path / "pin_lockout_test.db"
    queue_mgr = SQLiteQueueManager(db_path=db_path)

    t0 = 5000.0
    # 1. Khởi tạo phiên thứ nhất, nhập sai 2 lần
    mgr1 = PinSecurityManager(max_attempts=5, lockout_minutes=15, sqlite_manager=queue_mgr)
    mgr1.record_failure(current_time=t0)
    mgr1.record_failure(current_time=t0)
    assert mgr1.failed_attempts == 2

    # 2. Giả lập khởi động lại ứng dụng (tạo instance mới kết nối cùng database)
    mgr2 = PinSecurityManager(max_attempts=5, lockout_minutes=15, sqlite_manager=queue_mgr)
    assert mgr2.failed_attempts == 2
    assert mgr2.get_status(current_time=t0).failed_attempts == 2

    # 3. Tiếp tục nhập sai 3 lần nữa -> kích hoạt khóa 15 phút (900s)
    mgr2.record_failure(current_time=t0)
    mgr2.record_failure(current_time=t0)
    st = mgr2.record_failure(current_time=t0)
    assert st.is_locked is True
    assert st.failed_attempts == 5

    # 4. Giả lập khởi động lại ứng dụng trong lúc đang bị khóa
    mgr3 = PinSecurityManager(max_attempts=5, lockout_minutes=15, sqlite_manager=queue_mgr)
    # 300s sau: Vẫn phải bị khóa (còn 600s)
    st_mid = mgr3.get_status(current_time=t0 + 300.0)
    assert st_mid.is_locked is True
    assert st_mid.remaining_seconds == 600
    assert st_mid.failed_attempts == 5

    # 5. Giả lập khởi động lại ứng dụng sau khi hết thời hạn khóa (901s sau)
    mgr4 = PinSecurityManager(max_attempts=5, lockout_minutes=15, sqlite_manager=queue_mgr)
    st_end = mgr4.get_status(current_time=t0 + 901.0)
    assert st_end.is_locked is False
    assert st_end.remaining_seconds == 0
    assert st_end.failed_attempts == 0

    # 6. Kiểm tra lại SQLite cũng đã được giải phóng
    mgr5 = PinSecurityManager(max_attempts=5, lockout_minutes=15, sqlite_manager=queue_mgr)
    assert mgr5.failed_attempts == 0
    assert mgr5.get_status(current_time=t0 + 901.0).is_locked is False
