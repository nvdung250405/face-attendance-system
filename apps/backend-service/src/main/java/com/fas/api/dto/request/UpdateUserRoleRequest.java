package com.fas.api.dto.request;

import com.fas.data.enums.Role;
import jakarta.validation.constraints.NotNull;

/**
 * Yêu cầu gán hoặc thu hồi vai trò người dùng (API-BE-043, FR-BE-023).
 *
 * @param role vai trò mới cần cập nhật cho người dùng
 */
public record UpdateUserRoleRequest(
        @NotNull(message = "role không được để trống")
        Role role
) {
}
