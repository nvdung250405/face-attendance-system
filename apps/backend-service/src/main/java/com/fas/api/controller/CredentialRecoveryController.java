package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.PinResetRequest;
import com.fas.api.dto.response.PinOperationResult;
import com.fas.api.dto.response.ResetCredentialsResponse;
import com.fas.common.error.ApiErrorCode;
import com.fas.common.error.ApiException;
import com.fas.security.CurrentUserService;
import com.fas.service.CredentialRecoveryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
    private final CurrentUserService currentUserService;

    public CredentialRecoveryController(
            CredentialRecoveryService credentialRecoveryService,
            CurrentUserService currentUserService) {
        this.credentialRecoveryService = credentialRecoveryService;
        this.currentUserService = currentUserService;
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
            Principal principal) {
        Long userId = currentUserService.getCurrentUserId(principal);
        PinOperationResult result = credentialRecoveryService.resetPin(userId, request);
        return ApiResponse.ok("PIN_RESET", result.message(), result);
    }

}
