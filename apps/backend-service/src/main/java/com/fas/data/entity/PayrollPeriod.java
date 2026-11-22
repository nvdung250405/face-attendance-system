package com.fas.data.entity;

import com.fas.data.enums.PayrollPeriodStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể Kỳ công theo tháng (DATA-BE-021 - payroll_periods, DTD-BE-012).
 *
 * <p>Kỳ {@code LOCKED} chặn mọi điều chỉnh công và đơn giải trình thuộc kỳ; chỉ ADMIN mở lại được kèm lý do.
 */
@Entity
@Table(
        name = "payroll_periods",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_payroll_period",
                columnNames = {"period_year", "period_month"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Năm của kỳ công; cột đặt tên `period_year` vì `YEAR` là từ khoá dành riêng của H2. */
    @Column(name = "period_year", nullable = false)
    private Integer periodYear;

    /** Tháng của kỳ công; cột đặt tên `period_month` vì `MONTH` là từ khoá dành riêng của H2. */
    @Column(name = "period_month", nullable = false)
    private Integer periodMonth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private PayrollPeriodStatus status = PayrollPeriodStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locked_by")
    private User lockedBy;

    @Column(name = "locked_at")
    private Instant lockedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unlocked_by")
    private User unlockedBy;

    @Column(name = "unlocked_at")
    private Instant unlockedAt;

    @Column(name = "unlock_reason", length = 500)
    private String unlockReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
