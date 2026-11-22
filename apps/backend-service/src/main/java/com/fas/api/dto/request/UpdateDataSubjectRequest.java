package com.fas.api.dto.request;

import com.fas.data.enums.DataSubjectRequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu cập nhật trạng thái/phản hồi yêu cầu dữ liệu cá nhân của DPO (FR-BE-022, API-BE-042).
 */
public record UpdateDataSubjectRequest(
        @NotNull(message = "Trạng thái mới không được để trống")
        DataSubjectRequestStatus status,

        @Size(max = 1000, message = "Nội dung phản hồi tối đa 1000 ký tự")
        String response
) {
}
