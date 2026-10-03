package com.fas.data.cache;

import com.fas.data.enums.PunchType;

import java.io.Serializable;
import java.time.Instant;

/**
 * Bản ghi lưu trữ lượt quẹt thẻ gần nhất trong Caffeine Cache phục vụ chống quẹt lặp (Double Punching).
 * Cấu trúc theo đặc tả data-design.md mục 2.
 */
public record CooldownPunchRecord(
        Long userId,
        Instant lastPunchTimestamp,
        PunchType punchType,
        String kioskId
) implements Serializable {

    public CooldownPunchRecord(Long userId, Instant lastPunchTimestamp, PunchType punchType) {
        this(userId, lastPunchTimestamp, punchType, null);
    }
}
