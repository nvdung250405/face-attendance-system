package com.fas.api.dto.response;

import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;

import java.time.OffsetDateTime;

/**
 * Một nhân sự trong danh sách quản lý nhân sự của HR/Quản trị
 * ({@code GET /api/v1/admin/employees} - APD-BE-002).
 *
 * @param id           mã định danh nhân viên
 * @param employeeCode mã nhân viên
 * @param fullName     họ tên nhân viên
 * @param email        email doanh nghiệp
 * @param department   phòng ban công tác
 * @param role         vai trò hệ thống
 * @param status       trạng thái hồ sơ sinh trắc
 * @param hasBiometric đã có mẫu sinh trắc học kích hoạt
 * @param hasPin       đã thiết lập mã PIN dự phòng
 * @param createdAt    mốc thời gian tạo hồ sơ
 */
public record EmployeeItem(
        Long id,
        String employeeCode,
        String fullName,
        String email,
        String department,
        Role role,
        EmployeeStatus status,
        boolean hasBiometric,
        boolean hasPin,
        OffsetDateTime createdAt) {
}
