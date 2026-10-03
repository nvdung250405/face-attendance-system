package com.fas.data.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể Mẫu Sinh trắc học Mã hóa (DATA-BE-005 - biometric_templates).
 */
@Entity
@Table(name = "biometric_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiometricTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "encrypted_vector", nullable = false)
    private byte[] encryptedVector;

    @Column(name = "encryption_iv", nullable = false)
    private byte[] encryptionIv;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String algorithm = "ARCFACE_512D";

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
