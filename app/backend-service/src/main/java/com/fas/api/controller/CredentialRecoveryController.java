package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.PinResetRequest;
import com.fas.api.dto.response.PinOperationResult;
import com.fas.api.dto.response.ResetCredentialsResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.repository.UserRepository;
import com.fas.service.CredentialRecoveryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * REST Controller Khôi phục Thông tin Xác thực & Đặt lại PIN Dự phòng
 * (APD-BE-020, API-BE-036, API-BE-037, FR-BE-019, DD-BE-022, BLD-BE-034, TASK-BE-039).
 */
@RestController
@RequestMapping("/api/v1")
public class CredentialRecoveryController {

    private final CredentialRecoveryService credentialRecoveryService;
    private final UserRepository userRepository;

    public CredentialRecoveryController(
            CredentialRecoveryService credentialRecoveryService,
            UserRepository userRepository) {
        this.credentialRecoveryService = credentialRecoveryService;
        this.userRepository = userRepository;
    }

    /**
     * Cấp lại mật khẩu tạm mới cho nhân sự quên mật khẩu
     * (POST /api/v1/admin/employees/{id}/credentials/reset - API-BE-036).
     *
     * @param id định danh nhân viên cần cấp lại mật khẩu
     * @return thông tin tài khoản kèm mật khẩu tạm chỉ hiển thị duy nhất một lần
     */
    @PostMapping("/admin/employees/{id}/credentials/reset")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    public ApiResponse<ResetCredentialsResponse> resetCredentials(@PathVariable("id") Long id) {
        ResetCredentialsResponse response = credentialRecoveryService.resetPassword(id);
        return ApiResponse.ok("CREDENTIALS_RESET", "Cấp lại mật khẩu tạm thành công", response);
    }

    /**
     * Nhân viên tự đặt lại mã PIN dự phòng bằng mật khẩu tài khoản
     * (POST /api/v1/employee/pin/reset - API-BE-037).
     *
     * @param request       dữ liệu gồm mật khẩu hiện tại, mã PIN mới và xác nhận PIN
     * @param principal     thông tin người dùng đang đăng nhập
     * @param explicitUserId mã định danh người dùng truyền rõ ràng từ header (nếu có)
     * @return kết quả thao tác chứa cờ hasPin = true
     */
    @PostMapping("/employee/pin/reset")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PinOperationResult> resetPin(
            @Valid @RequestBody PinResetRequest request,
            Principal principal,
            @RequestHeader(name = "X-User-Id", required = false) Long explicitUserId) {
        Long userId = resolveUserId(principal, explicitUserId);
        PinOperationResult result = credentialRecoveryService.resetPin(userId, request);
        return ApiResponse.ok("PIN_RESET", result.message(), result);
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
