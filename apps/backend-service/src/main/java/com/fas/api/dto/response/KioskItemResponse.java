package com.fas.api.dto.response;

import java.time.Instant;

/**
 * Thông tin tổng hợp của trạm Kiosk trong danh sách quản trị (API-BE-032, FR-BE-017).
 *
 * @param id           mã định danh trạm
 * @param locationName tên địa điểm / khu vực đặt trạm
 * @param isActive     trạng thái kích hoạt
 * @param lastPingAt   thời điểm ping gần nhất
 * @param createdAt    thời điểm tạo trạm
 * @param isOnline     trạng thái trực tuyến (ping trong vòng 5 phút)
 */
public record KioskItemResponse(
        String id,
        String locationName,
        Boolean isActive,
        Instant lastPingAt,
        Instant createdAt,
        boolean isOnline
) {
}
