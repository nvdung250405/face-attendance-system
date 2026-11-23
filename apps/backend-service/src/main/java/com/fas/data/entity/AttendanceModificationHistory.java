package com.fas.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Thực thể Lịch sử Điều chỉnh Điểm danh Append-Only (FINDING-BE-DOM-005, BIZ-005).
 */
@Entity
@Table(name = "attendance_modification_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceModificationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attendance_log_id", nullable = false)
    private Long attendanceLogId;

    @Column(name = "original_timestamp")
    private Instant originalTimestamp;

    @Column(name = "updated_timestamp")
    private Instant updatedTimestamp;

    @Column(name = "original_status", length = 32)
    private String originalStatus;

    @Column(name = "updated_status", length = 32)
    private String updatedStatus;

    @Column(name = "modified_by", nullable = false, length = 64)
    private String modifiedBy;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
