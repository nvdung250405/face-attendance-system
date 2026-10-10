package com.fas.api.dto.request;

import com.fas.data.enums.ExcuseRequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu quyết định phê duyệt hoặc từ chối đơn giải trình công (FR-BE-015, API-BE-029).
 *
 * @param status          trạng thái quyết định: {@link ExcuseRequestStatus#APPROVED} hoặc {@link ExcuseRequestStatus#REJECTED}
 * @param reviewNote      ghi chú phê duyệt (tùy chọn, tối đa 500 ký tự)
 * @param rejectionReason lý do từ chối (bắt buộc khi REJECTED, tối đa 500 ký tự)
 */
public record DecideExcuseRequest(
        @NotNull(message = "Trạng thái quyết định không được để trống (APPROVED hoặc REJECTED)")
        ExcuseRequestStatus status,

        @Size(max = 500, message = "Ghi chú phê duyệt tối đa 500 ký tự")
        String reviewNote,

        @Size(max = 500, message = "Lý do từ chối tối đa 500 ký tự")
        String rejectionReason
) {
}
