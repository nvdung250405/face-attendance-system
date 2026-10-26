package com.fas.api.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO yêu cầu phân công ca làm việc hàng loạt cho danh sách nhân viên
 * ({@code POST /api/v1/admin/employee-shifts/batch} - API-BE-037, TASK-BE-042).
 *
 * @param userIds        danh sách mã định danh nhân viên cần phân ca
 * @param shiftId       mã định danh ca làm việc
 * @param effectiveFrom ngày bắt đầu hiệu lực
 * @param effectiveTo   ngày kết thúc hiệu lực (null = vô thời hạn)
 */
public record BatchAssignShiftRequest(
        @NotEmpty(message = "Danh sách nhân sự (userIds) không được để trống")
        List<Long> userIds,

        @NotNull(message = "shiftId không được để trống")
        Long shiftId,

        @NotNull(message = "effectiveFrom không được để trống")
        LocalDate effectiveFrom,

        LocalDate effectiveTo) {
}
