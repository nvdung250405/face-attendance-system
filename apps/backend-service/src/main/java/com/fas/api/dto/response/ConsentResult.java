package com.fas.api.dto.response;

import java.time.OffsetDateTime;

/**
 * Kết quả ký thỏa thuận Informed Consent và sinh mã OTP kích hoạt
 * ({@code POST /api/v1/employee/consent} - APD-BE-002).
 *
 * @param otp             mã OTP 6 chữ số có hiệu lực 48 giờ
 * @param qrCodeDataUrl   ảnh QR Code dạng data URL để nhân viên mang ra Kiosk
 * @param expiresAt       mốc thời gian hết hạn của mã OTP
 * @param consentSignedAt mốc thời gian ký cam kết
 * @param notice          hướng dẫn sử dụng mã OTP cho nhân viên
 */
public record ConsentResult(
        String otp,
        String qrCodeDataUrl,
        OffsetDateTime expiresAt,
        OffsetDateTime consentSignedAt,
        String notice) {
}
