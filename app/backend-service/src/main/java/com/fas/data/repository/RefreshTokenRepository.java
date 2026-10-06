package com.fas.data.repository;

import com.fas.data.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository cho thực thể RefreshToken (DATA-BE-022 - refresh_tokens).
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /** Các phiên còn hiệu lực của một tài khoản (dùng cho thu hồi theo tài khoản, FR-BE-020). */
    List<RefreshToken> findByUserIdAndRevokedAtIsNull(Long userId);

    long countByUserIdAndRevokedAtIsNull(Long userId);

    /** Dọn các phiên đã hết hạn trước một mốc thời gian. */
    List<RefreshToken> findByExpiresAtBefore(Instant threshold);
}
