package com.fas.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KioskTokenAuthenticationFilterTest {

    private static final String SECRET_TOKEN = "Test_Secret_Kiosk_Token_2026";

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private CustomAuthenticationEntryPoint entryPoint;
    private KioskTokenAuthenticationFilter filter;

    @Mock
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        entryPoint = new CustomAuthenticationEntryPoint(objectMapper);
        filter = new KioskTokenAuthenticationFilter(SECRET_TOKEN, entryPoint);
    }

    @Test
    @DisplayName("SEC-004: Endpoint không thuộc diện bảo vệ bởi kiosk token được bỏ qua bộ lọc")
    void shouldNotFilter_NonProtectedPath() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/auth/me");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    @DisplayName("SEC-004: Endpoint kiosk-punch thiếu header X-Kiosk-Token bị từ chối 401")
    void kioskPunch_MissingHeader_Returns401() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/attendance/kiosk-punch");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).startsWith("application/problem+json");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("SEC-004: Endpoint kiosk-punch với X-Kiosk-Token sai giá trị bị từ chối 401")
    void kioskPunch_InvalidHeader_Returns401() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/attendance/kiosk-punch");
        request.addHeader("X-Kiosk-Token", "wrong-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("SEC-004: Endpoint offline-batch với X-Kiosk-Token hợp lệ được gán Authentication và cho qua")
    void offlineBatch_ValidHeader_Passes() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/sync/offline-batch");
        request.addHeader("X-Kiosk-Token", SECRET_TOKEN);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(200);
        verify(filterChain, times(1)).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
                .anyMatch(a -> a.getAuthority().equals("ROLE_KIOSK"));
    }
}
