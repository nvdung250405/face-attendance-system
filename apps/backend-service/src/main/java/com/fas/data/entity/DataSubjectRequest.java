package com.fas.data.entity;

import com.fas.data.enums.DataSubjectRequestStatus;
import com.fas.data.enums.DataSubjectRequestType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể Yêu cầu Dữ liệu Cá nhân (DATA-BE-024 - data_subject_requests, DTD-BE-015).
 *
 * <p>Nhân sự gửi yêu cầu truy cập/chỉnh sửa dữ liệu cá nhân; chỉ role {@code DPO} cập nhật trạng thái
 * xử lý và mọi chuyển trạng thái đều sinh thông báo cho người gửi (FR-BE-022).
 */
@Entity
@Table(name = "data_subject_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataSubjectRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 32)
    private DataSubjectRequestType requestType;

    @Column(length = 1000)
    private String detail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private DataSubjectRequestStatus status = DataSubjectRequestStatus.RECEIVED;

    /** Cán bộ Bảo vệ Dữ liệu xử lý yêu cầu. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handled_by")
    private User handledBy;

    @Column(length = 1000)
    private String response;

    @Column(name = "responded_at")
    private Instant respondedAt;

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
