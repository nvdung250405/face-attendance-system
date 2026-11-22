package com.fas.api.dto.response;

import java.time.Instant;

/**
 * Bản ghi nhật ký kiểm toán trả về cho Quản trị viên (API-BE-030, FR-BE-016).
 *
 * @param id          định danh bản ghi audit log
 * @param actorId     định danh tác nhân (hoặc null nếu hệ thống)
 * @param actorEmail  email của tác nhân
 * @param action      hành vi thực hiện
 * @param entityType  loại thực thể bị tác động
 * @param entityId    định danh thực thể bị tác động
 * @param beforeState snapshot trạng thái trước khi thay đổi (JSON string)
 * @param afterState  snapshot trạng thái sau khi thay đổi (JSON string)
 * @param ipAddress   địa chỉ IP của tác nhân
 * @param createdAt   thời điểm ghi nhật ký
 */
public record AuditLogItemResponse(
        Long id,
        Long actorId,
        String actorEmail,
        String action,
        String entityType,
        String entityId,
        String beforeState,
        String afterState,
        String ipAddress,
        Instant createdAt
) {
}
