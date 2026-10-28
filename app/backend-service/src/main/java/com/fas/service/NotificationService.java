package com.fas.service;

import com.fas.api.dto.response.NotificationResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.Notification;
import com.fas.data.entity.User;
import com.fas.data.enums.NotificationEventType;
import com.fas.data.repository.NotificationRepository;
import com.fas.data.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

/**
 * Dịch vụ Thông báo Trong ứng dụng (SOL-BE-027, FR-BE-024, DATA-BE-023).
 *
 * <p>Quy tắc:
 * <ul>
 *   <li>Sinh thông báo theo sự kiện vòng đời và phục vụ truy vấn cho đúng người nhận.</li>
 *   <li>Không gửi email/SMS trong phạm vi MVP.</li>
 * </ul>
 */
@Slf4j
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this(notificationRepository, userRepository, Clock.systemDefaultZone());
    }

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository, Clock clock) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    /**
     * Sinh thông báo trong ứng dụng cho một người nhận.
     */
    @Transactional
    public NotificationResponse createNotification(
            Long userId,
            NotificationEventType eventType,
            String title,
            String body,
            String referenceType,
            String referenceId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy người nhận ID=" + userId));

        Notification notification = Notification.builder()
                .user(user)
                .eventType(eventType)
                .title(title != null && title.length() > 255 ? title.substring(0, 252) + "..." : title)
                .body(body != null && body.length() > 1000 ? body.substring(0, 997) + "..." : body)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .readAt(null)
                .createdAt(clock.instant())
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Đã tạo thông báo ID={} cho nhân viên ID={} (event={})", saved.getId(), userId, eventType);
        return NotificationResponse.fromEntity(saved);
    }

    /**
     * Tra cứu danh sách thông báo của chính nhân viên.
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(Long userId, Pageable pageable) {
        if (!userRepository.existsById(userId)) {
            throw new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên ID=" + userId);
        }
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationResponse::fromEntity);
    }

    /**
     * Đếm số lượng thông báo chưa đọc của nhân viên.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên ID=" + userId);
        }
        return notificationRepository.countByUserIdAndReadAtIsNull(userId);
    }

    /**
     * Đánh dấu một thông báo đã đọc.
     */
    @Transactional
    public NotificationResponse markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy thông báo ID=" + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Thông báo không thuộc về nhân viên ID=" + userId);
        }

        if (notification.getReadAt() == null) {
            notification.setReadAt(clock.instant());
            notification = notificationRepository.save(notification);
        }

        return NotificationResponse.fromEntity(notification);
    }

    /**
     * Đánh dấu tất cả thông báo của nhân viên đã đọc.
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên ID=" + userId);
        }
        Page<Notification> unreadPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, Pageable.unpaged());
        Instant now = clock.instant();
        List<Notification> unreadList = unreadPage.getContent().stream()
                .filter(n -> n.getReadAt() == null)
                .peek(n -> n.setReadAt(now))
                .toList();

        if (!unreadList.isEmpty()) {
            notificationRepository.saveAll(unreadList);
        }
    }
}
