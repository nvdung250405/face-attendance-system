package com.fas.api.dto.response;

import com.fas.data.entity.Notification;
import com.fas.data.enums.NotificationEventType;

import java.time.Instant;

/**
 * Phản hồi Thông báo Trong ứng dụng (DATA-BE-023, FR-BE-024).
 */
public record NotificationResponse(
        Long id,
        Long userId,
        NotificationEventType eventType,
        String title,
        String body,
        String referenceType,
        String referenceId,
        Instant readAt,
        Instant createdAt
) {
    public static NotificationResponse fromEntity(Notification entity) {
        return new NotificationResponse(
                entity.getId(),
                entity.getUser() != null ? entity.getUser().getId() : null,
                entity.getEventType(),
                entity.getTitle(),
                entity.getBody(),
                entity.getReferenceType(),
                entity.getReferenceId(),
                entity.getReadAt(),
                entity.getCreatedAt()
        );
    }
}
