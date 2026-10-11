package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.UpdateUserRoleRequest;
import com.fas.api.dto.response.UserRoleResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.repository.UserRepository;
import com.fas.service.RoleManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * REST Controller Quản lý Vai trò & Phân quyền Người dùng
 * (APD-BE-025, API-BE-043, FR-BE-023, DD-BE-026, BLD-BE-034, TASK-BE-039).
 */
@RestController
@RequestMapping("/api/v1/admin/users")
public class RoleManagementController {

    private final RoleManagementService roleManagementService;
    private final UserRepository userRepository;

    public RoleManagementController(
            RoleManagementService roleManagementService,
            UserRepository userRepository) {
        this.roleManagementService = roleManagementService;
        this.userRepository = userRepository;
    }

    /**
     * Gán hoặc thu hồi vai trò quản trị của tài khoản người dùng
     * (PATCH /api/v1/admin/users/{id}/role - API-BE-043).
     *
     * @param id             định danh người dùng cần cập nhật vai trò
     * @param request        nội dung yêu cầu chứa vai trò mới
     * @param principal      thông tin quản trị viên thực hiện
     * @param explicitUserId mã định danh người dùng từ header (nếu có)
     * @return kết quả vai trò sau khi cập nhật
     */
    @PatchMapping("/{id}/role")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserRoleResponse> updateUserRole(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            Principal principal,
            @RequestHeader(name = "X-User-Id", required = false) Long explicitUserId) {
        Long actorUserId = resolveUserId(principal, explicitUserId);
        UserRoleResponse response = roleManagementService.updateUserRole(id, request.role(), actorUserId);
        return ApiResponse.ok("ROLE_UPDATED", "Cập nhật vai trò người dùng thành công", response);
    }

    private Long resolveUserId(Principal principal, Long explicitUserId) {
        if (explicitUserId != null) {
            return explicitUserId;
        }

        String principalName = null;
        if (principal != null && StringUtils.hasText(principal.getName())) {
            principalName = principal.getName();
        } else {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
                principalName = auth.getName();
            }
        }

        if (StringUtils.hasText(principalName)) {
            final String name = principalName;
            return userRepository.findByEmail(name)
                    .or(() -> userRepository.findByEmployeeCode(name))
                    .map(User::getId)
                    .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy thông tin tài khoản người dùng"));
        }

        throw new ApiException(ApiErrorCode.ACCESS_DENIED, "Người dùng chưa đăng nhập");
    }
}
