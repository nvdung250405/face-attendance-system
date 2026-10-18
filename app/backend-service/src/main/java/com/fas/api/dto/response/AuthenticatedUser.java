package com.fas.api.dto.response;

import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;

/**
 * Thông tin tài khoản người dùng trả về sau khi xác thực thành công (APD-BE-002).
 *
 * @param id           mã định danh người dùng
 * @param employeeCode mã nhân viên
 * @param fullName     họ tên đầy đủ
 * @param email        email doanh nghiệp
 * @param role         vai trò hệ thống
 * @param status       trạng thái hồ sơ nhân sự
 * @param department   phòng ban công tác
 * @param hasBiometric cờ xác nhận đã đăng ký mẫu khuôn mặt kích hoạt
 * @param hasPin       cờ xác nhận đã thiết lập mã PIN dự phòng
 */
public record AuthenticatedUser(
        Long id,
        String employeeCode,
        String fullName,
        String email,
        Role role,
        EmployeeStatus status,
        String department,
        boolean hasBiometric,
        boolean hasPin) {

    public AuthenticatedUser(
            Long id,
            String employeeCode,
            String fullName,
            String email,
            Role role,
            EmployeeStatus status,
            String department) {
        this(id, employeeCode, fullName, email, role, status, department, false, false);
    }
}
