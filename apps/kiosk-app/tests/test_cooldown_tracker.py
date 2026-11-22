"""Bộ ca kiểm thử tự động cho CooldownTracker.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-03)
- TP-KIOSK-01 (Mục 6.2 & TC-KIOSK-08, TC-KIOSK-09)
"""

import threading

from core.cooldown.cooldown_tracker import CooldownStatus, CooldownTracker


def test_initial_state_not_in_cooldown():
    """Kiểm tra nhân viên chưa từng quẹt thẻ thì không bị chặn Cooldown (TC-KIOSK-08)."""
    tracker = CooldownTracker(cooldown_duration=120)
    status = tracker.check_cooldown(employee_id=101)

    assert isinstance(status, CooldownStatus)
    assert status.is_in_cooldown is False
    assert status.remaining_seconds == 0
    assert status.last_punch_time is None
    assert tracker.get_active_count() == 0


def test_record_punch_activates_cooldown():
    """Kiểm tra ghi nhận lần quẹt đầu tiên kích hoạt thành công Cooldown 120s (TC-KIOSK-08)."""
    tracker = CooldownTracker(cooldown_duration=120)
    t0 = 1000.0

    tracker.record_punch(employee_id=101, timestamp=t0)
    assert tracker.get_active_count(current_time=t0) == 1

    # Kiểm tra ngay lập tức tại t0
    status_0 = tracker.check_cooldown(employee_id=101, current_time=t0)
    assert status_0.is_in_cooldown is True
    assert status_0.remaining_seconds == 120
    assert status_0.last_punch_time == t0


def test_cooldown_blocks_rapid_punches():
    """Kiểm tra chặn lượt quẹt dồn dập trong khoảng 120 giây (TC-KIOSK-09)."""
    tracker = CooldownTracker(cooldown_duration=120)
    t0 = 1000.0
    tracker.record_punch(employee_id=101, timestamp=t0)

    # 1. Sau 30 giây: Vẫn còn 90s
    status_30 = tracker.check_cooldown(employee_id=101, current_time=t0 + 30.0)
    assert status_30.is_in_cooldown is True
    assert status_30.remaining_seconds == 90

    # 2. Sau 119.2 giây: Vẫn còn 1s làm tròn lên
    status_119 = tracker.check_cooldown(employee_id=101, current_time=t0 + 119.2)
    assert status_119.is_in_cooldown is True
    assert status_119.remaining_seconds == 1

    # 3. Nhân viên khác (ID: 102) không bị ảnh hưởng bởi ID: 101
    status_other = tracker.check_cooldown(employee_id=102, current_time=t0 + 30.0)
    assert status_other.is_in_cooldown is False


def test_cooldown_expires_after_duration():
    """Kiểm tra hết thời gian Cooldown thì cho phép quẹt tiếp (TC-KIOSK-09)."""
    tracker = CooldownTracker(cooldown_duration=120)
    t0 = 1000.0
    tracker.record_punch(employee_id=101, timestamp=t0)

    # Đúng 120 giây: Cooldown kết thúc
    status_exact = tracker.check_cooldown(employee_id=101, current_time=t0 + 120.0)
    assert status_exact.is_in_cooldown is False
    assert status_exact.remaining_seconds == 0

    # Sau 121 giây: Được phép quẹt
    status_after = tracker.check_cooldown(employee_id=101, current_time=t0 + 121.0)
    assert status_after.is_in_cooldown is False
    assert status_after.remaining_seconds == 0


def test_cleanup_expired_records():
    """Kiểm tra dọn dẹp các bản ghi quá hạn giải phóng RAM."""
    tracker = CooldownTracker(cooldown_duration=120)
    t0 = 1000.0

    tracker.record_punch(employee_id=1, timestamp=t0)  # Sẽ hết hạn tại t0 + 120
    tracker.record_punch(employee_id=2, timestamp=t0 + 60)  # Sẽ hết hạn tại t0 + 180

    # Tại t0 + 150: Nhân viên 1 đã hết hạn, nhân viên 2 còn hạn
    cleaned = tracker.cleanup_expired(current_time=t0 + 150.0)
    assert cleaned == 1
    assert tracker.get_active_count(current_time=t0 + 150.0) == 1

    # Nhân viên 1 không còn trong cache
    status_1 = tracker.check_cooldown(employee_id=1, current_time=t0 + 150.0)
    assert status_1.is_in_cooldown is False
    assert status_1.last_punch_time is None

    # Nhân viên 2 vẫn còn 30s
    status_2 = tracker.check_cooldown(employee_id=2, current_time=t0 + 150.0)
    assert status_2.is_in_cooldown is True
    assert status_2.remaining_seconds == 30


def test_reset_functionality():
    """Kiểm tra reset đơn lẻ và reset toàn bộ bộ đệm Cooldown."""
    tracker = CooldownTracker(cooldown_duration=120)
    tracker.record_punch(employee_id=101)
    tracker.record_punch(employee_id=102)
    assert tracker.get_active_count() == 2

    # Reset cho riêng ID: 101
    tracker.reset(employee_id=101)
    assert tracker.check_cooldown(employee_id=101).is_in_cooldown is False
    assert tracker.check_cooldown(employee_id=102).is_in_cooldown is True

    # Reset toàn bộ
    tracker.reset()
    assert tracker.get_active_count() == 0
    assert tracker.check_cooldown(employee_id=102).is_in_cooldown is False


def test_multithreaded_concurrency():
    """Kiểm tra an toàn đa luồng khi hàng chục luồng truy cập đồng thời."""
    tracker = CooldownTracker(cooldown_duration=120)

    def worker(emp_id: int):
        for _ in range(50):
            tracker.record_punch(emp_id)
            tracker.check_cooldown(emp_id)
            tracker.get_active_count()

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert tracker.get_active_count() == 10
