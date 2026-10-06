package com.fas.api.websocket;

import com.fas.api.dto.event.AttendancePunchEvent;
import com.fas.api.dto.event.GalleryUpdateEvent;
import com.fas.api.dto.response.AttendanceLogItem;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Bộ Phát sóng Sự kiện STOMP (SOL-BE-006, BLD-BE-014, FR-BE-007).
 *
 * <p>Đẩy bản tin JSON tới hai topic nghiệp vụ ngay khi Backend hoàn tất xử lý:
 * <ul>
 *   <li>{@code /topic/live-attendance} — sự kiện điểm danh cho Live Dashboard của Cổng Web.</li>
 *   <li>{@code /topic/kiosk-gallery} — lệnh nạp/gỡ vector cho mọi trạm Kiosk đang trực tuyến.</li>
 * </ul>
 * Các dịch vụ nghiệp vụ gọi lớp này sau khi giao dịch CSDL đã hoàn tất.
 */
@Component
public class StompEventBroadcaster {

    public static final String TOPIC_LIVE_ATTENDANCE = "/topic/live-attendance";
    public static final String TOPIC_KIOSK_GALLERY = "/topic/kiosk-gallery";

    private final SimpMessagingTemplate messagingTemplate;

    public StompEventBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /** Phát sóng một lượt điểm danh vừa được ghi nhận thành công. */
    public void broadcastAttendancePunch(AttendanceLogItem record) {
        messagingTemplate.convertAndSend(TOPIC_LIVE_ATTENDANCE, AttendancePunchEvent.of(record));
    }

    /** Phát sóng lệnh nạp nóng vector của nhân viên mới đăng ký khuôn mặt về các trạm Kiosk. */
    public void broadcastGalleryVectorAdded(
            Long employeeId,
            String employeeCode,
            String fullName,
            List<Float> vector512,
            OffsetDateTime updatedAt) {
        messagingTemplate.convertAndSend(
                TOPIC_KIOSK_GALLERY,
                GalleryUpdateEvent.added(employeeId, employeeCode, fullName, vector512, updatedAt));
    }

    /** Phát sóng lệnh gỡ vector khỏi danh mục RAM của các trạm Kiosk. */
    public void broadcastGalleryVectorDeleted(Long employeeId, String reason, OffsetDateTime updatedAt) {
        messagingTemplate.convertAndSend(
                TOPIC_KIOSK_GALLERY,
                GalleryUpdateEvent.deleted(employeeId, reason, updatedAt));
    }
}
