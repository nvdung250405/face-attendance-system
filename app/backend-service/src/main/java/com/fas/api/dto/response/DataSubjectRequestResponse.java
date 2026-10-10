package com.fas.api.dto.response;

import com.fas.data.entity.DataSubjectRequest;
import com.fas.data.enums.DataSubjectRequestStatus;
import com.fas.data.enums.DataSubjectRequestType;

import java.time.Instant;

/**
 * Phản hồi Yêu cầu Dữ liệu Cá nhân (DATA-BE-024, FR-BE-022, API-BE-042).
 */
public record DataSubjectRequestResponse(
        Long id,
        Long userId,
        String employeeCode,
        String fullName,
        DataSubjectRequestType requestType,
        String detail,
        DataSubjectRequestStatus status,
        Long handledById,
        String handledByName,
        String response,
        Instant respondedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static DataSubjectRequestResponse fromEntity(DataSubjectRequest entity) {
        Long handledById = entity.getHandledBy() != null ? entity.getHandledBy().getId() : null;
        String handledByName = entity.getHandledBy() != null ? entity.getHandledBy().getFullName() : null;

        return new DataSubjectRequestResponse(
                entity.getId(),
                entity.getUser() != null ? entity.getUser().getId() : null,
                entity.getUser() != null ? entity.getUser().getEmployeeCode() : null,
                entity.getUser() != null ? entity.getUser().getFullName() : null,
                entity.getRequestType(),
                entity.getDetail(),
                entity.getStatus(),
                handledById,
                handledByName,
                entity.getResponse(),
                entity.getRespondedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
