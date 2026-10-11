package com.fas.api.controller;

import com.fas.api.dto.request.ChangePasswordRequest;
import com.fas.api.dto.request.LoginRequest;
import com.fas.api.dto.request.RefreshTokenRequest;
import com.fas.api.dto.response.AuthenticatedUser;
import com.fas.api.dto.response.LoginResponse;
import com.fas.api.dto.response.TokenResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.UserRepository;
import com.fas.service.AccountManagementService;
import com.fas.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.security.Principal;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử REST Controller cho AuthController
 * (API-BE-001, API-BE-002, APD-BE-002, TASK-BE-020, BLD-BE-007).
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private AuthService authService;

    @Mock
    private AccountManagementService accountManagementService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Nested
    @DisplayName("1. Đăng nhập hệ thống (POST /api/v1/auth/login)")
    class LoginTests {

        @Test
        @DisplayName("Đăng nhập thành công trả về 200 OK kèm token và thông tin người dùng")
        void login_Success_Returns200() throws Exception {
            LoginRequest request = new LoginRequest("dung.nv@company.com", "Password@123");

            AuthenticatedUser user = new AuthenticatedUser(
                    1042L, "NV-1042", "Ngô Văn Dũng", "dung.nv@company.com",
                    Role.EMPLOYEE, EmployeeStatus.ACTIVE, "Phòng Kỹ thuật"
            );
            LoginResponse response = new LoginResponse(
                    "jwt-access-token", "refresh-token-uuid", "Bearer", 3600L, user
            );

            when(authService.login(any(LoginRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("AUTH_SUCCESS"))
                    .andExpect(jsonPath("$.message").value("Đăng nhập thành công"))
                    .andExpect(jsonPath("$.data.accessToken").value("jwt-access-token"))
                    .andExpect(jsonPath("$.data.refreshToken").value("refresh-token-uuid"))
                    .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                    .andExpect(jsonPath("$.data.expiresIn").value(3600))
                    .andExpect(jsonPath("$.data.user.id").value(1042))
                    .andExpect(jsonPath("$.data.user.employeeCode").value("NV-1042"))
                    .andExpect(jsonPath("$.data.user.email").value("dung.nv@company.com"));

            verify(authService).login(any(LoginRequest.class));
        }

        @Test
        @DisplayName("Sai mật khẩu hoặc email không tồn tại -> trả về 401 Unauthorized")
        void login_InvalidCredentials_Returns401() throws Exception {
            LoginRequest request = new LoginRequest("dung.nv@company.com", "WrongPassword");

            when(authService.login(any(LoginRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Email hoặc mật khẩu không chính xác"));

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"))
                    .andExpect(jsonPath("$.detail").value(containsString("Email hoặc mật khẩu không chính xác")));
        }

        @Test
        @DisplayName("Email để trống -> trả về 400 Bad Request kèm invalidParams")
        void login_BlankEmail_Returns400() throws Exception {
            LoginRequest request = new LoginRequest("", "Password@123");

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.invalidParams", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("Mật khẩu dưới 8 ký tự -> trả về 400 Bad Request")
        void login_ShortPassword_Returns400() throws Exception {
            LoginRequest request = new LoginRequest("dung.nv@company.com", "short");

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }
    }

    @Nested
    @DisplayName("2. Làm mới Token (POST /api/v1/auth/refresh)")
    class RefreshTokenTests {

        @Test
        @DisplayName("Làm mới token thành công trả về 200 OK kèm token mới")
        void refreshToken_Success_Returns200() throws Exception {
            RefreshTokenRequest request = new RefreshTokenRequest("valid-refresh-token");
            TokenResponse response = new TokenResponse("new-jwt-token", "new-refresh-token", "Bearer", 3600L);

            when(authService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/v1/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("TOKEN_REFRESHED"))
                    .andExpect(jsonPath("$.data.accessToken").value("new-jwt-token"))
                    .andExpect(jsonPath("$.data.refreshToken").value("new-refresh-token"));

            verify(authService).refreshToken(any(RefreshTokenRequest.class));
        }

        @Test
        @DisplayName("Refresh token hết hạn hoặc không hợp lệ -> trả về 401 Unauthorized")
        void refreshToken_ExpiredOrInvalid_Returns401() throws Exception {
            RefreshTokenRequest request = new RefreshTokenRequest("expired-token");

            when(authService.refreshToken(any(RefreshTokenRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Refresh Token không hợp lệ hoặc đã hết hạn"));

            mockMvc.perform(post("/api/v1/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
        }

        @Test
        @DisplayName("Refresh token để trống -> trả về 400 Bad Request")
        void refreshToken_BlankToken_Returns400() throws Exception {
            RefreshTokenRequest request = new RefreshTokenRequest("  ");

            mockMvc.perform(post("/api/v1/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }
    }

    @Nested
    @DisplayName("3. Đổi mật khẩu tự nguyện (POST /api/v1/auth/change-password)")
    class ChangePasswordTests {

        private final Principal mockPrincipal = () -> "dung.nv@company.com";

        @Test
        @DisplayName("Đổi mật khẩu thành công trả về 200 OK")
        void changePassword_Success_Returns200() throws Exception {
            ChangePasswordRequest request = new ChangePasswordRequest("OldPassword@123", "NewPassword@123", "NewPassword@123");
            User user = User.builder().id(1042L).email("dung.nv@company.com").build();

            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(user));
            doNothing().when(accountManagementService).changePassword(eq(1042L), any(ChangePasswordRequest.class));

            mockMvc.perform(post("/api/v1/auth/change-password")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("PASSWORD_CHANGED"))
                    .andExpect(jsonPath("$.message").value("Đổi mật khẩu thành công"));

            verify(accountManagementService).changePassword(eq(1042L), any(ChangePasswordRequest.class));
        }

        @Test
        @DisplayName("Sai mật khẩu hiện tại -> trả về 401 Unauthorized")
        void changePassword_WrongCurrentPassword_Returns401() throws Exception {
            ChangePasswordRequest request = new ChangePasswordRequest("WrongPassword@123", "NewPassword@123", "NewPassword@123");
            User user = User.builder().id(1042L).email("dung.nv@company.com").build();

            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(user));
            doThrow(new ApiException(ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Mật khẩu hiện tại không chính xác"))
                    .when(accountManagementService).changePassword(eq(1042L), any(ChangePasswordRequest.class));

            mockMvc.perform(post("/api/v1/auth/change-password")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
        }

        @Test
        @DisplayName("Mật khẩu mới trùng mật khẩu hiện tại -> trả về 400 Bad Request")
        void changePassword_SamePassword_Returns400() throws Exception {
            ChangePasswordRequest request = new ChangePasswordRequest("CurrentPassword@123", "CurrentPassword@123", "CurrentPassword@123");
            User user = User.builder().id(1042L).email("dung.nv@company.com").build();

            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(user));
            doThrow(new ApiException(ApiErrorCode.VALIDATION_FAILED, "Mật khẩu mới phải khác mật khẩu hiện tại"))
                    .when(accountManagementService).changePassword(eq(1042L), any(ChangePasswordRequest.class));

            mockMvc.perform(post("/api/v1/auth/change-password")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }

        @Test
        @DisplayName("Mật khẩu xác nhận không khớp -> trả về 400 Bad Request")
        void changePassword_ConfirmMismatch_Returns400() throws Exception {
            ChangePasswordRequest request = new ChangePasswordRequest("CurrentPassword@123", "NewPassword@123", "MismatchPassword@123");
            User user = User.builder().id(1042L).email("dung.nv@company.com").build();

            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(user));
            doThrow(new ApiException(ApiErrorCode.VALIDATION_FAILED, "Mật khẩu xác nhận không khớp"))
                    .when(accountManagementService).changePassword(eq(1042L), any(ChangePasswordRequest.class));

            mockMvc.perform(post("/api/v1/auth/change-password")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }

        @Test
        @DisplayName("Chưa đăng nhập (thiếu Principal) -> trả về 403 Forbidden")
        void changePassword_Unauthenticated_Returns403() throws Exception {
            ChangePasswordRequest request = new ChangePasswordRequest("OldPassword@123", "NewPassword@123", "NewPassword@123");

            mockMvc.perform(post("/api/v1/auth/change-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
        }
    }
}
