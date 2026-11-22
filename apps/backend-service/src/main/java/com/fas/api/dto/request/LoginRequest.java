package com.fas.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu đăng nhập hệ thống của Web Portal ({@code POST /api/v1/auth/login} - APD-BE-002).
 *
 * @param email    email doanh nghiệp của tài khoản
 * @param password mật khẩu văn bản rõ
 */
public record LoginRequest(
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        @Size(max = 128, message = "Email không được vượt quá 128 ký tự")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 8, message = "Mật khẩu phải có tối thiểu 8 ký tự")
        String password) {
}
