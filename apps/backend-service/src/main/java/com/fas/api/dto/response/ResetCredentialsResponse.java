package com.fas.api.dto.response;

/**
 * Phản hồi cấp lại mật khẩu tạm cho nhân sự
 * (API-BE-036, APD-BE-020, FR-BE-019, SOL-BE-022, TASK-BE-036).
 *
 * @param employeeId        mã định danh nhân viên
 * @param employeeCode      mã nhân viên
 * @param email             email nhân viên
 * @param temporaryPassword mật khẩu tạm ngẫu nhiên hiển thị duy nhất một lần
 */
public record ResetCredentialsResponse(
        Long employeeId,
        String employeeCode,
        String email,
        String temporaryPassword
) {
}
