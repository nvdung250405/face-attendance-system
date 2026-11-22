package com.fas.api.dto.response;

import com.fas.data.enums.EmployeeStatus;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Kết quả hoàn tất đăng ký khuôn mặt tại trạm Kiosk
 * ({@code POST /api/v1/kiosk/enroll-face} - APD-BE-001, FEAT-ENROLL-001 Task 3).
 *
 * @param employeeId    mã định danh nhân viên được kích hoạt
 * @param templateId    mã mẫu sinh trắc học đại diện (FRONTAL) vừa lưu
 * @param status        trạng thái hồ sơ sau khi kích hoạt
 * @param activatedAt   mốc thời gian kích hoạt khuôn mặt thành công
 * @param employeeCode  mã nhân viên (EMP-xxxxx)
 * @param templateCount số lượng mẫu sinh trắc học đã lưu
 * @param poses         danh sách các tư thế đã lưu thành công
 */
public record EnrollmentResult(
        Long employeeId,
        Long templateId,
        EmployeeStatus status,
        OffsetDateTime activatedAt,
        String employeeCode,
        Integer templateCount,
        List<String> poses) {

    /**
     * Constructor tương thích ngược 4 tham số cho các bộ kiểm thử và máy khách hiện hữu.
     */
    public EnrollmentResult(Long employeeId, Long templateId, EmployeeStatus status, OffsetDateTime activatedAt) {
        this(employeeId, templateId, status, activatedAt, null, 1, List.of("FRONTAL"));
    }
}
