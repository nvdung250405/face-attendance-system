package com.fas.service;

import com.fas.api.dto.request.LoginRequest;
import com.fas.api.dto.request.RefreshTokenRequest;
import com.fas.api.dto.response.LoginResponse;
import com.fas.api.dto.response.TokenResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.RefreshToken;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.RefreshTokenRepository;
import com.fas.data.repository.UserRepository;
import com.fas.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Bộ kiểm thử Unit Test cho AuthService (API-BE-001, API-BE-002, TASK-BE-020, BLD-BE-007).
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    private final Instant fixedNow = Instant.parse("2026-10-10T08:00:00Z");
    private final Clock clock = Clock.fixed(fixedNow, ZoneId.of("Asia/Ho_Chi_Minh"));

    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, refreshTokenRepository, jwtTokenProvider, passwordEncoder, clock);

        sampleUser = User.builder()
                .id(1042L)
                .employeeCode("NV-1042")
                .fullName("Ngô Văn Dũng")
                .email("dung.nv@company.com")
                .passwordHash("$2a$10$hashedPassword")
                .department("Phòng Kỹ thuật")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build();
    }

    @Nested
    @DisplayName("1. Kiểm thử Đăng nhập (login - API-BE-001)")
    class LoginTests {

        @Test
        @DisplayName("Đăng nhập thành công với email và mật khẩu chính xác")
        void login_Success() {
            LoginRequest request = new LoginRequest("dung.nv@company.com", "Password@123");

            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("Password@123", "$2a$10$hashedPassword")).thenReturn(true);
            when(jwtTokenProvider.generateToken("dung.nv@company.com", "EMPLOYEE")).thenReturn("mock-access-token");

            LoginResponse response = authService.login(request);

            assertThat(response).isNotNull();
            assertThat(response.accessToken()).isEqualTo("mock-access-token");
            assertThat(response.tokenType()).isEqualTo("Bearer");
            assertThat(response.expiresIn()).isEqualTo(3600L);
            assertThat(response.refreshToken()).isNotBlank();
            assertThat(response.user()).isNotNull();
            assertThat(response.user().id()).isEqualTo(1042L);
            assertThat(response.user().employeeCode()).isEqualTo("NV-1042");
            assertThat(response.user().email()).isEqualTo("dung.nv@company.com");
            assertThat(response.user().role()).isEqualTo(Role.EMPLOYEE);
            assertThat(response.user().status()).isEqualTo(EmployeeStatus.ACTIVE);

            ArgumentCaptor<RefreshToken> tokenCaptor = ArgumentCaptor.forClass(RefreshToken.class);
            verify(refreshTokenRepository).save(tokenCaptor.capture());
            RefreshToken savedToken = tokenCaptor.getValue();
            assertThat(savedToken.getUser()).isEqualTo(sampleUser);
            assertThat(savedToken.getTokenHash()).isEqualTo(AuthService.hashToken(response.refreshToken()));
            assertThat(savedToken.getExpiresAt()).isEqualTo(fixedNow.plus(7, ChronoUnit.DAYS));
            assertThat(savedToken.getCreatedAt()).isEqualTo(fixedNow);
        }

        @Test
        @DisplayName("Đăng nhập thất bại do email không tồn tại -> ném AUTH_INVALID_CREDENTIALS")
        void login_EmailNotFound_ThrowsException() {
            LoginRequest request = new LoginRequest("unknown@company.com", "Password@123");
            when(userRepository.findByEmail("unknown@company.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.AUTH_INVALID_CREDENTIALS));

            verify(refreshTokenRepository, never()).save(any());
        }

        @Test
        @DisplayName("Đăng nhập thất bại do sai mật khẩu -> ném AUTH_INVALID_CREDENTIALS")
        void login_WrongPassword_ThrowsException() {
            LoginRequest request = new LoginRequest("dung.nv@company.com", "WrongPassword");
            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("WrongPassword", "$2a$10$hashedPassword")).thenReturn(false);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.AUTH_INVALID_CREDENTIALS));

            verify(refreshTokenRepository, never()).save(any());
        }

        @Test
        @DisplayName("Đăng nhập thất bại do tài khoản đã bị vô hiệu hóa (TERMINATED) -> ném AUTH_INVALID_CREDENTIALS")
        void login_TerminatedUser_ThrowsException() {
            sampleUser.setStatus(EmployeeStatus.TERMINATED);
            LoginRequest request = new LoginRequest("dung.nv@company.com", "Password@123");
            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));
            when(passwordEncoder.matches("Password@123", "$2a$10$hashedPassword")).thenReturn(true);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.AUTH_INVALID_CREDENTIALS));

            verify(refreshTokenRepository, never()).save(any());
        }

        @Test
        @DisplayName("Đăng nhập với request null -> ném VALIDATION_FAILED")
        void login_NullRequest_ThrowsException() {
            assertThatThrownBy(() -> authService.login(null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));
        }
    }

    @Nested
    @DisplayName("2. Kiểm thử Làm mới Token (refreshToken - API-BE-002)")
    class RefreshTokenTests {

        @Test
        @DisplayName("Làm mới token thành công và thực hiện Token Rotation")
        void refreshToken_Success() {
            String rawOldToken = "old-refresh-token-uuid";
            String oldHash = AuthService.hashToken(rawOldToken);

            RefreshToken existingToken = RefreshToken.builder()
                    .id(501L)
                    .user(sampleUser)
                    .tokenHash(oldHash)
                    .expiresAt(fixedNow.plus(3, ChronoUnit.DAYS))
                    .createdAt(fixedNow.minus(4, ChronoUnit.DAYS))
                    .build();

            when(refreshTokenRepository.findByTokenHash(oldHash)).thenReturn(Optional.of(existingToken));
            when(jwtTokenProvider.generateToken("dung.nv@company.com", "EMPLOYEE")).thenReturn("new-access-token");

            TokenResponse response = authService.refreshToken(new RefreshTokenRequest(rawOldToken));

            assertThat(response).isNotNull();
            assertThat(response.accessToken()).isEqualTo("new-access-token");
            assertThat(response.refreshToken()).isNotEqualTo(rawOldToken);
            assertThat(response.tokenType()).isEqualTo("Bearer");
            assertThat(response.expiresIn()).isEqualTo(3600L);

            assertThat(existingToken.getRevokedAt()).isEqualTo(fixedNow);
            verify(refreshTokenRepository).save(existingToken);

            ArgumentCaptor<RefreshToken> newCaptor = ArgumentCaptor.forClass(RefreshToken.class);
            verify(refreshTokenRepository, times(2)).save(newCaptor.capture());
            RefreshToken newToken = newCaptor.getValue();
            assertThat(newToken.getUser()).isEqualTo(sampleUser);
            assertThat(newToken.getTokenHash()).isEqualTo(AuthService.hashToken(response.refreshToken()));
            assertThat(newToken.getExpiresAt()).isEqualTo(fixedNow.plus(7, ChronoUnit.DAYS));
        }

        @Test
        @DisplayName("Làm mới token thất bại khi không tìm thấy token trong CSDL -> ném AUTH_INVALID_CREDENTIALS")
        void refreshToken_NotFound_ThrowsException() {
            String rawToken = "non-existent-token";
            String hash = AuthService.hashToken(rawToken);
            when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.refreshToken(new RefreshTokenRequest(rawToken)))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.AUTH_INVALID_CREDENTIALS));
        }

        @Test
        @DisplayName("Làm mới token thất bại khi token đã bị thu hồi (revokedAt != null) -> ném AUTH_INVALID_CREDENTIALS")
        void refreshToken_AlreadyRevoked_ThrowsException() {
            String rawToken = "already-revoked-token";
            String hash = AuthService.hashToken(rawToken);

            RefreshToken revokedToken = RefreshToken.builder()
                    .id(502L)
                    .user(sampleUser)
                    .tokenHash(hash)
                    .expiresAt(fixedNow.plus(2, ChronoUnit.DAYS))
                    .revokedAt(fixedNow.minus(1, ChronoUnit.HOURS))
                    .build();

            when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(revokedToken));

            assertThatThrownBy(() -> authService.refreshToken(new RefreshTokenRequest(rawToken)))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.AUTH_INVALID_CREDENTIALS));
        }

        @Test
        @DisplayName("Làm mới token thất bại khi token đã hết hạn -> ném AUTH_INVALID_CREDENTIALS")
        void refreshToken_Expired_ThrowsException() {
            String rawToken = "expired-token";
            String hash = AuthService.hashToken(rawToken);

            RefreshToken expiredToken = RefreshToken.builder()
                    .id(503L)
                    .user(sampleUser)
                    .tokenHash(hash)
                    .expiresAt(fixedNow.minus(1, ChronoUnit.SECONDS))
                    .build();

            when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(expiredToken));

            assertThatThrownBy(() -> authService.refreshToken(new RefreshTokenRequest(rawToken)))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.AUTH_INVALID_CREDENTIALS));
        }

        @Test
        @DisplayName("Làm mới token khi request trống/null -> ném VALIDATION_FAILED")
        void refreshToken_NullOrBlank_ThrowsException() {
            assertThatThrownBy(() -> authService.refreshToken(null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));

            assertThatThrownBy(() -> authService.refreshToken(new RefreshTokenRequest("   ")))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));
        }
    }
}
