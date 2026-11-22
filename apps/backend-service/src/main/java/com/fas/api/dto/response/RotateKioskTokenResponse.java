package com.fas.api.dto.response;

import java.time.Instant;

/**
 * Phản hồi sau khi đổi Secret Token cho trạm Kiosk (API-BE-033, FR-BE-017).
 *
 * <p>Mã bí mật mới {@code newSecretToken} chỉ được hiển thị duy nhất một lần và mã cũ bị vô hiệu hóa ngay lập tức.
 *
 * @param id             định danh trạm Kiosk
 * @param newSecretToken khóa bí mật mới duy nhất
 * @param rotatedAt      thời điểm đổi khóa
 */
public record RotateKioskTokenResponse(
        String id,
        String newSecretToken,
        Instant rotatedAt
) {
}
