package com.fas.api.dto.response;

import com.fas.data.entity.ConsentWithdrawal;

import java.time.Instant;

/**
 * Phản hồi Vết rút Informed Consent (DATA-BE-023, FR-BE-022, API-BE-041).
 */
public record ConsentWithdrawalResponse(
        Long id,
        Long userId,
        String employeeCode,
        Instant withdrawnAt,
        String clientIp,
        Instant biometricDisposalDueAt,
        Instant processedAt,
        Instant createdAt
) {
    public static ConsentWithdrawalResponse fromEntity(ConsentWithdrawal entity) {
        return new ConsentWithdrawalResponse(
                entity.getId(),
                entity.getUser() != null ? entity.getUser().getId() : null,
                entity.getUser() != null ? entity.getUser().getEmployeeCode() : null,
                entity.getWithdrawnAt(),
                entity.getClientIp(),
                entity.getBiometricDisposalDueAt(),
                entity.getProcessedAt(),
                entity.getCreatedAt()
        );
    }
}
