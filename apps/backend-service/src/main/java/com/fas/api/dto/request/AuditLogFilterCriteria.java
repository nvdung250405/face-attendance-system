package com.fas.api.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Tiêu chí lọc bản ghi nhật ký kiểm toán bất biến (API-BE-030, FR-BE-016, SEC-007).
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
        @Size(max = 64, message = "Mã hành vi không được vượt quá 64 ký tự")
        @Pattern(regexp = "^[A-Za-z0-9_]*$", message = "Mã hành vi chỉ được chứa chữ cái, số và dấu gạch dưới")
        String action,
        @Size(max = 64, message = "Loại thực thể không được vượt quá 64 ký tự")
        @Pattern(regexp = "^[A-Za-z0-9_]*$", message = "Loại thực thể chỉ được chứa chữ cái, số và dấu gạch dưới")
        String entityType
) {
}
