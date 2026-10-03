package com.fas.data.cache;

import com.fas.data.enums.PunchType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TST-BE-DAT-004: Kiểm thử Cooldown Cache 120 Giây.
 * Covers: DBL-BE-004, SOL-BE-002.
 */
@SpringBootTest
@ActiveProfiles("test")
class CooldownManagerTest {

    @Autowired
    private CooldownManager cooldownManager;

    private final Long testUserId = 9999L;
    private final LocalDate today = LocalDate.now();

    @BeforeEach
    void setUp() {
        cooldownManager.clearCooldown(testUserId, today);
    }

    @Test
    @DisplayName("TST-BE-DAT-004: Lượt quẹt đầu tiên không bị chặn bởi Cooldown")
    void testFirstPunchAllowed() {
        Instant now = Instant.now();
        boolean active = cooldownManager.isCooldownActive(testUserId, today, now);
        assertThat(active).isFalse();
    }

    @Test
    @DisplayName("TST-BE-DAT-004: Quẹt lần 2 trong vòng 120s bị chặn tức thời từ bộ nhớ RAM (Cache Hit)")
    void testSecondPunchWithin120SecondsBlocked() {
        Instant firstPunchTime = Instant.now();

        // 1. Ghi nhận lượt quẹt đầu tiên
        cooldownManager.recordPunch(testUserId, today, firstPunchTime, PunchType.CHECK_IN, "KIOSK-01");

        // 2. Kiểm tra bản ghi trong bộ nhớ RAM
        Optional<CooldownPunchRecord> recordOpt = cooldownManager.getCooldownRecord(testUserId, today);
        assertThat(recordOpt).isPresent();
        assertThat(recordOpt.get().userId()).isEqualTo(testUserId);
        assertThat(recordOpt.get().punchType()).isEqualTo(PunchType.CHECK_IN);
        assertThat(recordOpt.get().kioskId()).isEqualTo("KIOSK-01");

        // 3. Quẹt lại sau 30 giây -> Cooldown phải kích hoạt (true)
        Instant secondPunchTime = firstPunchTime.plus(30, ChronoUnit.SECONDS);
        boolean active = cooldownManager.isCooldownActive(testUserId, today, secondPunchTime);
        assertThat(active).isTrue();

        // 4. Quẹt lại sau 119 giây -> Vẫn trong thời gian Cooldown (true)
        Instant nearLimitPunchTime = firstPunchTime.plus(119, ChronoUnit.SECONDS);
        assertThat(cooldownManager.isCooldownActive(testUserId, today, nearLimitPunchTime)).isTrue();
    }

    @Test
    @DisplayName("TST-BE-DAT-004: Quẹt sau 120s được cho phép bình thường (Cooldown hết hiệu lực)")
    void testPunchAfter120SecondsAllowed() {
        Instant firstPunchTime = Instant.now();
        cooldownManager.recordPunch(testUserId, today, firstPunchTime, PunchType.CHECK_IN);

        // Quẹt lại sau 121 giây -> Cooldown hết hạn (false)
        Instant subsequentPunchTime = firstPunchTime.plus(121, ChronoUnit.SECONDS);
        boolean active = cooldownManager.isCooldownActive(testUserId, today, subsequentPunchTime);
        assertThat(active).isFalse();
    }

    @Test
    @DisplayName("DBL-BE-004: Hai nhân viên khác nhau quẹt đồng thời không ảnh hưởng lẫn nhau")
    void testIndependentUsersCooldown() {
        Long anotherUser = 8888L;
        cooldownManager.clearCooldown(anotherUser, today);

        Instant punchTime = Instant.now();
        cooldownManager.recordPunch(testUserId, today, punchTime, PunchType.CHECK_IN);

        // testUserId bị cooldown
        assertThat(cooldownManager.isCooldownActive(testUserId, today, punchTime.plusSeconds(10))).isTrue();

        // anotherUser chưa quẹt nên không bị cooldown
        assertThat(cooldownManager.isCooldownActive(anotherUser, today, punchTime.plusSeconds(10))).isFalse();
    }

    @Test
    @DisplayName("DBL-BE-004: Xóa Cooldown cho phép quẹt lại ngay lập tức")
    void testClearCooldownAllowsImmediatePunch() {
        Instant now = Instant.now();
        cooldownManager.recordPunch(testUserId, today, now, PunchType.CHECK_IN);
        assertThat(cooldownManager.isCooldownActive(testUserId, today, now.plusSeconds(10))).isTrue();

        // Xóa cooldown
        cooldownManager.clearCooldown(testUserId, today);
        assertThat(cooldownManager.isCooldownActive(testUserId, today, now.plusSeconds(10))).isFalse();
    }
}
