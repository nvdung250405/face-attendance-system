package com.fas.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

/**
 * Filter đánh chặn từng HTTP request để trích xuất và xác thực Bearer JWT Token.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final com.fas.data.repository.UserRepository userRepository;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this(tokenProvider, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public JwtAuthenticationFilter(
            JwtTokenProvider tokenProvider,
            @org.springframework.beans.factory.annotation.Autowired(required = false) com.fas.data.repository.UserRepository userRepository
    ) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = resolveToken(request);

        if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
            String username = tokenProvider.getUsernameFromToken(token);

            // Kiểm tra trạng thái tài khoản: TERMINATED/SUSPENDED không dùng được access token còn hạn (FR-BE-020, DD-BE-023)
            boolean userAllowed = true;
            java.util.Optional<com.fas.data.entity.User> userOpt = java.util.Optional.empty();
            if (userRepository != null && StringUtils.hasText(username)) {
                userOpt = userRepository.findByEmail(username)
                        .or(() -> userRepository.findByEmployeeCode(username));
                if (userOpt.isPresent()) {
                    com.fas.data.enums.EmployeeStatus status = userOpt.get().getStatus();
                    if (status == com.fas.data.enums.EmployeeStatus.TERMINATED || status == com.fas.data.enums.EmployeeStatus.SUSPENDED) {
                        userAllowed = false;
                    }
                }
            }

            if (userAllowed) {
                String role = (userOpt != null && userOpt.isPresent())
                        ? userOpt.get().getRole().name()
                        : tokenProvider.getRoleFromToken(token);

                List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + (role != null ? role : "EMPLOYEE"))
                );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(username, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
