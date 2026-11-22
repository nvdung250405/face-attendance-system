package com.fas.api.dto.response;

/**
 * Thống kê KPI điểm danh toàn công ty theo thời gian thực (API-BE-009, DATA-WEB-004).
 *
 * @param totalEmployees tổng số nhân viên đang kích hoạt hoạt động trong công ty
 * @param presentCount   số lượng nhân sự đã có mặt ít nhất 1 lần trong ngày
 * @param onTimeCount    số lượt điểm danh đúng giờ trong ngày
 * @param lateCount      số lượt điểm danh đi muộn trong ngày
 * @param absentCount    số nhân viên chưa có mặt (vắng mặt) tính đến hiện tại
 */
public record AttendanceStatsResponse(
        long totalEmployees,
        long presentCount,
        long onTimeCount,
        long lateCount,
        long absentCount
) {
}
