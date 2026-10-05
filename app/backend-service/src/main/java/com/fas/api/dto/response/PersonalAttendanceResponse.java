package com.fas.api.dto.response;

import java.util.List;

/**
 * Bảng công cá nhân theo tháng của nhân viên
 * ({@code GET /api/v1/employee/attendance} - APD-BE-002).
 *
 * @param month           tháng tra cứu
 * @param year            năm tra cứu
 * @param totalWorkDays   tổng số ngày công
 * @param totalOnTimeDays tổng số ngày đi đúng giờ
 * @param totalLateDays   tổng số ngày đi trễ
 * @param records         chi tiết công theo từng ngày
 */
public record PersonalAttendanceResponse(
        int month,
        int year,
        int totalWorkDays,
        int totalOnTimeDays,
        int totalLateDays,
        List<DailyAttendanceItem> records) {
}
