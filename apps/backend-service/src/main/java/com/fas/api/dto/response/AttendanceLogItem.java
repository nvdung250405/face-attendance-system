package com.fas.api.dto.response;

import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.VerificationMethod;

import java.time.OffsetDateTime;

/**
 * Một bản ghi điểm danh trong kết quả tra cứu của HR/Quản trị
 * ({@code GET /api/v1/admin/attendance} - APD-BE-002).
 *
 * @param recordId           mã bản ghi điểm danh
 * @param employeeId         mã định danh nhân viên
 * @param employeeCode       mã nhân viên
 * @param fullName           họ tên nhân viên
 * @param department         phòng ban công tác
 * @param punchTimestamp     mốc thời gian điểm danh theo ISO-8601 kèm múi giờ
 * @param punchType          loại điểm danh vào/ra
 * @param verificationMethod phương thức xác thực đã dùng
 * @param status             trạng thái chấm công
 * @param lateMinutes        số phút đi trễ
 * @param kioskId            mã trạm Kiosk ghi nhận
 */
public record AttendanceLogItem(
        Long recordId,
        Long employeeId,
        String employeeCode,
        String fullName,
        String department,
        OffsetDateTime punchTimestamp,
        PunchType punchType,
        VerificationMethod verificationMethod,
        AttendanceStatus status,
        int lateMinutes,
        String kioskId) {
}
