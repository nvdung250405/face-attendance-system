package com.fas.api.dto.request;

import java.time.Instant;

/**
 * Tiêu chí lọc bản ghi nhật ký kiểm toán bất biến (API-BE-030, FR-BE-016).
 *
 * @param from       thời điểm bắt đầu
 * @param to         thời điểm kết thúc
 * @param actorId    định danh tác nhân thực hiện
 * @param action     hành vi (ví dụ CREATE_EMPLOYEE, UPDATE_SHIFT, ...)
 * @param entityType loại thực thể (USER, SHIFT, KIOSK, ...)
 */
public record AuditLogFilterCriteria(
        Instant from,
        Instant to,
        Long actorId,
        String action,
        String entityType
) {
}
