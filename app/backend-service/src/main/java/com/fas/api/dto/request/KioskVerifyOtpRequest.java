package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Yêu cầu thẩm định mã OTP kích hoạt đăng ký khuôn mặt tại trạm Kiosk
 * ({@code POST /api/v1/kiosk/verify-otp} - APD-BE-001).
 *
 * @param otp mã OTP 6 chữ số do nhân viên nhập tại màn hình Kiosk
 */
public record KioskVerifyOtpRequest(
                @NotBlank(message = "Mã OTP không được để trống") @Pattern(regexp = "\\d{6}", message = "Mã OTP phải gồm đúng 6 chữ số") String otp) {
}
