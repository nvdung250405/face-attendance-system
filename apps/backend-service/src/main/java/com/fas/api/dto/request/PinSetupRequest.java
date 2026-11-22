package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Yêu cầu thiết lập mã PIN dự phòng lần đầu cho nhân viên
 * ({@code POST /api/v1/employee/pin} - APD-BE-011, API-BE-021).
 *
 * @param pin        mã PIN 6 chữ số cần thiết lập
 * @param confirmPin mã PIN xác nhận lại
 */
public record PinSetupRequest(
        @NotBlank(message = "Mã PIN không được để trống")
        @Pattern(regexp = "\\d{6}", message = "Mã PIN phải gồm đúng 6 chữ số")
        String pin,

        @NotBlank(message = "Mã PIN xác nhận không được để trống")
        @Pattern(regexp = "\\d{6}", message = "Mã PIN xác nhận phải gồm đúng 6 chữ số")
        String confirmPin) {
}
