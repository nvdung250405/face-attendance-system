package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.ChangePasswordRequest;
import com.fas.api.dto.request.LoginRequest;
import com.fas.api.dto.request.LogoutRequest;
import com.fas.api.dto.request.RefreshTokenRequest;
import com.fas.api.dto.response.AuthenticatedUser;
import com.fas.api.dto.response.LoginResponse;
import com.fas.api.dto.response.TokenResponse;
import com.fas.security.CurrentUserService;
import com.fas.service.AccountManagementService;
import com.fas.service.AuthService;
import com.fas.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * REST Controller Xác thực & Quản lý Phiên làm việc Cổng Web Portal
 * (APD-BE-002, APD-BE-010, API-BE-001, API-BE-002, API-BE-020, API-BE-038,
 *  FR-BE-001, FR-BE-011, BLD-BE-007, BLD-BE-022, TASK-BE-020, TASK-BE-027).
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final AccountManagementService accountManagementService;
    private final CurrentUserService currentUserService;
    private final SessionService sessionService;

    public AuthController(
            AuthService authService,
            AccountManagementService accountManagementService,
            CurrentUserService currentUserService,
            SessionService sessionService
    ) {
        this.authService = authService;
        this.accountManagementService = accountManagementService;
        this.currentUserService = currentUserService;
        this.sessionService = sessionService;
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
     * Lấy thông tin tài khoản và trạng thái hồ sơ người dùng đang đăng nhập (GET /api/v1/auth/me).
     *
     * @param principal thông tin xác thực của người dùng
     * @return hồ sơ người dùng kèm cờ hasBiometric và hasPin mới nhất
     */
    @GetMapping("/me")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<AuthenticatedUser> getCurrentUser(Principal principal) {
        Long userId = currentUserService.getCurrentUserId(principal);
        AuthenticatedUser user = authService.getUserProfile(userId);
        return ApiResponse.ok("PROFILE_FETCHED", "Lấy thông tin tài khoản thành công", user);
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
        Long userId = currentUserService.getCurrentUserId(principal);
        accountManagementService.changePassword(userId, request);
        return ApiResponse.ok("PASSWORD_CHANGED", "Đổi mật khẩu thành công", null);
    }

    /**
     * Đăng xuất tài khoản và thu hồi Refresh Token hiện tại
     * (POST /api/v1/auth/logout - API-BE-038, SEC-005).
     *
     * @param request dữ liệu yêu cầu chứa chuỗi refresh token
     */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("isAuthenticated()")
    public void logout(@Valid @RequestBody(required = false) LogoutRequest request) {
        if (request != null && StringUtils.hasText(request.refreshToken())) {
            sessionService.logout(request.refreshToken());
        }
    }
}
