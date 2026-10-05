package com.fas.api.dto.response;

import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.PunchType;

import java.time.OffsetDateTime;

/**
 * Kết quả ghi nhận một lượt điểm danh trực tiếp tại Kiosk
 * ({@code POST /api/v1/kiosk/punch} - APD-BE-001).
 *
 * @param recordId     mã bản ghi điểm danh vừa tạo
 * @param employeeId   mã định danh nhân viên
 * @param employeeCode mã nhân viên
 * @param fullName     họ tên nhân viên
 * @param punchType    loại điểm danh vào/ra
 * @param punchTime    mốc thời gian điểm danh theo ISO-8601 kèm múi giờ
 * @param status       trạng thái chấm công
 * @param lateMinutes  số phút đi trễ
 * @param department   phòng ban công tác
 */
public record PunchResult(
        Long recordId,
        Long employeeId,
        String employeeCode,
        String fullName,
        PunchType punchType,
        OffsetDateTime punchTime,
        AttendanceStatus status,
        int lateMinutes,
        String department) {
}
