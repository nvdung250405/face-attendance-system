package com.fas.api.dto.response;

import com.fas.data.entity.User;
import com.fas.data.enums.Role;

/**
 * Phản hồi sau khi cập nhật vai trò người dùng (API-BE-043, FR-BE-023).
 *
 * @param userId       định danh tài khoản người dùng
 * @param employeeCode mã nhân viên
 * @param fullName     họ và tên nhân viên
 * @param email        email tài khoản
 * @param role         vai trò sau khi cập nhật
 */
public record UserRoleResponse(
        Long userId,
        String employeeCode,
        String fullName,
        String email,
        Role role
) {
    public static UserRoleResponse fromEntity(User user) {
        return new UserRoleResponse(
                user.getId(),
                user.getEmployeeCode(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
