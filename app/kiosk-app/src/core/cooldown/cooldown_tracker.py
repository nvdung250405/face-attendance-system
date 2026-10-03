"""Module quản lý bộ nhớ đệm chống quẹt trùng lặp (CooldownTracker) tại biên.

Tài liệu tham chiếu:
- BP-KIOSK-01 (Mục 1.2 & FR-03 - CooldownTracker)
- TP-KIOSK-01 (Mục 6.2 & TC-KIOSK-08, TC-KIOSK-09)
- DDS.md (Mục 2.1 & 3.3 - Cooldown 120s tại biên)
- Đảm bảo an toàn đa luồng (Thread-safe) và tự động giải phóng bộ nhớ (Zero Memory Leak).
"""

import math
import threading
import time
from dataclasses import dataclass

from config.logger import get_logger
from config.settings import settings

logger = get_logger("cooldown_tracker")


@dataclass(frozen=True)
class CooldownStatus:
    """Trạng thái đệm thời gian chờ của nhân viên."""

    is_in_cooldown: bool  # True nếu nhân viên đang trong thời gian chờ (bị từ chối)
    remaining_seconds: int  # Số giây còn lại phải chờ (0 nếu đã hết hạn)
    last_punch_time: float | None  # Mốc thời gian Unix của lần quẹt trước đó


class CooldownTracker:
    """Bộ đệm ghi nhớ mốc thời gian chấm công tại biên để ngăn quẹt dồn dập trong 120s."""

    def __init__(self, cooldown_duration: int | None = None) -> None:
        """Khởi tạo CooldownTracker.

        Args:
            cooldown_duration: Khoảng thời gian giãn cách tối thiểu (giây), mặc định từ settings: 120.
        """
        self.cooldown_duration: int = (
            cooldown_duration
            if cooldown_duration is not None
            else settings.cooldown_seconds
        )
        self.cleanup_interval: float = 300.0
        self._last_cleanup: float = time.time()
        self._cache: dict[int, float] = {}
        self._lock = threading.Lock()
        logger.info("CooldownTracker đã khởi tạo [duration=%d giây, cleanup_interval=%.1fs]", self.cooldown_duration, self.cleanup_interval)

    def check_cooldown(
        self,
        employee_id: int,
        current_time: float | None = None,
    ) -> CooldownStatus:
        """Kiểm tra xem nhân viên có đang trong thời gian giãn cách Cooldown hay không.

        Args:
            employee_id: Mã định danh nhân viên.
            current_time: Mốc thời gian kiểm tra (Unix timestamp), mặc định là time.time().

        Returns:
            CooldownStatus: Thông tin trạng thái cooldown và số giây còn lại.
        """
        now = current_time if current_time is not None else time.time()

        with self._lock:
            # Tự động dọn dẹp các mục > 300s theo DATA-KSK-003
            if (now - self._last_cleanup) >= self.cleanup_interval:
                expired = [
                    eid for eid, pt in self._cache.items()
                    if (now - pt) >= self.cleanup_interval
                ]
                for eid in expired:
                    del self._cache[eid]
                self._last_cleanup = now
                if expired:
                    logger.info("Auto-cleanup đã xóa %d bản ghi Cooldown quá hạn 300s", len(expired))

            last_punch = self._cache.get(employee_id)

            if last_punch is None:
                return CooldownStatus(
                    is_in_cooldown=False,
                    remaining_seconds=0,
                    last_punch_time=None,
                )

            elapsed = now - last_punch
            if elapsed < self.cooldown_duration:
                remaining = int(math.ceil(self.cooldown_duration - elapsed))
                return CooldownStatus(
                    is_in_cooldown=True,
                    remaining_seconds=max(1, remaining),
                    last_punch_time=last_punch,
                )

            return CooldownStatus(
                is_in_cooldown=False,
                remaining_seconds=0,
                last_punch_time=last_punch,
            )

    def record_punch(
        self,
        employee_id: int,
        timestamp: float | None = None,
    ) -> None:
        """Ghi nhận lượt chấm công thành công để kích hoạt bộ đếm Cooldown.

        Args:
            employee_id: Mã định danh nhân viên vừa điểm danh.
            timestamp: Mốc thời gian ghi nhận (Unix timestamp), mặc định là time.time().
        """
        punch_time = timestamp if timestamp is not None else time.time()

        with self._lock:
            self._cache[employee_id] = punch_time
            logger.info(
                "Đã kích hoạt Cooldown %ds cho nhân viên ID: %d",
                self.cooldown_duration,
                employee_id,
            )

    def cleanup_expired(self, current_time: float | None = None) -> int:
        """Dọn dẹp các bản ghi Cooldown đã hết hạn để giải phóng bộ nhớ RAM.

        Args:
            current_time: Mốc thời gian kiểm tra, mặc định là time.time().

        Returns:
            int: Số lượng bản ghi đã được dọn dẹp khỏi RAM.
        """
        now = current_time if current_time is not None else time.time()
        expired_ids: list[int] = []

        with self._lock:
            for emp_id, punch_time in self._cache.items():
                if (now - punch_time) >= self.cooldown_duration:
                    expired_ids.append(emp_id)

            for emp_id in expired_ids:
                del self._cache[emp_id]

        if expired_ids:
            logger.info("Đã dọn dẹp %d bản ghi Cooldown hết hạn khỏi RAM", len(expired_ids))
        return len(expired_ids)

    def reset(self, employee_id: int | None = None) -> None:
        """Xóa bỏ trạng thái Cooldown phục vụ kiểm thử hoặc giải phóng khẩn cấp.

        Args:
            employee_id: Mã nhân viên cần xóa (nếu None thì xóa toàn bộ bộ đệm).
        """
        with self._lock:
            if employee_id is not None:
                if employee_id in self._cache:
                    del self._cache[employee_id]
                    logger.info("Đã reset Cooldown cho nhân viên ID: %d", employee_id)
            else:
                self._cache.clear()
                logger.info("Đã xóa trắng toàn bộ bộ đệm Cooldown")

    def get_active_count(self, current_time: float | None = None) -> int:
        """Lấy số lượng nhân viên hiện đang trong thời gian Cooldown kích hoạt.

        Args:
            current_time: Mốc thời gian kiểm tra, mặc định là time.time().

        Returns:
            int: Số lượng nhân viên đang bị chặn quẹt trùng.
        """
        now = current_time if current_time is not None else time.time()
        with self._lock:
            count = sum(
                1
                for punch_time in self._cache.values()
                if (now - punch_time) < self.cooldown_duration
            )
            return count
