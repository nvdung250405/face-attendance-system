package com.fas.api.controller;

import com.fas.service.SessionService;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST Controller Đăng xuất & Thu hồi Phiên làm việc
 * (APD-BE-021, API-BE-038, FR-BE-020, DD-BE-023, BLD-BE-034, TASK-BE-039).
 */
@RestController
@RequestMapping("/api/v1/auth")
public class LogoutController {

    private final SessionService sessionService;

    public LogoutController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    /**
     * Đăng xuất tài khoản và thu hồi Refresh Token hiện tại
     * (POST /api/v1/auth/logout - API-BE-038).
     *
     * @param body nội dung yêu cầu chứa chuỗi refresh token
     */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestBody(required = false) Map<String, String> body) {
        if (body != null) {
            String refreshToken = body.get("refreshToken");
            if (StringUtils.hasText(refreshToken)) {
                sessionService.logout(refreshToken);
            }
        }
    }
}
