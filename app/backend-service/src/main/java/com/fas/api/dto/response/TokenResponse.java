package com.fas.api.dto.response;

/**
 * Kết quả làm mới Access Token ({@code POST /api/v1/auth/refresh} - APD-BE-002).
 *
 * @param accessToken  JWT Access Token mới
 * @param refreshToken Refresh Token được luân chuyển
 * @param tokenType    loại token (Bearer)
 * @param expiresIn    thời hạn Access Token tính bằng giây
 */
public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn) {
}
