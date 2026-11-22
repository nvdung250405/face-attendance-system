package com.fas.api.dto.response;

import com.fas.data.entity.PayrollPeriod;
import com.fas.data.enums.PayrollPeriodStatus;

import java.time.Instant;

/**
 * Phản hồi chi tiết Kỳ công (DATA-BE-021, FR-BE-021, API-BE-039..040).
 */
public record PayrollPeriodResponse(
        Long id,
        Integer periodYear,
        Integer periodMonth,
        PayrollPeriodStatus status,
        Long lockedById,
        String lockedByName,
        Instant lockedAt,
        Long unlockedById,
        String unlockedByName,
        Instant unlockedAt,
        String unlockReason,
        Instant createdAt,
        Instant updatedAt
) {
    public static PayrollPeriodResponse fromEntity(PayrollPeriod entity) {
        Long lockedById = entity.getLockedBy() != null ? entity.getLockedBy().getId() : null;
        String lockedByName = entity.getLockedBy() != null ? entity.getLockedBy().getFullName() : null;
        Long unlockedById = entity.getUnlockedBy() != null ? entity.getUnlockedBy().getId() : null;
        String unlockedByName = entity.getUnlockedBy() != null ? entity.getUnlockedBy().getFullName() : null;

        return new PayrollPeriodResponse(
                entity.getId(),
                entity.getPeriodYear(),
                entity.getPeriodMonth(),
                entity.getStatus(),
                lockedById,
                lockedByName,
                entity.getLockedAt(),
                unlockedById,
                unlockedByName,
                entity.getUnlockedAt(),
                entity.getUnlockReason(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
