package com.fas.api.dto.response;

import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;

import java.time.OffsetDateTime;

/**
 * Phản hồi khởi tạo hồ sơ nhân sự kèm mật khẩu tạm dùng một lần
 * ({@code POST /api/v1/admin/employees} - API-BE-017, APD-BE-007, FR-BE-010, FR-BE-011).
 *
 * @param employeeId        mã định danh nhân viên
 * @param employeeCode      mã nhân viên
 * @param fullName          họ tên nhân viên
 * @param email             email doanh nghiệp
 * @param role              vai trò phân quyền
 * @param status            trạng thái hồ sơ ban đầu (mặc định PENDING_CONSENT)
 * @param department        phòng ban công tác
 * @param temporaryPassword mật khẩu tạm ngẫu nhiên do hệ thống sinh (hiển thị duy nhất một lần)
 * @param createdAt         mốc thời gian tạo hồ sơ
 */
public record CreateEmployeeResponse(
        Long employeeId,
        String employeeCode,
        String fullName,
        String email,
        Role role,
        EmployeeStatus status,
        String department,
        String temporaryPassword,
        OffsetDateTime createdAt
) {
}
