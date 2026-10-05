package com.fas.api.dto.response;

import com.fas.data.enums.EmployeeStatus;

import java.time.OffsetDateTime;

/**
 * Kết quả hoàn tất đăng ký khuôn mặt tại trạm Kiosk
 * ({@code POST /api/v1/kiosk/enroll-face} - APD-BE-001).
 *
 * @param employeeId  mã định danh nhân viên được kích hoạt
 * @param templateId  mã mẫu sinh trắc học vừa lưu
 * @param status      trạng thái hồ sơ sau khi kích hoạt
 * @param activatedAt mốc thời gian kích hoạt khuôn mặt thành công
 */
public record EnrollmentResult(
        Long employeeId,
        Long templateId,
        EmployeeStatus status,
        OffsetDateTime activatedAt) {
}
