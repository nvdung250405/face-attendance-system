package com.fas.data.entity;

import com.fas.data.enums.ExcuseRequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể Đơn giải trình công (DATA-BE-018 - excuse_requests, DTD-BE-009).
 *
 * <p>Đơn do nhân viên nộp cho một lượt chấm cụ thể (trong vòng 30 ngày) và được HR duyệt hoặc từ chối;
 * khi duyệt, dịch vụ xử lý sẽ điều chỉnh bản ghi điểm danh liên quan trong cùng giao dịch (FR-BE-014, FR-BE-015).
 */
@Entity
@Table(name = "excuse_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExcuseRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Bản ghi điểm danh mà đơn xin điều chỉnh; null khi đơn không gắn với lượt chấm nào. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_log_id")
    private AttendanceLog attendanceLog;

    @Column(nullable = false, length = 500)
    private String reason;

    /** Mốc thời gian điều chỉnh đề nghị (nhân viên nhập khi lượt chấm bị sai hoặc bị thiếu). */
    @Column(name = "requested_punch_timestamp")
    private Instant requestedPunchTimestamp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private ExcuseRequestStatus status = ExcuseRequestStatus.PENDING;

    /** Người quyết định (HR/ADMIN); null khi đơn còn chờ xử lý. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by")
    private User decidedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

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
