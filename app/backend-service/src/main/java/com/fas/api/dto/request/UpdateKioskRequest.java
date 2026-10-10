package com.fas.api.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Yêu cầu cập nhật thông tin hoặc trạng thái trạm Kiosk (PATCH /api/v1/admin/kiosks/{id} - API-BE-033, FR-BE-017).
 *
 * @param locationName tên vị trí mới
 * @param isActive     trạng thái kích hoạt (false để vô hiệu hóa trạm)
 */
public record UpdateKioskRequest(
        @Size(max = 128, message = "Tên vị trí không được vượt quá 128 ký tự")
        String locationName,

        Boolean isActive
) {
}
