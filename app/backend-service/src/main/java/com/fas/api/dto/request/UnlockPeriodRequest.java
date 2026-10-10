package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu mở lại kỳ công đã chốt (FR-BE-021, API-BE-039).
 */
public record UnlockPeriodRequest(
        @NotBlank(message = "Lý do mở lại kỳ công không được để trống")
        @Size(max = 500, message = "Lý do mở lại tối đa 500 ký tự")
        String reason
) {
}
