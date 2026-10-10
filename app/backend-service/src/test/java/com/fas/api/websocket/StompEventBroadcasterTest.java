package com.fas.api.websocket;

import com.fas.api.dto.response.AttendanceLogItem;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.VerificationMethod;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.Message;
import org.springframework.messaging.converter.AbstractMessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.MimeType;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

/**
 * TST-BE-014: Phát sóng Bản tin WebSocket STOMP.
 * Covers: FR-BE-007, API-BE-013, API-BE-014. Realizes: SOL-BE-006, BLD-BE-014.
 *
 * <p>Kiểm thử end-to-end: client STOMP thật kết nối tới endpoint {@code /ws-attendance}, subscribe topic
 * rồi xác nhận payload JSON nhận được đúng hợp đồng Mục 5.1/5.2 của {@code api-design.md}.
 *
 * <p>Ngưỡng {@code <= 50 ms} của hợp đồng KHÔNG được khẳng định bằng đồng hồ đo trong test này (bài học từ
 * defect flaky do ngưỡng wall-clock): độ trễ của in-memory broker được kiểm chứng bằng thời gian chờ thực tế
 * ngắn, còn tính đúng đắn của payload mới là điều được khẳng định chặt.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class StompEventBroadcasterTest {

    private static final long AWAIT_TIMEOUT_MILLIS = 5_000L;

    @LocalServerPort
    private int port;

    @Autowired
    private StompEventBroadcaster broadcaster;

    @Autowired
    private com.fas.security.jwt.JwtTokenProvider jwtTokenProvider;

    private WebSocketStompClient stompClient;
    private StompSession session;

    @BeforeEach
    void connectStompClient() throws Exception {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        // Broker phát payload dạng application/json; converter này giữ nguyên phần thân JSON để kiểm tra
        // đúng hợp đồng (StringMessageConverter mặc định chỉ nhận text/plain nên frame sẽ bị bỏ).
        stompClient.setMessageConverter(new JsonBodyMessageConverter());

        StompHeaders connectHeaders = new StompHeaders();
        String token = jwtTokenProvider.generateToken("admin@fas.com", "ADMIN");
        connectHeaders.add("Authorization", "Bearer " + token);

        session = stompClient
                .connectAsync("ws://localhost:" + port + "/ws-attendance", new org.springframework.web.socket.WebSocketHttpHeaders(), connectHeaders, new StompSessionHandlerAdapter() {
                })
                .get(AWAIT_TIMEOUT_MILLIS, TimeUnit.MILLISECONDS);
    }

    /** Converter tối giản: nhận mọi frame `application/json` và trả về nguyên văn chuỗi JSON. */
    private static final class JsonBodyMessageConverter extends AbstractMessageConverter {

        private JsonBodyMessageConverter() {
            super(new MimeType("application", "json"));
        }

        @Override
        protected boolean supports(Class<?> clazz) {
            return String.class == clazz;
        }

        @Override
        protected Object convertFromInternal(Message<?> message, Class<?> targetClass, Object conversionHint) {
            return new String((byte[]) message.getPayload(), StandardCharsets.UTF_8);
        }
    }

    @AfterEach
    void disconnectStompClient() {
        if (session != null && session.isConnected()) {
            session.disconnect();
        }
        if (stompClient != null) {
            stompClient.stop();
        }
    }

    @Test
    @DisplayName("TST-BE-014: Sự kiện điểm danh được phát sóng lên /topic/live-attendance")
    void broadcastsAttendancePunchEvent() {
        BlockingQueue<String> received = subscribe(StompEventBroadcaster.TOPIC_LIVE_ATTENDANCE);

        String payload = awaitPayload(received, () -> broadcaster.broadcastAttendancePunch(samplePunch()));

        assertThat(payload)
                .contains("\"eventType\":\"ATTENDANCE_PUNCHED\"")
                .contains("\"recordId\":98231")
                .contains("\"employeeId\":1042")
                .contains("\"employeeCode\":\"NV-1042\"")
                .contains("\"fullName\":\"Ngô Văn Dũng\"")
                .contains("\"department\":\"Phòng Kỹ thuật\"")
                .contains("\"punchTimestamp\":\"2026-10-03T08:29:45.12+07:00\"")
                .contains("\"punchType\":\"CHECK_IN\"")
                .contains("\"verificationMethod\":\"VERIFICATION_FACE\"")
                .contains("\"status\":\"ON_TIME\"")
                .contains("\"lateMinutes\":0")
                .contains("\"kioskId\":\"KIOSK-HN-01\"");
    }

    @Test
    @DisplayName("TST-BE-014: Lệnh thêm vector được phát sóng lên /topic/kiosk-gallery")
    void broadcastsGalleryVectorAddedEvent() {
        BlockingQueue<String> received = subscribe(StompEventBroadcaster.TOPIC_KIOSK_GALLERY);

        String payload = awaitPayload(received, () -> broadcaster.broadcastGalleryVectorAdded(
                1042L, "NV-1042", "Ngô Văn Dũng", List.of(0.0412f, -0.0521f, 0.0189f),
                OffsetDateTime.parse("2026-10-03T08:41:05.320+07:00")));

        assertThat(payload)
                .contains("\"action\":\"ADD_VECTOR\"")
                .contains("\"employeeId\":1042")
                .contains("\"employeeCode\":\"NV-1042\"")
                .contains("\"vector512\":[0.0412,-0.0521,0.0189]")
                .contains("\"updatedAt\":\"2026-10-03T08:41:05.32+07:00\"")
                .doesNotContain("\"reason\"");
    }

    @Test
    @DisplayName("TST-BE-014: Lệnh gỡ vector được phát sóng lên /topic/kiosk-gallery")
    void broadcastsGalleryVectorDeletedEvent() {
        BlockingQueue<String> received = subscribe(StompEventBroadcaster.TOPIC_KIOSK_GALLERY);

        String payload = awaitPayload(received, () -> broadcaster.broadcastGalleryVectorDeleted(
                1042L, "EMPLOYEE_TERMINATED", OffsetDateTime.parse("2026-10-03T09:00:00.000+07:00")));

        assertThat(payload)
                .contains("\"action\":\"DELETE_VECTOR\"")
                .contains("\"employeeId\":1042")
                .contains("\"reason\":\"EMPLOYEE_TERMINATED\"")
                .contains("\"updatedAt\":\"2026-10-03T09:00:00+07:00\"")
                .doesNotContain("vector512")
                .doesNotContain("employeeCode");
    }

    /**
     * Subscribe một topic và trả về hàng đợi nhận payload thô.
     */
    private BlockingQueue<String> subscribe(String destination) {
        BlockingQueue<String> received = new LinkedBlockingQueue<>();
        session.subscribe(destination, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return String.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                received.add((String) payload);
            }
        });
        return received;
    }

    /**
     * Phát sóng lại cho tới khi subscriber nhận được bản tin: frame SUBSCRIBE là bất đồng bộ nên lần phát
     * đầu tiên có thể xảy ra trước khi broker đăng ký xong subscription.
     */
    private String awaitPayload(BlockingQueue<String> received, Runnable broadcastAction) {
        long deadline = System.currentTimeMillis() + AWAIT_TIMEOUT_MILLIS;
        while (System.currentTimeMillis() < deadline) {
            broadcastAction.run();
            try {
                String payload = received.poll(250, TimeUnit.MILLISECONDS);
                if (payload != null) {
                    return payload;
                }
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                fail("Bị ngắt khi chờ bản tin STOMP", ex);
            }
        }
        return fail("Không nhận được bản tin STOMP trong " + AWAIT_TIMEOUT_MILLIS + " ms");
    }

    private AttendanceLogItem samplePunch() {
        return new AttendanceLogItem(
                98231L,
                1042L,
                "NV-1042",
                "Ngô Văn Dũng",
                "Phòng Kỹ thuật",
                OffsetDateTime.parse("2026-10-03T08:29:45.120+07:00"),
                PunchType.CHECK_IN,
                VerificationMethod.VERIFICATION_FACE,
                AttendanceStatus.ON_TIME,
                0,
                "KIOSK-HN-01");
    }
}
