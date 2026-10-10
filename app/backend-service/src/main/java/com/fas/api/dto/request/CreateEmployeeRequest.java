package com.fas.api.dto.request;

import com.fas.data.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu khởi tạo hồ sơ nhân sự kèm tài khoản đăng nhập ban đầu
 * ({@code POST /api/v1/admin/employees} - API-BE-017, APD-BE-007, FR-BE-010).
 *
 * @param employeeCode mã định danh nhân viên duy nhất (ví dụ "NV-1042")
 * @param fullName     họ và tên đầy đủ của nhân sự
 * @param email        địa chỉ email doanh nghiệp duy nhất
 * @param department   phòng ban hoặc bộ phận công tác
 * @param role         vai trò phân quyền trong hệ thống (mặc định EMPLOYEE nếu null)
 */
public record CreateEmployeeRequest(
        @NotBlank(message = "Mã nhân viên không được để trống")
        @Size(max = 32, message = "Mã nhân viên không được vượt quá 32 ký tự")
        String employeeCode,

        @NotBlank(message = "Họ tên nhân viên không được để trống")
        @Size(max = 128, message = "Họ tên không được vượt quá 128 ký tự")
        String fullName,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Định dạng email không hợp lệ")
        @Size(max = 128, message = "Email không được vượt quá 128 ký tự")
        String email,

        @Size(max = 64, message = "Phòng ban không được vượt quá 64 ký tự")
        String department,

        Role role
) {
}
