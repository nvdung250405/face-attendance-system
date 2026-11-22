package com.fas.api.dto.request;

import com.fas.data.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu cập nhật thông tin hồ sơ nhân sự
 * ({@code PATCH /api/v1/admin/employees/{id}} - API-BE-018, APD-BE-008, FR-BE-010).
 *
 * @param fullName   họ tên mới của nhân viên
 * @param email      email mới của nhân viên
 * @param department phòng ban công tác mới
 * @param role       vai trò hệ thống mới
 */
public record UpdateEmployeeRequest(
        @Size(max = 128, message = "Họ tên không được vượt quá 128 ký tự")
        String fullName,

        @Email(message = "Định dạng email không hợp lệ")
        @Size(max = 128, message = "Email không được vượt quá 128 ký tự")
        String email,

        @Size(max = 64, message = "Phòng ban không được vượt quá 64 ký tự")
        String department,

        Role role
) {
}
