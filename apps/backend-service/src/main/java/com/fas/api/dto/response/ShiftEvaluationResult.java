package com.fas.api.dto.response;

import com.fas.data.enums.AttendanceStatus;

import java.time.LocalTime;

/**
 * Kết quả đánh giá ca làm việc phục vụ động cơ điểm danh
 * (SOL-BE-017, FR-BE-002, BLD-BE-024, TASK-BE-029).
 *
 * @param shiftId            mã định danh ca (null nếu chưa phân ca)
 * @param shiftCode          mã ca làm việc (null nếu chưa phân ca)
 * @param status             trạng thái điểm danh (ON_TIME, LATE, hoặc ANOMALOUS khi chưa phân ca)
 * @param lateMinutes        số phút đi muộn (0 nếu đúng giờ hoặc bất thường)
 * @param shiftStartTime     giờ bắt đầu ca quy định
 * @param gracePeriodMinutes số phút ân hạn cho phép
 */
public record ShiftEvaluationResult(
        Long shiftId,
        String shiftCode,
        AttendanceStatus status,
        long lateMinutes,
        LocalTime shiftStartTime,
        Integer gracePeriodMinutes) {

    /**
     * Tạo kết quả cho trường hợp nhân viên chưa được phân ca (trạng thái ANOMALOUS).
     */
    public static ShiftEvaluationResult anomalous() {
        return new ShiftEvaluationResult(null, null, AttendanceStatus.ANOMALOUS, 0L, null, null);
    }

    /**
     * Tạo kết quả điểm danh đúng giờ theo ca.
     */
    public static ShiftEvaluationResult onTime(Long shiftId, String shiftCode, LocalTime startTime, Integer graceMinutes) {
        return new ShiftEvaluationResult(shiftId, shiftCode, AttendanceStatus.ON_TIME, 0L, startTime, graceMinutes);
    }

    /**
     * Tạo kết quả điểm danh đi muộn theo ca.
     */
    public static ShiftEvaluationResult late(Long shiftId, String shiftCode, long lateMinutes, LocalTime startTime, Integer graceMinutes) {
        return new ShiftEvaluationResult(shiftId, shiftCode, AttendanceStatus.LATE, lateMinutes, startTime, graceMinutes);
    }
}
