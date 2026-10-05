package com.fas.api.dto.response;

import com.fas.data.enums.AttendanceStatus;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Một dòng công theo ngày trong bảng công cá nhân của nhân viên
 * ({@code GET /api/v1/employee/attendance} - APD-BE-002).
 *
 * @param date         ngày làm việc
 * @param checkInTime  giờ vào
 * @param checkOutTime giờ ra
 * @param status       trạng thái chấm công trong ngày
 * @param lateMinutes  số phút đi trễ
 */
public record DailyAttendanceItem(
        LocalDate date,
        LocalTime checkInTime,
        LocalTime checkOutTime,
        AttendanceStatus status,
        int lateMinutes) {
}
