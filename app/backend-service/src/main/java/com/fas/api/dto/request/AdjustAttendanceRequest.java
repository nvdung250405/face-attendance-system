package com.fas.api.dto.request;

import com.fas.data.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

/**
 * Yêu cầu chỉnh sửa bản ghi giờ công điểm danh từ HR/Quản trị (FR-BE-008, SOL-BE-007, DD-BE-002).
 *
 * @param punchTimestamp mốc thời gian quẹt công mới (nếu điều chỉnh thời gian)
 * @param status         trạng thái công mới (ON_TIME, LATE, EARLY_LEAVE, ANOMALOUS)
 * @param lateMinutes    số phút đi trễ điều chỉnh (>= 0)
 * @param reason         lý do điều chỉnh giờ công (bắt buộc để lưu vết)
 */
public record AdjustAttendanceRequest(
        OffsetDateTime punchTimestamp,
        AttendanceStatus status,
        Integer lateMinutes,
        @NotNull(message = "Lý do điều chỉnh không được để trống")
        String reason
) {
}
