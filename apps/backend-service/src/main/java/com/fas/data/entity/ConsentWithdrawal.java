package com.fas.data.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể Vết rút Informed Consent (DTD-BE-014 - consent_withdrawals, DATA-BE-023).
 *
 * <p>Bản ghi bất biến: lưu thời điểm rút, IP và hạn tiêu hủy dữ liệu sinh trắc (7 ngày) theo FR-BE-022.
 */
@Entity
@Table(name = "consent_withdrawals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsentWithdrawal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "withdrawn_at", nullable = false)
    private Instant withdrawnAt;

    @Column(name = "client_ip", nullable = false, length = 45)
    private String clientIp;

    @Column(name = "biometric_disposal_due_at", nullable = false)
    private Instant biometricDisposalDueAt;

    /** Được đặt khi tác vụ tiêu hủy dữ liệu sinh trắc của nhân sự này đã chạy xong. */
    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (withdrawnAt == null) {
            withdrawnAt = now;
        }
        if (createdAt == null) {
            createdAt = now;
        }
    }
}
