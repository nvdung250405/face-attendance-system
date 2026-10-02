"""Core Security: Quản lý bảo mật mã PIN và cơ chế chống brute-force."""

import math
import time
from dataclasses import dataclass

from config.logger import get_logger
from config.settings import settings

logger = get_logger("pin_security")


@dataclass(frozen=True)
class PinLockoutStatus:
    """Trạng thái khóa bàn phím do nhập sai mã PIN liên tiếp."""

    is_locked: bool
    remaining_seconds: int
    failed_attempts: int


class PinSecurityManager:
    """Quản lý số lần nhập sai mã PIN và cơ chế khóa cưỡng bức 15 phút chống brute-force."""

    def __init__(
        self,
        max_attempts: int | None = None,
        lockout_minutes: int | None = None,
    ) -> None:
        """Khởi tạo PinSecurityManager."""
        self.max_attempts: int = (
            max_attempts if max_attempts is not None else settings.max_pin_attempts
        )
        self.lockout_duration_sec: int = (
            (lockout_minutes if lockout_minutes is not None else settings.pin_lockout_minutes)
            * 60
        )
        self.failed_attempts: int = 0
        self.lockout_until_timestamp: float | None = None

    def get_status(self, current_time: float | None = None) -> PinLockoutStatus:
        """Lấy trạng thái khóa hiện thời của bàn phím."""
        now = current_time if current_time is not None else time.time()

        if self.lockout_until_timestamp is not None:
            if now < self.lockout_until_timestamp:
                remaining = int(math.ceil(self.lockout_until_timestamp - now))
                return PinLockoutStatus(
                    is_locked=True,
                    remaining_seconds=max(1, remaining),
                    failed_attempts=self.failed_attempts,
                )
            # Hết thời hạn khóa -> tự động mở khóa và reset số lần sai
            self.lockout_until_timestamp = None
            self.failed_attempts = 0

        return PinLockoutStatus(
            is_locked=False,
            remaining_seconds=0,
            failed_attempts=self.failed_attempts,
        )

    def record_failure(self, current_time: float | None = None) -> PinLockoutStatus:
        """Ghi nhận một lần nhập sai mã PIN và kích hoạt khóa nếu đạt ngưỡng."""
        now = current_time if current_time is not None else time.time()
        self.failed_attempts += 1
        logger.warning(
            "Nhập sai mã PIN lần thứ %d/%d", self.failed_attempts, self.max_attempts
        )

        if self.failed_attempts >= self.max_attempts:
            self.lockout_until_timestamp = now + self.lockout_duration_sec
            logger.error(
                "Đã khóa bàn phím PIN trong %d phút do nhập sai quá %d lần!",
                self.lockout_duration_sec // 60,
                self.max_attempts,
            )

        return self.get_status(current_time=now)

    def record_success(self) -> None:
        """Ghi nhận nhập mã PIN thành công, reset lại số lần sai về 0."""
        self.failed_attempts = 0
        self.lockout_until_timestamp = None
        logger.info("Xác thực PIN thành công, đã reset bộ đếm lỗi về 0.")

    def reset(self) -> None:
        """Reset khẩn cấp trạng thái khóa."""
        self.failed_attempts = 0
        self.lockout_until_timestamp = None
