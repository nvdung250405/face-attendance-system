package com.fas.api.controller;

import com.fas.api.dto.request.LogoutRequest;
import com.fas.security.CurrentUserService;
import com.fas.service.AccountManagementService;
import com.fas.service.AuthService;
import com.fas.service.SessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class LogoutControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private AuthService authService;

    @Mock
    private AccountManagementService accountManagementService;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private SessionService sessionService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    @DisplayName("Đăng xuất thành công với refreshToken hợp lệ -> trả về 204 No Content")
    void logout_Success() throws Exception {
        LogoutRequest request = new LogoutRequest("sample-refresh-token");

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(sessionService).logout("sample-refresh-token");
    }

    @Test
    @DisplayName("Đăng xuất khi body rỗng -> trả về 204 No Content không gọi service")
    void logout_EmptyBody_Returns204() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isNoContent());

        verifyNoInteractions(sessionService);
    }
}
