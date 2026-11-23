package com.fas.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.time.OffsetDateTime;
import java.time.ZoneId;

/**
 * Điểm xử lý lỗi xác thực không thành công (401 Unauthorized) theo chuẩn RFC 9457 ProblemDetails (SEC-002).
 */
@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private static final String PROBLEM_TYPE = "https://fas.company.com/errors/unauthorized";
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ObjectMapper objectMapper;

    public CustomAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/problem+json");
        response.setCharacterEncoding("UTF-8");

        String detail = (authException != null && authException.getMessage() != null)
                ? authException.getMessage()
                : "Yêu cầu xác thực không hợp lệ hoặc thiếu thông tin định danh.";

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, detail);
        problemDetail.setType(URI.create(PROBLEM_TYPE));
        problemDetail.setTitle("Chưa xác thực");
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        problemDetail.setProperty("code", "UNAUTHORIZED");
        problemDetail.setProperty("message", detail);
        problemDetail.setProperty("timestamp", OffsetDateTime.now(VIETNAM_ZONE));

        objectMapper.writeValue(response.getWriter(), problemDetail);
    }
}
