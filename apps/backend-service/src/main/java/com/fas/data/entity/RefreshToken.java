package com.fas.data.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể Phiên làm việc (DATA-BE-022 - refresh_tokens, DTD-BE-013).
 *
 * <p>Giá trị token chỉ lưu dạng băm một chiều; thu hồi theo tài khoản khi đổi/cấp lại mật khẩu hoặc
 * tài khoản bị vô hiệu hóa (FR-BE-020, DD-BE-023).
 */
@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, unique = true, length = 255)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "client_ip", length = 45)
    private String clientIp;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    /** Token còn hiệu lực khi chưa bị thu hồi và chưa hết hạn. */
    public boolean isUsable(Instant now) {
        return revokedAt == null && expiresAt.isAfter(now);
    }
}
