package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Yêu cầu thiết lập hoặc đổi mã PIN dự phòng cho nhân viên
 * ({@code POST /api/v1/employee/pin} - APD-BE-011, API-BE-021).
 *
 * @param currentPin mã PIN hiện tại (bắt buộc khi đổi mã PIN)
 * @param pin        mã PIN 6 chữ số cần thiết lập (khi thiết lập lần đầu)
 * @param newPin     mã PIN mới gồm 6 chữ số (khi đổi mã PIN)
 * @param confirmPin mã PIN xác nhận lại
 */
public record PinManagementRequest(
        @Pattern(regexp = "\\d{6}", message = "Mã PIN hiện tại phải gồm đúng 6 chữ số")
        String currentPin,

        @Pattern(regexp = "\\d{6}", message = "Mã PIN phải gồm đúng 6 chữ số")
        String pin,

        @Pattern(regexp = "\\d{6}", message = "Mã PIN mới phải gồm đúng 6 chữ số")
        String newPin,

        @NotBlank(message = "Mã PIN xác nhận không được để trống")
        @Pattern(regexp = "\\d{6}", message = "Mã PIN xác nhận phải gồm đúng 6 chữ số")
        String confirmPin) {

    public String resolveTargetPin() {
        return (pin != null && !pin.isBlank()) ? pin : newPin;
    }
}
