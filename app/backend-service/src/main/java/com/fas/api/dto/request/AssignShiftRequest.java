package com.fas.api.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * DTO yêu cầu phân công ca làm việc cho nhân viên
 * ({@code POST /api/v1/admin/employee-shifts} - APD-BE-014, API-BE-024).
 *
 * @param userId        mã định danh nhân viên cần phân ca
 * @param shiftId       mã định danh ca làm việc
 * @param effectiveFrom ngày bắt đầu hiệu lực
 * @param effectiveTo   ngày kết thúc hiệu lực (null = vô thời hạn)
 */
public record AssignShiftRequest(
        @NotNull(message = "userId không được để trống")
        Long userId,

        @NotNull(message = "shiftId không được để trống")
        Long shiftId,

        @NotNull(message = "effectiveFrom không được để trống")
        LocalDate effectiveFrom,

        LocalDate effectiveTo) {
}
