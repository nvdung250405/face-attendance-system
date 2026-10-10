package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu đăng ký trạm Kiosk mới (POST /api/v1/admin/kiosks - API-BE-032, FR-BE-017).
 *
 * @param id           mã định danh trạm duy nhất (ví dụ "KIOSK-HN-01")
 * @param locationName tên địa điểm / khu vực đặt trạm
 */
public record RegisterKioskRequest(
        @NotBlank(message = "Mã trạm Kiosk không được để trống")
        @Size(max = 64, message = "Mã trạm không được vượt quá 64 ký tự")
        String id,

        @NotBlank(message = "Tên vị trí không được để trống")
        @Size(max = 128, message = "Tên vị trí không được vượt quá 128 ký tự")
        String locationName
) {
}
