package com.fas.api.dto.response;

import java.time.LocalTime;

/**
 * DTO phản hồi thông tin ca làm việc
 * ({@code /api/v1/admin/shifts} - APD-BE-013, API-BE-023).
 *
 * @param id                 định danh duy nhất của ca
 * @param shiftCode          mã định danh ca (duy nhất)
 * @param shiftName          tên mô tả ca
 * @param startTime          thời gian bắt đầu ca
 * @param endTime            thời gian kết thúc ca
 * @param gracePeriodMinutes thời gian ân hạn đi muộn (phút)
 * @param isActive           trạng thái kích hoạt áp dụng
 */
public record ShiftResponse(
        Long id,
        String shiftCode,
        String shiftName,
        LocalTime startTime,
        LocalTime endTime,
        Integer gracePeriodMinutes,
        Boolean isActive) {
}
