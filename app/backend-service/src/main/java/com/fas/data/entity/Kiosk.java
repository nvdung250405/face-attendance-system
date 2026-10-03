package com.fas.data.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể Trạm Kiosk (DATA-BE-007 - kiosks).
 */
@Entity
@Table(name = "kiosks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Kiosk {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "location_name", nullable = false, length = 128)
    private String locationName;

    @Column(name = "secret_token_hash", nullable = false, length = 255)
    private String secretTokenHash;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "last_ping_at")
    private Instant lastPingAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
