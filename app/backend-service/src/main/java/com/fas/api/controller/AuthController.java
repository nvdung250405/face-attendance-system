package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.LoginRequest;
import com.fas.api.dto.request.RefreshTokenRequest;
import com.fas.api.dto.response.LoginResponse;
import com.fas.api.dto.response.TokenResponse;
import com.fas.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller Xác thực & Quản lý Phiên làm việc Cổng Web Portal
 * (APD-BE-002, API-BE-001, API-BE-002, FR-BE-001, BLD-BE-007, TASK-BE-020).
 *
 * <p>Mọi endpoint trong controller này đều mở công khai (PermitAll) không yêu cầu JWT Token.</p>
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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
}
