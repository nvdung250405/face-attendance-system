package com.fas.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Collections;

/**
 * Bộ lọc xác thực token trạm Kiosk qua header X-Kiosk-Token trước khi đọc request body (SEC-004).
 */
@Component
public class KioskTokenAuthenticationFilter extends OncePerRequestFilter {

    private static final String KIOSK_TOKEN_HEADER = "X-Kiosk-Token";

    private final String expectedKioskToken;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;

    public KioskTokenAuthenticationFilter(
            @Value("${fas.kiosk.secret-token:}") String expectedKioskToken,
            CustomAuthenticationEntryPoint authenticationEntryPoint) {
        this.expectedKioskToken = expectedKioskToken;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !isProtectedPath(path);
    }

    private boolean isProtectedPath(String path) {
        return path != null && (
                path.equals("/api/v1/attendance/kiosk-punch")
                || path.equals("/api/v1/sync/offline-batch")
                || path.endsWith("/attendance/kiosk-punch")
                || path.endsWith("/sync/offline-batch")
        );
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String providedToken = request.getHeader(KIOSK_TOKEN_HEADER);

        if (!StringUtils.hasText(providedToken)
                || !StringUtils.hasText(expectedKioskToken)
                || !MessageDigest.isEqual(providedToken.getBytes(StandardCharsets.UTF_8),
                        expectedKioskToken.getBytes(StandardCharsets.UTF_8))) {
            authenticationEntryPoint.commence(request, response,
                    new BadCredentialsException("X-Kiosk-Token không hợp lệ hoặc bị thiếu."));
            return;
        }

        Authentication auth = new UsernamePasswordAuthenticationToken(
                "kiosk",
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_KIOSK"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        filterChain.doFilter(request, response);
    }
}
