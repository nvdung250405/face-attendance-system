package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.ChangePasswordRequest;
import com.fas.api.dto.request.LoginRequest;
import com.fas.api.dto.request.RefreshTokenRequest;
import com.fas.api.dto.response.LoginResponse;
import com.fas.api.dto.response.TokenResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.repository.UserRepository;
import com.fas.service.AccountManagementService;
import com.fas.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * REST Controller Xác thực & Quản lý Phiên làm việc Cổng Web Portal
 * (APD-BE-002, APD-BE-010, API-BE-001, API-BE-002, API-BE-020, FR-BE-001, FR-BE-011, BLD-BE-007, BLD-BE-022, TASK-BE-020, TASK-BE-027).
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final AccountManagementService accountManagementService;
    private final UserRepository userRepository;

    public AuthController(
            AuthService authService,
            AccountManagementService accountManagementService,
            UserRepository userRepository
    ) {
        this.authService = authService;
        this.accountManagementService = accountManagementService;
        this.userRepository = userRepository;
    }

    /**
     * Xác thực tài khoản người dùng và cấp phát cặp token (POST /api/v1/auth/login - API-BE-001).
     *
     * @param request thông tin email và mật khẩu
     * @return kết quả đăng nhập kèm Access Token và Refresh Token với mã HTTP 200 OK
     */
    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.ok("AUTH_SUCCESS", "Đăng nhập thành công", response);
    }

    /**
     * Làm mới Access Token từ Refresh Token hợp lệ (POST /api/v1/auth/refresh - API-BE-002).
     *
     * @param request chuỗi Refresh Token hiện tại
     * @return cặp Access Token mới và Refresh Token được luân chuyển với mã HTTP 200 OK
     */
    @PostMapping("/refresh")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<TokenResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        TokenResponse response = authService.refreshToken(request);
        return ApiResponse.ok("TOKEN_REFRESHED", "Cấp phát token mới thành công", response);
    }

    /**
     * Đổi mật khẩu tự nguyện của chính người dùng đang đăng nhập
     * (POST /api/v1/auth/change-password - API-BE-020, APD-BE-010, FR-BE-011).
     *
     * @param request   dữ liệu gồm mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới
     * @param principal thông tin người dùng đang đăng nhập
     * @return phản hồi HTTP 200 OK thông báo đổi mật khẩu thành công
     */
    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Principal principal
    ) {
        Long userId = resolveCurrentUserId(principal);
        accountManagementService.changePassword(userId, request);
        return ApiResponse.ok("PASSWORD_CHANGED", "Đổi mật khẩu thành công", null);
    }

    private Long resolveCurrentUserId(Principal principal) {
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
