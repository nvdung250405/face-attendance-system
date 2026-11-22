package com.fas.api.dto.request;

import com.fas.data.enums.DataSubjectRequestType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu gửi quyền về Dữ liệu Cá nhân (FR-BE-022, API-BE-042).
 */
public record CreateDataSubjectRequest(
        @NotNull(message = "Loại yêu cầu không được để trống (ACCESS hoặc CORRECTION)")
        DataSubjectRequestType requestType,

        @Size(max = 1000, message = "Chi tiết yêu cầu tối đa 1000 ký tự")
        String detail
) {
}
