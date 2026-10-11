package com.fas.service;

import com.fas.data.entity.RefreshToken;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử Dịch vụ Quản lý Phiên làm việc & Thu hồi Token
 * (SOL-BE-023, FR-BE-020, DATA-BE-022, DD-BE-023, API-BE-038, TST-BE-034, BLD-BE-031, TASK-BE-036).
 */
@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private final Instant now = Instant.parse("2026-10-11T12:00:00Z");
    private final Clock clock = Clock.fixed(now, ZoneId.of("UTC"));

    private SessionService sessionService;

    @BeforeEach
    void setUp() {
        sessionService = new SessionService(refreshTokenRepository, clock);
    }

    @Test
    @DisplayName("TST-BE-034: Đăng xuất thu hồi Refresh Token hiện tại thành công")
    void logout_ValidToken_RevokesToken() {
        // Given
        String rawToken = "sample-raw-refresh-token-123";
        String tokenHash = AuthService.hashToken(rawToken);

        User user = User.builder().id(100L).email("user@fas.com").status(EmployeeStatus.ACTIVE).build();
        RefreshToken token = RefreshToken.builder()
                .id(1L)
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(now.plus(7, ChronoUnit.DAYS))
                .createdAt(now.minus(1, ChronoUnit.DAYS))
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));

        // When
        sessionService.logout(rawToken);

        // Then
        assertThat(token.getRevokedAt()).isEqualTo(now);
        verify(refreshTokenRepository).save(token);
    }

    @Test
    @DisplayName("TST-BE-034: Đăng xuất với token rỗng hoặc không tồn tại là an toàn và idempotent")
    void logout_NonExistentOrEmptyToken_DoesNotThrow() {
        // Given
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        // When
        sessionService.logout("non-existent-token");
        sessionService.logout("");
        sessionService.logout(null);

        // Then
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("TST-BE-034: Thu hồi toàn bộ Refresh Token của một tài khoản khi đổi mật khẩu/vô hiệu hóa")
    void revokeAllSessionsForUser_ActiveTokens_RevokesAll() {
        // Given
        Long userId = 200L;
        User user = User.builder().id(userId).email("user2@fas.com").build();

        RefreshToken token1 = RefreshToken.builder().id(1L).user(user).tokenHash("hash1").build();
        RefreshToken token2 = RefreshToken.builder().id(2L).user(user).tokenHash("hash2").build();

        when(refreshTokenRepository.findByUserIdAndRevokedAtIsNull(userId)).thenReturn(List.of(token1, token2));

        // When
        sessionService.revokeAllSessionsForUser(userId);

        // Then
        assertThat(token1.getRevokedAt()).isEqualTo(now);
        assertThat(token2.getRevokedAt()).isEqualTo(now);
        verify(refreshTokenRepository).saveAll(List.of(token1, token2));
    }

    @Test
    @DisplayName("TST-BE-034: Kiểm tra tính hợp lệ của phiên - token chưa thu hồi và tài khoản ACTIVE trả về true")
    void isSessionValid_ActiveTokenAndActiveUser_ReturnsTrue() {
        // Given
        String rawToken = "active-valid-token";
        String tokenHash = AuthService.hashToken(rawToken);

        User user = User.builder().id(100L).status(EmployeeStatus.ACTIVE).build();
        RefreshToken token = RefreshToken.builder()
                .id(1L)
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(now.plus(7, ChronoUnit.DAYS))
                .revokedAt(null)
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));

        // When & Then
        assertThat(sessionService.isSessionValid(rawToken)).isTrue();
    }

    @Test
    @DisplayName("TST-BE-034: Token đã bị thu hồi trả về false khi kiểm tra")
    void isSessionValid_RevokedToken_ReturnsFalse() {
        // Given
        String rawToken = "revoked-token";
        String tokenHash = AuthService.hashToken(rawToken);

        User user = User.builder().id(100L).status(EmployeeStatus.ACTIVE).build();
        RefreshToken token = RefreshToken.builder()
                .id(1L)
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(now.plus(7, ChronoUnit.DAYS))
                .revokedAt(now.minus(1, ChronoUnit.HOURS))
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));

        // When & Then
        assertThat(sessionService.isSessionValid(rawToken)).isFalse();
    }

    @Test
    @DisplayName("TST-BE-034: Tài khoản TERMINATED hoặc SUSPENDED trả về false khi kiểm tra phiên")
    void isSessionValid_TerminatedOrSuspendedUser_ReturnsFalse() {
        // Given
        String rawToken = "valid-token-terminated-user";
        String tokenHash = AuthService.hashToken(rawToken);

        User terminatedUser = User.builder().id(100L).status(EmployeeStatus.TERMINATED).build();
        RefreshToken token = RefreshToken.builder()
                .id(1L)
                .user(terminatedUser)
                .tokenHash(tokenHash)
                .expiresAt(now.plus(7, ChronoUnit.DAYS))
                .revokedAt(null)
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));

        // When & Then
        assertThat(sessionService.isSessionValid(rawToken)).isFalse();
    }

    @Test
    @DisplayName("TST-BE-034: Tạo phiên mới sinh refresh token ngẫu nhiên lưu dạng hash với thời hạn 7 ngày")
    void createSession_ValidUser_SavesTokenAndReturnsRawToken() {
        // Given
        User user = User.builder().id(100L).email("user@fas.com").build();

        // When
        String rawToken = sessionService.createSession(user, "192.168.1.10", "Mozilla/5.0");

        // Then
        assertThat(rawToken).isNotBlank();

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());

        RefreshToken saved = captor.getValue();
        assertThat(saved.getUser()).isEqualTo(user);
        assertThat(saved.getTokenHash()).isEqualTo(AuthService.hashToken(rawToken));
        assertThat(saved.getExpiresAt()).isEqualTo(now.plus(7, ChronoUnit.DAYS));
        assertThat(saved.getClientIp()).isEqualTo("192.168.1.10");
        assertThat(saved.getUserAgent()).isEqualTo("Mozilla/5.0");
    }

    @Test
    @DisplayName("TST-BE-034: Đếm số lượng phiên làm việc đang hoạt động của tài khoản")
    void countActiveSessions_ReturnsCount() {
        // Given
        when(refreshTokenRepository.countByUserIdAndRevokedAtIsNull(100L)).thenReturn(3L);

        // When & Then
        assertThat(sessionService.countActiveSessions(100L)).isEqualTo(3L);
        assertThat(sessionService.countActiveSessions(null)).isEqualTo(0L);
    }
}
