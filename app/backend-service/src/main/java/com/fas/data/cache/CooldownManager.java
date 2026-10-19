package com.fas.data.cache;

import com.fas.config.CacheConfig;
import com.fas.data.enums.PunchType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

/**
 * Quản lý cơ chế chống quẹt thẻ lặp (Double Punching Cooldown Manager) theo DBL-BE-004 và data-design.md mục 2.
 * Key Pattern: cooldown:punch:{userId}:{date}
 * TTL: 120 giây
 */
@Service
public class CooldownManager {

    private static final Logger log = LoggerFactory.getLogger(CooldownManager.class);

    private final CacheManager cacheManager;

    @Value("${fas.attendance.cooldown-seconds:120}")
    private long cooldownSeconds;

    public CooldownManager(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Sinh khóa bộ nhớ đệm theo định dạng chuẩn: cooldown:punch:{userId}:{date}
     */
    public String buildKey(Long userId, LocalDate date) {
        return String.format("cooldown:punch:%d:%s", userId, date);
    }

    /**
     * Nguyên tử hóa kiểm tra + ghi nhận Cooldown chống quẹt trùng lặp (chống race condition).
     *
     * <p>Dùng {@code putIfAbsent} để đảm bảo trong các request đồng thời của cùng một nhân viên
     * chỉ có đúng một request sở hữu bản ghi Cooldown và được phép tiếp tục; các request còn lại
     * bị từ chối với {@code false}.</p>
     *
     * @return true nếu lượt quẹt được phép ghi nhận, false nếu đang trong thời gian Cooldown
     */
    public boolean tryAcquire(Long userId, LocalDate date, Instant punchInstant, PunchType punchType, String kioskId) {
        Cache cache = getCache();
        if (cache == null) {
            return true;
        }

        String key = buildKey(userId, date);
        CooldownPunchRecord candidate = new CooldownPunchRecord(userId, punchInstant, punchType, kioskId);

        Cache.ValueWrapper existing = cache.putIfAbsent(key, candidate);
        if (existing == null) {
            return true;
        }

        CooldownPunchRecord record = (CooldownPunchRecord) existing.get();
        Duration elapsed = Duration.between(record.lastPunchTimestamp(), punchInstant);

        boolean active = !elapsed.isNegative() && elapsed.getSeconds() < cooldownSeconds;
        if (active) {
            log.warn("Kích hoạt Cooldown cho userId={}, chênh lệch={}s (ngưỡng={}s). Từ chối ghi CSDL.",
                    userId, elapsed.getSeconds(), cooldownSeconds);
            return false;
        }

        // Đã hết thời gian giãn cách: ghi đè bản ghi mới và cho phép
        cache.put(key, candidate);
        return true;
    }

    /**
     * Kiểm tra lượt quẹt mới có vi phạm thời gian giãn cách Cooldown 120 giây hay không.
     *
     * @param userId              ID nhân viên
     * @param date                Ngày điểm danh
     * @param newPunchTimestamp   Mốc thời gian quẹt mới
     * @return true nếu còn trong thời gian Cooldown (dưới 120s), false nếu an toàn để ghi nhận
     */
    public boolean isCooldownActive(Long userId, LocalDate date, Instant newPunchTimestamp) {
        Optional<CooldownPunchRecord> recordOpt = getCooldownRecord(userId, date);
        if (recordOpt.isEmpty()) {
            return false;
        }

        CooldownPunchRecord record = recordOpt.get();
        Duration elapsed = Duration.between(record.lastPunchTimestamp(), newPunchTimestamp);

        boolean active = !elapsed.isNegative() && elapsed.getSeconds() < cooldownSeconds;
        if (active) {
            log.warn("Kích hoạt Cooldown cho userId={}, chênh lệch={}s (ngưỡng={}s). Từ chối ghi CSDL.",
                    userId, elapsed.getSeconds(), cooldownSeconds);
        }
        return active;
    }

    /**
     * Lưu trữ lượt quẹt thành công vào Caffeine Cache để kích hoạt Cooldown cho các lần tiếp theo.
     */
    public void recordPunch(Long userId, LocalDate date, Instant punchTimestamp, PunchType punchType, String kioskId) {
        Cache cache = getCache();
        if (cache != null) {
            String key = buildKey(userId, date);
            CooldownPunchRecord record = new CooldownPunchRecord(userId, punchTimestamp, punchType, kioskId);
            cache.put(key, record);
            log.debug("Đã lưu Cooldown cache: key={}, timestamp={}", key, punchTimestamp);
        }
    }

    /**
     * Lưu trữ lượt quẹt (rút gọn không kèm kioskId).
     */
    public void recordPunch(Long userId, LocalDate date, Instant punchTimestamp, PunchType punchType) {
        recordPunch(userId, date, punchTimestamp, punchType, null);
    }

    /**
     * Lấy bản ghi Cooldown gần nhất của nhân viên trong ngày.
     */
    public Optional<CooldownPunchRecord> getCooldownRecord(Long userId, LocalDate date) {
        Cache cache = getCache();
        if (cache == null) {
            return Optional.empty();
        }
        String key = buildKey(userId, date);
        CooldownPunchRecord record = cache.get(key, CooldownPunchRecord.class);
        return Optional.ofNullable(record);
    }

    /**
     * Xóa Cooldown của nhân viên (phục vụ HR can thiệp hoặc dọn dẹp kiểm thử).
     */
    public void clearCooldown(Long userId, LocalDate date) {
        Cache cache = getCache();
        if (cache != null) {
            cache.evict(buildKey(userId, date));
        }
    }

    private Cache getCache() {
        return cacheManager.getCache(CacheConfig.PUNCH_COOLDOWN_CACHE);
    }
}
