package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu thẩm định mã OTP kích hoạt đăng ký khuôn mặt tại trạm Kiosk
 * ({@code POST /api/v1/kiosk/verify-otp} - APD-BE-001).
 *
 * @param otp     mã OTP 6 chữ số do nhân viên nhập tại màn hình Kiosk
 * @param kioskId mã trạm Kiosk thực hiện xác minh
 */
public record KioskVerifyOtpRequest(
        @NotBlank(message = "Mã OTP không được để trống")
        @Pattern(regexp = "\\d{6}", message = "Mã OTP phải gồm đúng 6 chữ số")
        String otp,

        @NotBlank(message = "kioskId không được để trống")
        @Size(max = 64, message = "kioskId không được vượt quá 64 ký tự")
        String kioskId) {
}
