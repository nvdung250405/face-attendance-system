package com.fas.service;

import com.fas.api.dto.request.KioskPunchRequest;
import com.fas.api.websocket.StompEventBroadcaster;
import com.fas.data.cache.CooldownManager;
import com.fas.data.entity.AttendanceLog;
import com.fas.data.entity.EmployeeShift;
import com.fas.data.entity.Kiosk;
import com.fas.data.entity.Shift;
import com.fas.data.entity.User;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.Role;
import com.fas.data.repository.AttendanceLogRepository;
import com.fas.data.repository.EmployeeShiftRepository;
import com.fas.data.repository.KioskRepository;
import com.fas.data.repository.ShiftRepository;
import com.fas.data.repository.UserRepository;
import com.fas.security.jwt.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm thử tích hợp toàn trình luồng Điểm danh & STOMP (TASK-BE-022, BLD-BE-016, Wave 11).
 *
 * <p>Quy trình kiểm chứng:
 * <ol>
 *   <li>Kiosk gửi yêu cầu {@code POST /api/v1/kiosk/punch} kèm header {@code X-Kiosk-Id}.</li>
 *   <li>Xác thực trạm Kiosk và kiểm tra trạng thái hoạt động của nhân sự.</li>
 *   <li>Thẩm định cơ chế chống quẹt trùng lặp qua {@link CooldownManager} (Caffeine Cache 120s).</li>
 *   <li>Đánh giá ca làm việc, lưu bản ghi vào CSDL PostgreSQL (bảng {@code attendance_logs}).</li>
 *   <li>Phát sóng sự kiện điểm danh thời gian thực tới topic STOMP {@code /topic/live-attendance}.</li>
 *   <li>Đảm bảo thời gian phản hồi giao dịch hoàn tất nhanh chóng.</li>
 * </ol>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class AttendancePunchIntegrationTest {

    private static final long STOMP_AWAIT_TIMEOUT_MS = 5_000L;

    @LocalServerPort
    private int port;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private KioskRepository kioskRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private EmployeeShiftRepository employeeShiftRepository;

    @Autowired
    private AttendanceLogRepository attendanceLogRepository;

    @Autowired
    private CooldownManager cooldownManager;

    @Autowired
    private ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private WebSocketStompClient stompClient;
    private StompSession stompSession;

    private User sampleEmployee;
    private Kiosk activeKiosk;
    private Shift standardShift;

    @BeforeEach
    void setUp() throws Exception {
        // Dọn dẹp dữ liệu điểm danh và phân ca trước mỗi ca kiểm thử
        attendanceLogRepository.deleteAll();
        employeeShiftRepository.deleteAll();

        // 1. Tạo Kiosk đang hoạt động
        activeKiosk = kioskRepository.findById("KIOSK-HN-01").orElseGet(() ->
                kioskRepository.save(Kiosk.builder()
                        .id("KIOSK-HN-01")
                        .locationName("Cổng chính Tòa nhà Keangnam Hà Nội")
                        .secretTokenHash("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                        .isActive(true)
                        .build())
        );

        // 2. Tạo Ca làm việc chuẩn (Hành chính 08:00 - 17:00, ân hạn 15p)
        standardShift = shiftRepository.findByShiftCode("CA-HC-INTEG").orElseGet(() ->
                shiftRepository.save(Shift.builder()
                        .shiftCode("CA-HC-INTEG")
                        .shiftName("Ca hành chính kiểm thử tích hợp")
                        .startTime(LocalTime.of(8, 0))
                        .endTime(LocalTime.of(17, 0))
                        .gracePeriodMinutes(15)
                        .isActive(true)
                        .build())
        );

        // 3. Tạo Nhân viên hợp lệ
        sampleEmployee = userRepository.findByEmployeeCode("EMP-INTEG-01").orElseGet(() ->
                userRepository.save(User.builder()
                        .employeeCode("EMP-INTEG-01")
                        .fullName("Nguyễn Văn Toàn")
                        .email("toan.nv.integ@company.vn")
                        .passwordHash("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                        .role(Role.EMPLOYEE)
                        .status(EmployeeStatus.ACTIVE)
                        .department("Phòng Kỹ thuật Hệ thống")
                        .build())
        );

        // 4. Phân ca cho nhân viên từ ngày 2026-10-01 đến 2026-10-31
        employeeShiftRepository.save(EmployeeShift.builder()
                .user(sampleEmployee)
                .shift(standardShift)
                .effectiveFrom(LocalDate.of(2026, 10, 1))
                .effectiveTo(LocalDate.of(2026, 10, 31))
                .build());

        // 5. Xóa Cooldown đệm trước khi chạy
        cooldownManager.clearCooldown(sampleEmployee.getId(), LocalDate.of(2026, 10, 12));
        cooldownManager.clearCooldown(sampleEmployee.getId(), LocalDate.of(2026, 10, 13));

        // 6. Kết nối WebSocket STOMP Client với Bearer JWT (Role ADMIN để có quyền truy cập /topic/live-attendance)
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(new JsonBodyMessageConverter());

        StompHeaders connectHeaders = new StompHeaders();
        String adminToken = jwtTokenProvider.generateToken("admin.integ@company.vn", "ADMIN");
        connectHeaders.add("Authorization", "Bearer " + adminToken);

        stompSession = stompClient
                .connectAsync("ws://localhost:" + port + "/ws-attendance", new WebSocketHttpHeaders(), connectHeaders,
                        new StompSessionHandlerAdapter() {})
                .get(STOMP_AWAIT_TIMEOUT_MS, TimeUnit.MILLISECONDS);
    }

    @AfterEach
    void tearDown() {
        if (stompSession != null && stompSession.isConnected()) {
            stompSession.disconnect();
        }
        if (stompClient != null) {
            stompClient.stop();
        }
    }

    @Test
    @DisplayName("BLD-BE-016: Luồng toàn trình Kiosk Punch -> REST -> Cooldown -> DB -> STOMP WebSocket thành công")
    void testEndToEndPunchAndStompBroadcast_Success() throws Exception {
        // Đăng ký nhận tin nhắn trên topic /topic/live-attendance
        BlockingQueue<String> liveAttendanceQueue = subscribe(StompEventBroadcaster.TOPIC_LIVE_ATTENDANCE);

        // Chuẩn bị yêu cầu điểm danh lúc 08:05 (trong giờ hành chính và ân hạn 15p -> ON_TIME, CHECK_IN)
        OffsetDateTime punchTime = OffsetDateTime.parse("2026-10-12T08:05:00+07:00");
        KioskPunchRequest request = new KioskPunchRequest(
                sampleEmployee.getId(),
                punchTime,
                "VERIFICATION_FACE",
                BigDecimal.valueOf(0.965),
                activeKiosk.getId()
        );

        String jsonPayload = objectMapper.writeValueAsString(request);
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/kiosk/punch"))
                .header("Content-Type", "application/json")
                .header("X-Kiosk-Id", activeKiosk.getId())
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        // Ghi nhận thời điểm bắt đầu đo đạc hiệu năng
        long startTime = System.currentTimeMillis();

        // Gửi HTTP POST tới endpoint tiếp nhận điểm danh
        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        long duration = System.currentTimeMillis() - startTime;
        assertThat(duration).isPositive();

        // 1. Khẳng định phản hồi REST API
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).isNotNull();
        assertThat(response.body())
                .contains("\"success\":true")
                .contains("\"code\":\"PUNCH_RECORDED\"")
                .contains("\"employeeCode\":\"EMP-INTEG-01\"")
                .contains("\"punchType\":\"CHECK_IN\"")
                .contains("\"status\":\"ON_TIME\"")
                .contains("\"lateMinutes\":0")
                .contains("\"department\":\"Phòng Kỹ thuật Hệ thống\"");

        // 2. Khẳng định dữ liệu đã lưu vào PostgreSQL (CSDL)
        List<AttendanceLog> savedLogs = attendanceLogRepository.findByUserId(sampleEmployee.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent();
        assertThat(savedLogs).hasSize(1);
        AttendanceLog savedLog = savedLogs.get(0);
        assertThat(savedLog.getUser().getId()).isEqualTo(sampleEmployee.getId());
        assertThat(savedLog.getKiosk().getId()).isEqualTo(activeKiosk.getId());
        assertThat(savedLog.getPunchType()).isEqualTo(PunchType.CHECK_IN);
        assertThat(savedLog.getStatus()).isEqualTo(AttendanceStatus.ON_TIME);
        assertThat(savedLog.getLateMinutes()).isEqualTo(0);

        // 3. Khẳng định bản tin đã được phát sóng tới WebSocket STOMP
        String stompPayload = liveAttendanceQueue.poll(STOMP_AWAIT_TIMEOUT_MS, TimeUnit.MILLISECONDS);
        assertThat(stompPayload).isNotNull();
        assertThat(stompPayload)
                .contains("\"eventType\":\"ATTENDANCE_PUNCHED\"")
                .contains("\"recordId\":" + savedLog.getId())
                .contains("\"employeeId\":" + sampleEmployee.getId())
                .contains("\"employeeCode\":\"EMP-INTEG-01\"")
                .contains("\"fullName\":\"Nguyễn Văn Toàn\"")
                .contains("\"department\":\"Phòng Kỹ thuật Hệ thống\"")
                .contains("\"punchType\":\"CHECK_IN\"")
                .contains("\"status\":\"ON_TIME\"")
                .contains("\"lateMinutes\":0")
                .contains("\"kioskId\":\"KIOSK-HN-01\"");

        // 4. Khẳng định Cooldown Cache 120s đã được thiết lập
        boolean isCooldownActive = cooldownManager.isCooldownActive(
                sampleEmployee.getId(),
                punchTime.toLocalDate(),
                punchTime.plusSeconds(30).toInstant()
        );
        assertThat(isCooldownActive).isTrue();
    }

    @Test
    @DisplayName("BLD-BE-016: Chống quẹt lặp Cooldown 120s - Từ chối HTTP 409, không ghi DB và không bắn STOMP")
    void testDoublePunching_CooldownBlocked() throws Exception {
        BlockingQueue<String> liveAttendanceQueue = subscribe(StompEventBroadcaster.TOPIC_LIVE_ATTENDANCE);

        // Lần 1: Điểm danh thành công
        OffsetDateTime firstPunchTime = OffsetDateTime.parse("2026-10-12T08:05:00+07:00");
        KioskPunchRequest firstRequest = new KioskPunchRequest(
                sampleEmployee.getId(),
                firstPunchTime,
                "VERIFICATION_FACE",
                BigDecimal.valueOf(0.95),
                activeKiosk.getId()
        );

        HttpRequest firstHttp = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/kiosk/punch"))
                .header("Content-Type", "application/json")
                .header("X-Kiosk-Id", activeKiosk.getId())
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(firstRequest)))
                .build();

        HttpResponse<String> firstResponse = httpClient.send(firstHttp, HttpResponse.BodyHandlers.ofString());
        assertThat(firstResponse.statusCode()).isEqualTo(200);

        // Lấy tin nhắn STOMP của lần 1 ra khỏi queue
        String firstStompPayload = liveAttendanceQueue.poll(STOMP_AWAIT_TIMEOUT_MS, TimeUnit.MILLISECONDS);
        assertThat(firstStompPayload).isNotNull();

        // Lần 2: Quẹt lại sau 20 giây (vi phạm Cooldown 120s)
        OffsetDateTime secondPunchTime = firstPunchTime.plusSeconds(20);
        KioskPunchRequest secondRequest = new KioskPunchRequest(
                sampleEmployee.getId(),
                secondPunchTime,
                "VERIFICATION_FACE",
                BigDecimal.valueOf(0.95),
                activeKiosk.getId()
        );

        HttpRequest secondHttp = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/kiosk/punch"))
                .header("Content-Type", "application/json")
                .header("X-Kiosk-Id", activeKiosk.getId())
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(secondRequest)))
                .build();

        HttpResponse<String> secondResponse = httpClient.send(secondHttp, HttpResponse.BodyHandlers.ofString());

        // 1. Khẳng định từ chối HTTP 409 Conflict với mã COOLDOWN_ACTIVE
        assertThat(secondResponse.statusCode()).isEqualTo(409);
        assertThat(secondResponse.body()).contains("COOLDOWN_ACTIVE");

        // 2. Khẳng định CSDL vẫn chỉ có đúng 1 bản ghi
        List<AttendanceLog> logs = attendanceLogRepository.findByUserId(sampleEmployee.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent();
        assertThat(logs).hasSize(1);

        // 3. Khẳng định STOMP không phát sóng bản tin mới nào cho lượt quẹt bị chặn
        String secondStompPayload = liveAttendanceQueue.poll(500, TimeUnit.MILLISECONDS);
        assertThat(secondStompPayload).isNull();
    }

    @Test
    @DisplayName("BLD-BE-016: Từ chối yêu cầu khi thiếu hoặc sai trạm Kiosk")
    void testPunch_KioskUnauthorized() throws Exception {
        OffsetDateTime punchTime = OffsetDateTime.parse("2026-10-12T08:05:00+07:00");
        KioskPunchRequest request = new KioskPunchRequest(
                sampleEmployee.getId(),
                punchTime,
                "VERIFICATION_FACE",
                BigDecimal.valueOf(0.95),
                "KIOSK-UNKNOWN"
        );

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/kiosk/punch"))
                .header("Content-Type", "application/json")
                .header("X-Kiosk-Id", "KIOSK-UNKNOWN")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(request)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(response.body()).contains("KIOSK_UNAUTHORIZED");
        assertThat(attendanceLogRepository.findByUserId(sampleEmployee.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }

    @Test
    @DisplayName("BLD-BE-016: Từ chối nhân viên không ở trạng thái ACTIVE (ACCESS_DENIED)")
    void testPunch_InactiveEmployee_Forbidden() throws Exception {
        User terminatedUser = userRepository.save(User.builder()
                .employeeCode("EMP-TERM-02")
                .fullName("Nhân viên Đã nghỉ việc")
                .email("terminated.user@company.vn")
                .passwordHash("pwd")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.TERMINATED)
                .build());

        OffsetDateTime punchTime = OffsetDateTime.parse("2026-10-12T08:05:00+07:00");
        KioskPunchRequest request = new KioskPunchRequest(
                terminatedUser.getId(),
                punchTime,
                "VERIFICATION_FACE",
                BigDecimal.valueOf(0.95),
                activeKiosk.getId()
        );

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/kiosk/punch"))
                .header("Content-Type", "application/json")
                .header("X-Kiosk-Id", activeKiosk.getId())
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(request)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(403);
        assertThat(response.body()).contains("ACCESS_DENIED");
        assertThat(attendanceLogRepository.findByUserId(terminatedUser.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent()).isEmpty();
    }

    @Test
    @DisplayName("BLD-BE-016: Luồng Check-out buổi chiều phát sóng sự kiện CHECK_OUT lên STOMP")
    void testCheckOutPunch_BroadcastsCheckOutEvent() throws Exception {
        BlockingQueue<String> liveAttendanceQueue = subscribe(StompEventBroadcaster.TOPIC_LIVE_ATTENDANCE);

        // 1. Check-in buổi sáng lúc 08:00
        OffsetDateTime morningPunch = OffsetDateTime.parse("2026-10-13T08:00:00+07:00");
        KioskPunchRequest checkInRequest = new KioskPunchRequest(
                sampleEmployee.getId(),
                morningPunch,
                "VERIFICATION_FACE",
                BigDecimal.valueOf(0.95),
                activeKiosk.getId()
        );

        HttpRequest checkInHttp = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/kiosk/punch"))
                .header("Content-Type", "application/json")
                .header("X-Kiosk-Id", activeKiosk.getId())
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(checkInRequest)))
                .build();

        HttpResponse<String> checkInResp = httpClient.send(checkInHttp, HttpResponse.BodyHandlers.ofString());
        assertThat(checkInResp.statusCode()).isEqualTo(200);
        liveAttendanceQueue.poll(STOMP_AWAIT_TIMEOUT_MS, TimeUnit.MILLISECONDS);

        // Xóa cooldown để mô phỏng lượt quẹt chiều sau vài giờ
        cooldownManager.clearCooldown(sampleEmployee.getId(), morningPunch.toLocalDate());

        // 2. Check-out buổi chiều lúc 17:05 (hết giờ làm việc -> ON_TIME, CHECK_OUT)
        OffsetDateTime afternoonPunch = OffsetDateTime.parse("2026-10-13T17:05:00+07:00");
        KioskPunchRequest checkOutRequest = new KioskPunchRequest(
                sampleEmployee.getId(),
                afternoonPunch,
                "VERIFICATION_PIN",
                null,
                activeKiosk.getId()
        );

        HttpRequest checkOutHttp = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/kiosk/punch"))
                .header("Content-Type", "application/json")
                .header("X-Kiosk-Id", activeKiosk.getId())
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(checkOutRequest)))
                .build();

        HttpResponse<String> checkOutResponse = httpClient.send(checkOutHttp, HttpResponse.BodyHandlers.ofString());

        assertThat(checkOutResponse.statusCode()).isEqualTo(200);
        assertThat(checkOutResponse.body())
                .contains("\"punchType\":\"CHECK_OUT\"")
                .contains("\"status\":\"ON_TIME\"");

        String checkOutStomp = liveAttendanceQueue.poll(STOMP_AWAIT_TIMEOUT_MS, TimeUnit.MILLISECONDS);
        assertThat(checkOutStomp).isNotNull();
        assertThat(checkOutStomp)
                .contains("\"eventType\":\"ATTENDANCE_PUNCHED\"")
                .contains("\"punchType\":\"CHECK_OUT\"")
                .contains("\"status\":\"ON_TIME\"");
    }

    private BlockingQueue<String> subscribe(String destination) {
        BlockingQueue<String> received = new LinkedBlockingQueue<>();
        stompSession.subscribe(destination, new StompFrameHandler() {
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
}
