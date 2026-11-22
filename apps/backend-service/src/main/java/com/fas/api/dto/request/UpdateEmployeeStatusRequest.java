package com.fas.api.dto.request;

import com.fas.data.enums.EmployeeStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu cập nhật trạng thái hồ sơ nhân sự (vô hiệu hóa hoặc khôi phục)
 * ({@code PATCH /api/v1/admin/employees/{id}/status} - API-BE-019, APD-BE-009, FR-BE-010).
 *
 * @param status trạng thái công tác mới (ví dụ TERMINATED, ACTIVE, SUSPENDED)
 * @param reason lý do thay đổi trạng thái (phục vụ nhật ký kiểm toán)
 */
public record UpdateEmployeeStatusRequest(
        @NotNull(message = "Trạng thái công tác không được để trống")
        EmployeeStatus status,

        @Size(max = 255, message = "Lý do không được vượt quá 255 ký tự")
        String reason
) {
}
