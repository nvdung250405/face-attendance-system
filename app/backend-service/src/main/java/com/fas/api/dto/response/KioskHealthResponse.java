package com.fas.api.dto.response;

import java.time.Instant;

/**
 * Trạng thái kết nối và sức khỏe trạm Kiosk (GET /api/v1/admin/kiosks/{id}/health - API-BE-034, FR-BE-017).
 *
 * @param id             mã định danh trạm Kiosk
 * @param locationName   vị trí đặt trạm
 * @param isActive       trạng thái cấu hình hoạt động
 * @param lastPingAt     thời điểm ping gần nhất
 * @param isHealthy      trạng thái kết nối ổn định (đang hoạt động và ping trong vòng 5 phút)
 * @param warningMessage cảnh báo khi trạm mất kết nối hoặc bị vô hiệu hóa (null nếu bình thường)
 */
public record KioskHealthResponse(
        String id,
        String locationName,
        Boolean isActive,
        Instant lastPingAt,
        boolean isHealthy,
        String warningMessage
) {
}
