package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu đổi mật khẩu tự nguyện của chính người dùng
 * ({@code POST /api/v1/auth/change-password} - API-BE-020, APD-BE-010, FR-BE-011).
 *
 * @param currentPassword mật khẩu hiện tại của tài khoản
 * @param newPassword     mật khẩu mới (tối thiểu 8 ký tự, phải khác mật khẩu hiện tại)
 * @param confirmPassword xác nhận lại mật khẩu mới (phải khớp với newPassword)
 */
public record ChangePasswordRequest(
        @NotBlank(message = "Mật khẩu hiện tại không được để trống")
        String currentPassword,

        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 8, message = "Mật khẩu mới phải có tối thiểu 8 ký tự")
        String newPassword,

        @NotBlank(message = "Xác nhận mật khẩu không được để trống")
        String confirmPassword
) {
}
