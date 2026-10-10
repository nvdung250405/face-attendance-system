package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu từ chối đơn giải trình công (FR-BE-015, API-BE-029).
 *
 * @param rejectionReason lý do từ chối (bắt buộc, tối đa 500 ký tự)
 */
public record RejectExcuseRequest(
        @NotBlank(message = "Lý do từ chối không được để trống")
        @Size(max = 500, message = "Lý do từ chối tối đa 500 ký tự")
        String rejectionReason
) {
}
