package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Yêu cầu đổi mã PIN dự phòng cho nhân viên đã có mã PIN
 * ({@code POST /api/v1/employee/pin} - APD-BE-011, API-BE-021).
 *
 * @param currentPin mã PIN hiện tại
 * @param newPin     mã PIN mới gồm 6 chữ số
 * @param confirmPin mã PIN xác nhận lại
 */
public record PinChangeRequest(
        @NotBlank(message = "Mã PIN hiện tại không được để trống")
        String currentPin,

        @NotBlank(message = "Mã PIN mới không được để trống")
        @Pattern(regexp = "\\d{6}", message = "Mã PIN mới phải gồm đúng 6 chữ số")
        String newPin,

        @NotBlank(message = "Mã PIN xác nhận không được để trống")
        @Pattern(regexp = "\\d{6}", message = "Mã PIN xác nhận phải gồm đúng 6 chữ số")
        String confirmPin) {
}
