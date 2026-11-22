package com.fas.api.dto.event;

import com.fas.api.dto.response.AttendanceLogItem;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.VerificationMethod;

import java.time.OffsetDateTime;

/**
 * Sự kiện điểm danh phát sóng trên topic STOMP {@code /topic/live-attendance}
 * (API-BE-013, APD-SYS-011, SOL-BE-006).
 *
 * <p>Payload phẳng đúng hợp đồng Mục 5.1 của {@code api-design.md}: trường {@code eventType} đứng đầu,
 * tiếp theo là thông tin lượt chấm. Khác với {@link AttendanceLogItem} dùng cho REST tra cứu, sự kiện này
 * có thêm {@code eventType} để client phân biệt loại bản tin trên cùng một kênh.
 *
 * @param eventType          loại sự kiện, luôn là {@value #ATTENDANCE_PUNCHED}
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
public record AttendancePunchEvent(
        String eventType,
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

    public static final String ATTENDANCE_PUNCHED = "ATTENDANCE_PUNCHED";

    /** Dựng sự kiện phát sóng từ bản ghi điểm danh vừa lưu. */
    public static AttendancePunchEvent of(AttendanceLogItem record) {
        return new AttendancePunchEvent(
                ATTENDANCE_PUNCHED,
                record.recordId(),
                record.employeeId(),
                record.employeeCode(),
                record.fullName(),
                record.department(),
                record.punchTimestamp(),
                record.punchType(),
                record.verificationMethod(),
                record.status(),
                record.lateMinutes(),
                record.kioskId());
    }
}
