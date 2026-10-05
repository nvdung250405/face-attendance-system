package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Yêu cầu làm mới Access Token ({@code POST /api/v1/auth/refresh} - APD-BE-002).
 *
 * @param refreshToken chuỗi UUID Refresh Token đã được cấp phát trước đó
 */
public record RefreshTokenRequest(
        @NotBlank(message = "Refresh Token không được để trống")
        String refreshToken) {
}
