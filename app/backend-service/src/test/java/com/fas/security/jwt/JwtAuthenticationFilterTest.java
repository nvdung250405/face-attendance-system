package com.fas.security.jwt;

import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử Bộ lọc Xác thực JWT và Kiểm tra trạng thái tài khoản
 * (FR-BE-020, DD-BE-023, TST-BE-034).
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        filter = new JwtAuthenticationFilter(tokenProvider, userRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("TST-BE-034: Tài khoản ACTIVE với token hợp lệ được thiết lập Authentication vào SecurityContext")
    void doFilterInternal_ActiveUser_AuthenticatesSuccessfully() throws ServletException, IOException {
        // Given
        String token = "valid-jwt-token";
        String email = "active@fas.com";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(tokenProvider.validateToken(token)).thenReturn(true);
        when(tokenProvider.getUsernameFromToken(token)).thenReturn(email);
        when(tokenProvider.getRoleFromToken(token)).thenReturn("EMPLOYEE");

        User activeUser = User.builder().id(100L).email(email).status(EmployeeStatus.ACTIVE).role(Role.EMPLOYEE).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(activeUser));

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo(email);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("TST-BE-034: Tài khoản TERMINATED không dùng được access token còn hạn")
    void doFilterInternal_TerminatedUser_RejectsAuthentication() throws ServletException, IOException {
        // Given
        String token = "valid-jwt-token-terminated";
        String email = "terminated@fas.com";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(tokenProvider.validateToken(token)).thenReturn(true);
        when(tokenProvider.getUsernameFromToken(token)).thenReturn(email);

        User terminatedUser = User.builder().id(101L).email(email).status(EmployeeStatus.TERMINATED).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(terminatedUser));

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("TST-BE-034: Tài khoản SUSPENDED không dùng được access token còn hạn")
    void doFilterInternal_SuspendedUser_RejectsAuthentication() throws ServletException, IOException {
        // Given
        String token = "valid-jwt-token-suspended";
        String email = "suspended@fas.com";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(tokenProvider.validateToken(token)).thenReturn(true);
        when(tokenProvider.getUsernameFromToken(token)).thenReturn(email);

        User suspendedUser = User.builder().id(102L).email(email).status(EmployeeStatus.SUSPENDED).build();
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(suspendedUser));

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }
}
