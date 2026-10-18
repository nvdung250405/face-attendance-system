package com.fas.service;

import com.fas.api.dto.request.LoginRequest;
import com.fas.api.dto.request.RefreshTokenRequest;
import com.fas.api.dto.response.AuthenticatedUser;
import com.fas.api.dto.response.LoginResponse;
import com.fas.api.dto.response.TokenResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.RefreshToken;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.repository.RefreshTokenRepository;
import com.fas.data.repository.UserRepository;
import com.fas.security.jwt.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Dịch vụ Xác thực & Quản lý Phiên làm việc Web Portal
 * (API-BE-001, API-BE-002, APD-BE-002, FR-BE-001, FR-BE-020, DD-BE-023).
 *
 * <p>Cung cấp nghiệp vụ:
 * <ul>
 *   <li>Đăng nhập tài khoản bằng email & mật khẩu, cấp phát cặp Access Token (1 giờ) và Refresh Token (7 ngày).</li>
 *   <li>Làm mới Access Token và luân chuyển Refresh Token (Token Rotation) an toàn.</li>
 * </ul>
 */
@Slf4j
@Service
public class AuthService {

    private static final long ACCESS_TOKEN_EXPIRATION_SECONDS = 3600L;
    private static final int REFRESH_TOKEN_VALIDITY_DAYS = 7;
    private static final String TOKEN_TYPE_BEARER = "Bearer";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final com.fas.data.repository.BiometricTemplateRepository biometricTemplateRepository;

