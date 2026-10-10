package com.fas.api.dto.response;

import java.time.Instant;

/**
 * Phản hồi sau khi đăng ký trạm Kiosk thành công (API-BE-032, FR-BE-017).
 *
 * <p>Mã bí mật {@code secretToken} chỉ được hiển thị duy nhất một lần này và được lưu dạng băm một chiều.
 *
 * @param id          định danh trạm Kiosk
 * @param locationName vị trí đặt trạm
 * @param secretToken khóa bí mật hiển thị duy nhất một lần
 * @param createdAt   thời điểm đăng ký
 */
public record RegisterKioskResponse(
        String id,
        String locationName,
        String secretToken,
        Instant createdAt
) {
}
