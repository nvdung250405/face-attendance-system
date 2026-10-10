package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Yêu cầu nộp đơn giải trình công cho một lượt điểm danh (FR-BE-014, API-BE-026).
 *
 * @param attendanceLogId           định danh bản ghi điểm danh cần giải trình (bắt buộc)
 * @param reason                    lý do giải trình (bắt buộc, tối đa 500 ký tự)
 * @param requestedPunchTimestamp   mốc thời gian đề xuất điều chỉnh (tùy chọn)
 */
public record SubmitExcuseRequest(
        @NotNull(message = "attendanceLogId không được để trống")
        Long attendanceLogId,

        @NotBlank(message = "Lý do giải trình không được để trống")
        @Size(max = 500, message = "Lý do giải trình tối đa 500 ký tự")
        String reason,

        Instant requestedPunchTimestamp
) {
}
