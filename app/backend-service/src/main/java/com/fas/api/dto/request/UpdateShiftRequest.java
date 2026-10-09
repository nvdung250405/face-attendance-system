package com.fas.api.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

/**
 * DTO yêu cầu cập nhật thông tin ca làm việc
 * ({@code PATCH /api/v1/admin/shifts/{id}} - APD-BE-013, API-BE-023).
 *
 * @param shiftName          tên mô tả ca
 * @param startTime          thời gian bắt đầu ca
 * @param endTime            thời gian kết thúc ca
 * @param gracePeriodMinutes thời gian ân hạn đi muộn (phút, 0-60)
 * @param isActive           cờ kích hoạt ca làm việc
 */
public record UpdateShiftRequest(
        @NotBlank(message = "Tên ca không được để trống")
        @Size(max = 64, message = "Tên ca không được vượt quá 64 ký tự")
        String shiftName,

        @NotNull(message = "Giờ bắt đầu không được để trống")
        LocalTime startTime,

        @NotNull(message = "Giờ kết thúc không được để trống")
        LocalTime endTime,

        @NotNull(message = "Thời gian ân hạn không được để trống")
        @Min(value = 0, message = "Thời gian ân hạn tối thiểu là 0 phút")
        @Max(value = 60, message = "Thời gian ân hạn tối đa là 60 phút")
        Integer gracePeriodMinutes,

        Boolean isActive) {
}
