package com.fas.data.entity;

import com.fas.data.enums.NotificationEventType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể Thông báo trong ứng dụng (DATA-BE-023 - notifications, DTD-BE-014).
 *
 * <p>Thông báo chỉ thuộc một người nhận và không có kênh email/SMS trong phạm vi MVP (FR-BE-024).
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 64)
    private NotificationEventType eventType;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 1000)
    private String body;

    /** Loại đối tượng liên quan (ví dụ EXCUSE_REQUEST, PAYROLL_PERIOD) để client mở đúng màn hình. */
    @Column(name = "reference_type", length = 64)
    private String referenceType;

    @Column(name = "reference_id", length = 64)
    private String referenceId;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
