package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Yêu cầu đặt lại mã PIN dự phòng bằng mật khẩu tài khoản
 * ({@code POST /api/v1/employee/pin/reset} - API-BE-037, SOL-BE-022).
 *
 * @param currentPassword mật khẩu đăng nhập hiện tại để xác thực chủ tài khoản
 * @param newPin          mã PIN mới gồm 6 chữ số
 */
public record PinResetRequest(
                @NotBlank(message = "Mật khẩu hiện tại không được để trống") String currentPassword,

                @NotBlank(message = "Mã PIN mới không được để trống") @Pattern(regexp = "\\d{6}", message = "Mã PIN mới phải gồm đúng 6 chữ số") String newPin) {
}
