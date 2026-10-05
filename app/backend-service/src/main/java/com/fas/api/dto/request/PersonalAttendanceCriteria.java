package com.fas.api.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Điều kiện tra cứu bảng công cá nhân theo tháng của nhân viên
 * ({@code GET /api/v1/employee/attendance} - APD-BE-002).
 *
 * @param month tháng cần tra cứu (1-12)
 * @param year  năm cần tra cứu
 */
public record PersonalAttendanceCriteria(
        @Min(value = 1, message = "month phải nằm trong khoảng 1 đến 12")
        @Max(value = 12, message = "month phải nằm trong khoảng 1 đến 12")
        Integer month,

        @Min(value = 2000, message = "year phải nằm trong khoảng 2000 đến 2100")
        @Max(value = 2100, message = "year phải nằm trong khoảng 2000 đến 2100")
        Integer year) {
}
