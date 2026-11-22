package com.fas.data.entity;

import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.VerificationMethod;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể Nhật ký Điểm danh (DATA-BE-004 - attendance_logs).
 */
@Entity
@Table(
        name = "attendance_logs",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_punch_user_time_type",
                        columnNames = {"user_id", "punch_timestamp", "punch_type"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "punch_timestamp", nullable = false)
    private Instant punchTimestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "punch_type", nullable = false, length = 16)
    private PunchType punchType;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_method", nullable = false, length = 32)
    private VerificationMethod verificationMethod;

    @Column(name = "confidence_score", precision = 5, scale = 4)
    private BigDecimal confidenceScore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kiosk_id", nullable = false)
    private Kiosk kiosk;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private AttendanceStatus status = AttendanceStatus.ON_TIME;

    @Column(name = "late_minutes", nullable = false)
    @Builder.Default
    private Integer lateMinutes = 0;

    @Column(name = "is_offline_sync", nullable = false)
    @Builder.Default
    private Boolean isOfflineSync = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
