package com.fas.api.dto.response;

/**
 * Kết quả đăng nhập hệ thống kèm cặp Access Token và Refresh Token
 * ({@code POST /api/v1/auth/login} - APD-BE-002).
 *
 * @param accessToken  JWT Access Token có hiệu lực 1 giờ
 * @param refreshToken Refresh Token dạng UUID có hiệu lực 7 ngày
 * @param tokenType    loại token (Bearer)
 * @param expiresIn    thời hạn Access Token tính bằng giây
 * @param user         thông tin tài khoản vừa xác thực
 */
public record LoginResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        AuthenticatedUser user) {
}