    @Autowired
    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            JwtTokenProvider jwtTokenProvider,
            PasswordEncoder passwordEncoder,
            com.fas.data.repository.BiometricTemplateRepository biometricTemplateRepository) {
        this(userRepository, refreshTokenRepository, jwtTokenProvider, passwordEncoder, Clock.systemDefaultZone(), biometricTemplateRepository);
    }

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            JwtTokenProvider jwtTokenProvider,
            PasswordEncoder passwordEncoder,
            Clock clock) {
        this(userRepository, refreshTokenRepository, jwtTokenProvider, passwordEncoder, clock, null);
    }

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            JwtTokenProvider jwtTokenProvider,
            PasswordEncoder passwordEncoder,
            Clock clock,
            com.fas.data.repository.BiometricTemplateRepository biometricTemplateRepository) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
        this.biometricTemplateRepository = biometricTemplateRepository;
    }

    /**
     * Xác thực tài khoản người dùng và cấp cặp token truy cập (API-BE-001).
     *
     * @param request thông tin đăng nhập gồm email và mật khẩu
     * @return thông tin đăng nhập thành công kèm Access Token và Refresh Token
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        if (request == null) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Thông tin đăng nhập không được để trống");
        }

        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Đăng nhập thất bại: Không tìm thấy tài khoản email '{}'", email);
                    return new ApiException(ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Email hoặc mật khẩu không chính xác");
                });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.warn("Đăng nhập thất bại: Sai mật khẩu cho tài khoản email '{}'", email);
            throw new ApiException(ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Email hoặc mật khẩu không chính xác");
        }

        if (user.getStatus() == EmployeeStatus.TERMINATED || user.getStatus() == EmployeeStatus.SUSPENDED) {
            log.warn("Đăng nhập thất bại: Tài khoản '{}' đang ở trạng thái '{}'", email, user.getStatus());
            throw new ApiException(ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Tài khoản đã bị khóa hoặc ngừng hoạt động");
        }

        Instant now = clock.instant();

        // 1. Sinh Access Token JWT
        String accessToken = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().name());

        // 2. Sinh Refresh Token ngẫu nhiên và lưu bản ghi băm một chiều
        String rawRefreshToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawRefreshToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(now.plus(REFRESH_TOKEN_VALIDITY_DAYS, ChronoUnit.DAYS))
                .createdAt(now)
                .build();
        refreshTokenRepository.save(refreshToken);

        log.info("Người dùng '{}' (ID={}, Role={}) đăng nhập thành công", user.getEmail(), user.getId(), user.getRole());

        boolean hasBiometric = biometricTemplateRepository != null &&
                biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId()).isPresent();
        boolean hasPin = org.springframework.util.StringUtils.hasText(user.getPinHash());

        AuthenticatedUser authenticatedUser = new AuthenticatedUser(
                user.getId(),
                user.getEmployeeCode(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getDepartment(),
                hasBiometric,
                hasPin
        );

        return new LoginResponse(
                accessToken,
                rawRefreshToken,
                TOKEN_TYPE_BEARER,
                ACCESS_TOKEN_EXPIRATION_SECONDS,
                authenticatedUser
        );
    }

    /**
     * Lấy thông tin tài khoản và trạng thái hồ sơ người dùng hiện tại (API-BE-001/PROFILE).
     *
     * @param userId mã định danh người dùng
     * @return hồ sơ người dùng đầy đủ trạng thái sinh trắc
     */
    @Transactional(readOnly = true)
    public AuthenticatedUser getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy thông tin tài khoản"));

        boolean hasBiometric = biometricTemplateRepository != null &&
                biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId()).isPresent();
        boolean hasPin = org.springframework.util.StringUtils.hasText(user.getPinHash());

        return new AuthenticatedUser(
                user.getId(),
                user.getEmployeeCode(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getDepartment(),
                hasBiometric,
                hasPin
        );
    }

    /**
     * Làm mới Access Token và luân chuyển Refresh Token (API-BE-002, FR-BE-020).
     *
     * @param request yêu cầu làm mới chứa Refresh Token hiện tại
     * @return cặp Access Token mới và Refresh Token được luân chuyển
     */
    @Transactional
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        if (request == null || request.refreshToken() == null || request.refreshToken().isBlank()) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Refresh Token không được để trống");
        }

        String rawToken = request.refreshToken().trim();
        String tokenHash = hashToken(rawToken);

        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> {
                    log.warn("Làm mới token thất bại: Không tìm thấy Refresh Token khớp hash");
                    return new ApiException(ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Refresh Token không hợp lệ hoặc đã hết hạn");
                });

        Instant now = clock.instant();
        if (!token.isUsable(now)) {
            log.warn("Làm mới token thất bại: Refresh Token ID={} đã bị thu hồi hoặc hết hạn (Expires={}, Revoked={})",
                    token.getId(), token.getExpiresAt(), token.getRevokedAt());
            throw new ApiException(ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Refresh Token không hợp lệ hoặc đã hết hạn");
        }

        User user = token.getUser();
        if (user == null || user.getStatus() == EmployeeStatus.TERMINATED || user.getStatus() == EmployeeStatus.SUSPENDED) {
            log.warn("Làm mới token thất bại: Tài khoản người dùng không còn hoạt động hợp lệ");
            throw new ApiException(ApiErrorCode.AUTH_INVALID_CREDENTIALS, "Tài khoản không hoạt động");
        }

        // 1. Thu hồi Refresh Token cũ (Token Rotation)
        token.setRevokedAt(now);
        refreshTokenRepository.save(token);

        // 2. Cấp phát Refresh Token mới
        String newRawToken = UUID.randomUUID().toString();
        String newHash = hashToken(newRawToken);

        RefreshToken newToken = RefreshToken.builder()
                .user(user)
                .tokenHash(newHash)
                .expiresAt(now.plus(REFRESH_TOKEN_VALIDITY_DAYS, ChronoUnit.DAYS))
                .createdAt(now)
                .build();
        refreshTokenRepository.save(newToken);

        // 3. Sinh Access Token mới
        String newAccessToken = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().name());
        log.info("Đã làm mới token thành công cho tài khoản '{}' (ID={})", user.getEmail(), user.getId());

        return new TokenResponse(
                newAccessToken,
                newRawToken,
                TOKEN_TYPE_BEARER,
                ACCESS_TOKEN_EXPIRATION_SECONDS
        );
    }

    /**
     * Băm chuỗi token bằng SHA-256 phục vụ lưu trữ an toàn (DATA-BE-022, DTD-BE-013).
     */
    public static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
