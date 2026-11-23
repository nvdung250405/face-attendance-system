package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO yêu cầu đăng xuất và thu hồi Refresh Token (SEC-005, API-BE-038).
 */
public record LogoutRequest(
        @NotBlank(message = "Refresh token không được để trống")
        String refreshToken
) {
}
