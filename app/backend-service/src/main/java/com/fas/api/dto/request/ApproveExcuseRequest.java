package com.fas.api.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Yêu cầu phê duyệt đơn giải trình công (FR-BE-015, API-BE-029).
 *
 * @param reviewNote ghi chú phê duyệt (tùy chọn, tối đa 500 ký tự)
 */
public record ApproveExcuseRequest(
        @Size(max = 500, message = "Ghi chú phê duyệt tối đa 500 ký tự")
        String reviewNote
) {
}
