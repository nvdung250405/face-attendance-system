package com.fas.service;

import com.fas.data.entity.RefreshToken;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.repository.RefreshTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Dịch vụ Quản lý Phiên làm việc & Thu hồi Token
 * (SOL-BE-023, FR-BE-020, DATA-BE-022, DD-BE-023, API-BE-038, TST-BE-034, BLD-BE-031, TASK-BE-036).
 *
 * <p>Nghiệp vụ cốt lõi:
 * <ul>
 *   <li>Lưu trữ Refresh Token dưới dạng băm một chiều SHA-256 kèm thời hạn (7 ngày).</li>
 *   <li>Đăng xuất: thu hồi Refresh Token hiện tại (đánh dấu revokedAt = NOW()).</li>
 *   <li>Thu hồi toàn bộ phiên của tài khoản khi đổi mật khẩu, cấp lại mật khẩu hoặc vô hiệu hóa.</li>
 *   <li>Kiểm tra tính hợp lệ của phiên và trạng thái người dùng (từ chối khi TERMINATED/SUSPENDED).</li>
 * </ul>
 */
@Slf4j
@Service
public class SessionService {

    public static final int REFRESH_TOKEN_VALIDITY_DAYS = 7;

    private final RefreshTokenRepository refreshTokenRepository;
    private final Clock clock;

    @Autowired
    public SessionService(RefreshTokenRepository refreshTokenRepository) {
        this(refreshTokenRepository, Clock.systemDefaultZone());
    }

    public SessionService(RefreshTokenRepository refreshTokenRepository, Clock clock) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.clock = clock;
    }

    /**
     * Đăng xuất và thu hồi Refresh Token (POST /api/v1/auth/logout - API-BE-038, FR-BE-020).
     *
     * @param rawRefreshToken chuỗi refresh token văn bản thô
     */
    @Transactional
    public void logout(String rawRefreshToken) {
        if (!StringUtils.hasText(rawRefreshToken)) {
            log.warn("Đăng xuất: Refresh token rỗng hoặc không hợp lệ");
            return;
        }

        String tokenHash = AuthService.hashToken(rawRefreshToken.trim());
        Optional<RefreshToken> optionalToken = refreshTokenRepository.findByTokenHash(tokenHash);

        if (optionalToken.isPresent()) {
            RefreshToken token = optionalToken.get();
            if (token.getRevokedAt() == null) {
                token.setRevokedAt(clock.instant());
                refreshTokenRepository.save(token);
                log.info("Đã thu hồi thành công phiên đăng nhập ID={}, User ID={}", token.getId(), token.getUser().getId());
            } else {
                log.info("Phiên đăng nhập ID={} đã được thu hồi trước đó", token.getId());
            }
        } else {
            log.warn("Không tìm thấy phiên làm việc tương ứng với token cung cấp để đăng xuất");
        }
    }

    /**
     * Thu hồi toàn bộ Refresh Token đang hoạt động của một tài khoản người dùng
     * (khi đổi mật khẩu, cấp lại mật khẩu, hoặc tài khoản bị vô hiệu hóa - FR-BE-020, DD-BE-023).
     *
     * @param userId định danh người dùng
     */
    @Transactional
    public void revokeAllSessionsForUser(Long userId) {
        if (userId == null) {
            return;
        }

        List<RefreshToken> activeTokens = refreshTokenRepository.findByUserIdAndRevokedAtIsNull(userId);
        if (!activeTokens.isEmpty()) {
            Instant now = clock.instant();
            activeTokens.forEach(token -> token.setRevokedAt(now));
            refreshTokenRepository.saveAll(activeTokens);
            log.info("Đã thu hồi toàn bộ {} phiên đăng nhập còn hiệu lực của người dùng ID={}", activeTokens.size(), userId);
        }
    }

    /**
     * Kiểm tra phiên làm việc có hợp lệ và người dùng còn đang hoạt động hay không.
     *
     * @param rawRefreshToken chuỗi refresh token thô
     * @return true nếu phiên hợp lệ và tài khoản không bị khóa/thôi việc
     */
    @Transactional(readOnly = true)
    public boolean isSessionValid(String rawRefreshToken) {
        if (!StringUtils.hasText(rawRefreshToken)) {
            return false;
        }

        String tokenHash = AuthService.hashToken(rawRefreshToken.trim());
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);
        if (tokenOpt.isEmpty()) {
            return false;
        }

        RefreshToken token = tokenOpt.get();
        if (!token.isUsable(clock.instant())) {
            return false;
        }

        User user = token.getUser();
        if (user == null || user.getStatus() == EmployeeStatus.TERMINATED || user.getStatus() == EmployeeStatus.SUSPENDED) {
            return false;
        }

        return true;
    }

    /**
     * Đếm số lượng phiên làm việc đang hoạt động của một tài khoản.
     *
     * @param userId định danh người dùng
     * @return số lượng phiên còn hiệu lực
     */
    @Transactional(readOnly = true)
    public long countActiveSessions(Long userId) {
        if (userId == null) {
            return 0;
        }
        return refreshTokenRepository.countByUserIdAndRevokedAtIsNull(userId);
    }

    /**
     * Tạo và lưu trữ phiên làm việc (Refresh Token) mới.
     *
     * @param user      người dùng đăng nhập
     * @param clientIp  IP máy khách
     * @param userAgent User-Agent máy khách
     * @return chuỗi rawRefreshToken ngẫu nhiên
     */
    @Transactional
    public String createSession(User user, String clientIp, String userAgent) {
        Instant now = clock.instant();
        String rawToken = UUID.randomUUID().toString();
        String tokenHash = AuthService.hashToken(rawToken);

        RefreshToken token = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(now.plus(REFRESH_TOKEN_VALIDITY_DAYS, ChronoUnit.DAYS))
                .clientIp(clientIp)
                .userAgent(userAgent)
                .createdAt(now)
                .build();

        refreshTokenRepository.save(token);
        return rawToken;
    }
}
