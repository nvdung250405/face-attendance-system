package com.fas.service;

import com.fas.api.dto.request.AdjustAttendanceRequest;
import com.fas.api.dto.request.KioskPunchRequest;
import com.fas.api.dto.response.AttendanceLogItem;
import com.fas.api.dto.response.PunchResult;
import com.fas.api.dto.response.ShiftEvaluationResult;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.websocket.StompEventBroadcaster;
import com.fas.data.cache.CooldownManager;
import com.fas.data.entity.AttendanceLog;
import com.fas.data.entity.Kiosk;
import com.fas.data.entity.Shift;
import com.fas.data.entity.User;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.Role;
import com.fas.data.enums.VerificationMethod;
import com.fas.data.repository.AttendanceLogRepository;
import com.fas.data.repository.KioskRepository;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị cho {@link AttendanceService} (TASK-BE-013, BLD-BE-011, TST-BE-010).
 */
@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private AttendanceLogRepository attendanceLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private KioskRepository kioskRepository;

    @Mock
    private ShiftManagementService shiftManagementService;

    @Mock
    private CooldownManager cooldownManager;

    @Mock
    private StompEventBroadcaster stompEventBroadcaster;

    @InjectMocks
    private AttendanceService attendanceService;

    private User sampleEmployee;
    private Kiosk sampleKiosk;
    private Shift standardShift;

    private final OffsetDateTime sampleTime = OffsetDateTime.of(2026, 10, 8, 8, 5, 0, 0, ZoneOffset.ofHours(7));

    @BeforeEach
    void setUp() {
        sampleEmployee = User.builder()
                .id(1042L)
                .employeeCode("NV-1042")
                .fullName("Ngô Văn Dũng")
                .department("Phòng Kỹ thuật")
                .email("dung@company.com")
                .status(EmployeeStatus.ACTIVE)
                .role(Role.EMPLOYEE)
                .build();

        sampleKiosk = Kiosk.builder()
                .id("KIOSK-HN-01")
                .locationName("Sảnh Tầng 1 - Cửa Chính")
                .secretTokenHash("hashed-token-123")
                .isActive(true)
                .build();

        standardShift = Shift.builder()
                .id(1L)
                .shiftCode("CA-HANH-CHINH")
                .shiftName("Ca Hành Chính Chuẩn")
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(17, 0))
                .gracePeriodMinutes(15)
                .isActive(true)
                .build();
    }

    private KioskPunchRequest createRequest(OffsetDateTime time, String method) {
        return new KioskPunchRequest(
                sampleEmployee.getId(),
                time,
                method,
                BigDecimal.valueOf(0.9234),
                sampleKiosk.getId()
        );
    }

    @Nested
    @DisplayName("1. Ghi nhận CHECK_IN (Lượt đầu tiên trong ngày)")
    class CheckInTests {

        @Test
        @DisplayName("CHECK_IN đúng giờ -> Trạng thái ON_TIME, lateMinutes = 0, phát sóng STOMP")
        void recordPunch_CheckIn_OnTime() {
            KioskPunchRequest req = createRequest(sampleTime, "VERIFICATION_FACE");

            when(kioskRepository.findByIdAndIsActiveTrue(sampleKiosk.getId())).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(sampleEmployee.getId())).thenReturn(Optional.of(sampleEmployee));
            when(cooldownManager.tryAcquire(eq(sampleEmployee.getId()), any(LocalDate.class), any(Instant.class), any(PunchType.class), eq(sampleKiosk.getId())))
                    .thenReturn(true);

            // Chưa có log nào trong ngày -> CHECK_IN
            when(attendanceLogRepository.findFirstByUserIdAndPunchTimestampBetweenOrderByPunchTimestampDesc(eq(sampleEmployee.getId()), any(), any()))
                    .thenReturn(Optional.empty());

            // Ca kíp đánh giá: đúng giờ
            when(shiftManagementService.evaluatePunch(eq(sampleEmployee.getId()), any(LocalDate.class), any(LocalTime.class)))
                    .thenReturn(ShiftEvaluationResult.onTime(1L, "CA-HANH-CHINH", LocalTime.of(8, 0), 15));

            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenAnswer(inv -> {
                AttendanceLog log = inv.getArgument(0);
                log.setId(1001L);
                return log;
            });

            PunchResult result = attendanceService.recordPunch(req);

            assertThat(result).isNotNull();
            assertThat(result.recordId()).isEqualTo(1001L);
            assertThat(result.employeeId()).isEqualTo(sampleEmployee.getId());
            assertThat(result.employeeCode()).isEqualTo("NV-1042");
            assertThat(result.punchType()).isEqualTo(PunchType.CHECK_IN);
            assertThat(result.status()).isEqualTo(AttendanceStatus.ON_TIME);
            assertThat(result.lateMinutes()).isEqualTo(0);

            // Xác nhận lưu CSDL
            ArgumentCaptor<AttendanceLog> logCaptor = ArgumentCaptor.forClass(AttendanceLog.class);
            verify(attendanceLogRepository).save(logCaptor.capture());
            AttendanceLog saved = logCaptor.getValue();
            assertThat(saved.getPunchType()).isEqualTo(PunchType.CHECK_IN);
            assertThat(saved.getStatus()).isEqualTo(AttendanceStatus.ON_TIME);
            assertThat(saved.getLateMinutes()).isEqualTo(0);
            assertThat(saved.getVerificationMethod()).isEqualTo(VerificationMethod.VERIFICATION_FACE);

            // Xác nhận cập nhật Cooldown
            verify(cooldownManager).tryAcquire(eq(sampleEmployee.getId()), any(LocalDate.class), any(Instant.class), eq(PunchType.CHECK_IN), eq(sampleKiosk.getId()));

            // Xác nhận phát sóng STOMP
            verify(stompEventBroadcaster).broadcastAttendancePunch(any(AttendanceLogItem.class));
        }

        @Test
        @DisplayName("CHECK_IN đi muộn -> Trạng thái LATE, tính đúng lateMinutes")
        void recordPunch_CheckIn_Late() {
            OffsetDateTime lateTime = OffsetDateTime.of(2026, 10, 8, 8, 45, 0, 0, ZoneOffset.ofHours(7));
            KioskPunchRequest req = createRequest(lateTime, "VERIFICATION_FACE");

            when(kioskRepository.findByIdAndIsActiveTrue(sampleKiosk.getId())).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(sampleEmployee.getId())).thenReturn(Optional.of(sampleEmployee));
            when(cooldownManager.tryAcquire(any(), any(), any(), any(), any())).thenReturn(true);
            when(attendanceLogRepository.findFirstByUserIdAndPunchTimestampBetweenOrderByPunchTimestampDesc(any(), any(), any()))
                    .thenReturn(Optional.empty());

            // Ca kíp đánh giá: muộn 45 phút
            when(shiftManagementService.evaluatePunch(eq(sampleEmployee.getId()), any(LocalDate.class), any(LocalTime.class)))
                    .thenReturn(ShiftEvaluationResult.late(1L, "CA-HANH-CHINH", 45L, LocalTime.of(8, 0), 15));

            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenAnswer(inv -> {
                AttendanceLog log = inv.getArgument(0);
                log.setId(1002L);
                return log;
            });

            PunchResult result = attendanceService.recordPunch(req);

            assertThat(result.punchType()).isEqualTo(PunchType.CHECK_IN);
            assertThat(result.status()).isEqualTo(AttendanceStatus.LATE);
            assertThat(result.lateMinutes()).isEqualTo(45);
        }

        @Test
        @DisplayName("CHECK_IN nhân viên chưa được phân ca -> Trạng thái ANOMALOUS, lateMinutes = 0")
        void recordPunch_CheckIn_Anomalous() {
            KioskPunchRequest req = createRequest(sampleTime, "VERIFICATION_PIN");

            when(kioskRepository.findByIdAndIsActiveTrue(sampleKiosk.getId())).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(sampleEmployee.getId())).thenReturn(Optional.of(sampleEmployee));
            when(cooldownManager.tryAcquire(any(), any(), any(), any(), any())).thenReturn(true);
            when(attendanceLogRepository.findFirstByUserIdAndPunchTimestampBetweenOrderByPunchTimestampDesc(any(), any(), any()))
                    .thenReturn(Optional.empty());

            when(shiftManagementService.evaluatePunch(eq(sampleEmployee.getId()), any(LocalDate.class), any(LocalTime.class)))
                    .thenReturn(ShiftEvaluationResult.anomalous());

            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenAnswer(inv -> {
                AttendanceLog log = inv.getArgument(0);
                log.setId(1003L);
                return log;
            });

            PunchResult result = attendanceService.recordPunch(req);

            assertThat(result.punchType()).isEqualTo(PunchType.CHECK_IN);
            assertThat(result.status()).isEqualTo(AttendanceStatus.ANOMALOUS);
            assertThat(result.lateMinutes()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("2. Ghi nhận CHECK_OUT (Lượt tiếp theo trong ngày)")
    class CheckOutTests {

        @Test
        @DisplayName("CHECK_OUT sau giờ tan ca -> Trạng thái ON_TIME")
        void recordPunch_CheckOut_OnTime() {
            OffsetDateTime checkOutTime = OffsetDateTime.of(2026, 10, 8, 17, 10, 0, 0, ZoneOffset.ofHours(7));
            KioskPunchRequest req = createRequest(checkOutTime, "VERIFICATION_FACE");

            when(kioskRepository.findByIdAndIsActiveTrue(sampleKiosk.getId())).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(sampleEmployee.getId())).thenReturn(Optional.of(sampleEmployee));
            when(cooldownManager.tryAcquire(any(), any(), any(), any(), any())).thenReturn(true);

            // Đã có 1 log CHECK_IN trước đó
            AttendanceLog previousIn = AttendanceLog.builder()
                    .id(1001L)
                    .punchType(PunchType.CHECK_IN)
                    .punchTimestamp(sampleTime.toInstant())
                    .build();
            when(attendanceLogRepository.findFirstByUserIdAndPunchTimestampBetweenOrderByPunchTimestampDesc(any(), any(), any()))
                    .thenReturn(Optional.of(previousIn));

            // Ca kết thúc lúc 17:00
            when(shiftManagementService.findActiveShiftForUser(eq(sampleEmployee.getId()), any(LocalDate.class)))
                    .thenReturn(Optional.of(standardShift));

            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenAnswer(inv -> {
                AttendanceLog log = inv.getArgument(0);
                log.setId(1004L);
                return log;
            });

            PunchResult result = attendanceService.recordPunch(req);

            assertThat(result.punchType()).isEqualTo(PunchType.CHECK_OUT);
            assertThat(result.status()).isEqualTo(AttendanceStatus.ON_TIME);
            assertThat(result.lateMinutes()).isEqualTo(0);
        }

        @Test
        @DisplayName("CHECK_OUT trước giờ tan ca -> Trạng thái EARLY_LEAVE")
        void recordPunch_CheckOut_EarlyLeave() {
            OffsetDateTime earlyOutTime = OffsetDateTime.of(2026, 10, 8, 16, 30, 0, 0, ZoneOffset.ofHours(7));
            KioskPunchRequest req = createRequest(earlyOutTime, "VERIFICATION_FACE");

            when(kioskRepository.findByIdAndIsActiveTrue(sampleKiosk.getId())).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(sampleEmployee.getId())).thenReturn(Optional.of(sampleEmployee));
            when(cooldownManager.tryAcquire(any(), any(), any(), any(), any())).thenReturn(true);

            AttendanceLog previousIn = AttendanceLog.builder()
                    .id(1001L)
                    .punchType(PunchType.CHECK_IN)
                    .punchTimestamp(sampleTime.toInstant())
                    .build();
            when(attendanceLogRepository.findFirstByUserIdAndPunchTimestampBetweenOrderByPunchTimestampDesc(any(), any(), any()))
                    .thenReturn(Optional.of(previousIn));

            when(shiftManagementService.findActiveShiftForUser(eq(sampleEmployee.getId()), any(LocalDate.class)))
                    .thenReturn(Optional.of(standardShift));

            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenAnswer(inv -> {
                AttendanceLog log = inv.getArgument(0);
                log.setId(1005L);
                return log;
            });

            PunchResult result = attendanceService.recordPunch(req);

            assertThat(result.punchType()).isEqualTo(PunchType.CHECK_OUT);
            assertThat(result.status()).isEqualTo(AttendanceStatus.EARLY_LEAVE);
            assertThat(result.lateMinutes()).isEqualTo(0);
        }

        @Test
        @DisplayName("CHECK_OUT khi chưa được phân ca -> Trạng thái ANOMALOUS")
        void recordPunch_CheckOut_Anomalous() {
            OffsetDateTime outTime = OffsetDateTime.of(2026, 10, 8, 17, 30, 0, 0, ZoneOffset.ofHours(7));
            KioskPunchRequest req = createRequest(outTime, "VERIFICATION_FACE");

            when(kioskRepository.findByIdAndIsActiveTrue(sampleKiosk.getId())).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(sampleEmployee.getId())).thenReturn(Optional.of(sampleEmployee));
            when(cooldownManager.tryAcquire(any(), any(), any(), any(), any())).thenReturn(true);

            AttendanceLog previousIn = AttendanceLog.builder()
                    .id(1001L)
                    .punchType(PunchType.CHECK_IN)
                    .punchTimestamp(sampleTime.toInstant())
                    .build();
            when(attendanceLogRepository.findFirstByUserIdAndPunchTimestampBetweenOrderByPunchTimestampDesc(any(), any(), any()))
                    .thenReturn(Optional.of(previousIn));

            when(shiftManagementService.findActiveShiftForUser(eq(sampleEmployee.getId()), any(LocalDate.class)))
                    .thenReturn(Optional.empty());

            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenAnswer(inv -> {
                AttendanceLog log = inv.getArgument(0);
                log.setId(1006L);
                return log;
            });

            PunchResult result = attendanceService.recordPunch(req);

            assertThat(result.punchType()).isEqualTo(PunchType.CHECK_OUT);
            assertThat(result.status()).isEqualTo(AttendanceStatus.ANOMALOUS);
        }

        @Test
        @DisplayName("Sau CHECK_OUT, lượt quẹt tiếp theo chuyển lại thành CHECK_IN")
        void recordPunch_SubsequentPunch_TogglesTo_CheckIn() {
            OffsetDateTime eveningInTime = OffsetDateTime.of(2026, 10, 8, 18, 0, 0, 0, ZoneOffset.ofHours(7));
            KioskPunchRequest req = createRequest(eveningInTime, "VERIFICATION_FACE");

            when(kioskRepository.findByIdAndIsActiveTrue(sampleKiosk.getId())).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(sampleEmployee.getId())).thenReturn(Optional.of(sampleEmployee));
            when(cooldownManager.tryAcquire(any(), any(), any(), any(), any())).thenReturn(true);

            // Đã có 1 log CHECK_IN và 1 log CHECK_OUT
            AttendanceLog log1 = AttendanceLog.builder().punchType(PunchType.CHECK_IN).punchTimestamp(sampleTime.toInstant()).build();
            AttendanceLog log2 = AttendanceLog.builder().punchType(PunchType.CHECK_OUT).punchTimestamp(eveningInTime.minusMinutes(30).toInstant()).build();
            when(attendanceLogRepository.findFirstByUserIdAndPunchTimestampBetweenOrderByPunchTimestampDesc(any(), any(), any()))
                    .thenReturn(Optional.of(log2));

            when(shiftManagementService.evaluatePunch(eq(sampleEmployee.getId()), any(LocalDate.class), any(LocalTime.class)))
                    .thenReturn(ShiftEvaluationResult.onTime(1L, "CA-HANH-CHINH", LocalTime.of(8, 0), 15));

            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenAnswer(inv -> {
                AttendanceLog log = inv.getArgument(0);
                log.setId(1007L);
                return log;
            });

            PunchResult result = attendanceService.recordPunch(req);

            assertThat(result.punchType()).isEqualTo(PunchType.CHECK_IN);
        }
    }

    @Nested
    @DisplayName("3. Kiểm tra các ngoại lệ & Chặn vi phạm")
    class ValidationAndExceptionTests {

        @Test
        @DisplayName("Trạm Kiosk không tồn tại hoặc inactive -> 401 KIOSK_UNAUTHORIZED")
        void recordPunch_KioskNotFound_Throws401() {
            KioskPunchRequest req = createRequest(sampleTime, "VERIFICATION_FACE");
            when(kioskRepository.findByIdAndIsActiveTrue(sampleKiosk.getId())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> attendanceService.recordPunch(req))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.KIOSK_UNAUTHORIZED));

            verify(attendanceLogRepository, never()).save(any());
        }

        @Test
        @DisplayName("Nhân viên không tồn tại -> 404 EMPLOYEE_NOT_FOUND")
        void recordPunch_EmployeeNotFound_Throws404() {
            KioskPunchRequest req = createRequest(sampleTime, "VERIFICATION_FACE");
            when(kioskRepository.findByIdAndIsActiveTrue(sampleKiosk.getId())).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(sampleEmployee.getId())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> attendanceService.recordPunch(req))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND));

            verify(attendanceLogRepository, never()).save(any());
        }

        @Test
        @DisplayName("Nhân viên đã nghỉ việc (TERMINATED) -> 403 ACCESS_DENIED")
        void recordPunch_EmployeeTerminated_Throws403() {
            sampleEmployee.setStatus(EmployeeStatus.TERMINATED);
            KioskPunchRequest req = createRequest(sampleTime, "VERIFICATION_FACE");

            when(kioskRepository.findByIdAndIsActiveTrue(sampleKiosk.getId())).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(sampleEmployee.getId())).thenReturn(Optional.of(sampleEmployee));

            assertThatThrownBy(() -> attendanceService.recordPunch(req))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.ACCESS_DENIED));

            verify(attendanceLogRepository, never()).save(any());
        }

        @Test
        @DisplayName("Kích hoạt Cooldown 120s -> 409 COOLDOWN_ACTIVE, không chạm CSDL điểm danh")
        void recordPunch_CooldownActive_Throws409() {
            KioskPunchRequest req = createRequest(sampleTime, "VERIFICATION_FACE");

            when(kioskRepository.findByIdAndIsActiveTrue(sampleKiosk.getId())).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(sampleEmployee.getId())).thenReturn(Optional.of(sampleEmployee));
            when(cooldownManager.tryAcquire(eq(sampleEmployee.getId()), any(LocalDate.class), any(Instant.class), any(PunchType.class), eq(sampleKiosk.getId())))
                    .thenReturn(false);

            assertThatThrownBy(() -> attendanceService.recordPunch(req))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.COOLDOWN_ACTIVE));

            verify(attendanceLogRepository, never()).save(any());
            verify(stompEventBroadcaster, never()).broadcastAttendancePunch(any());
        }

        @Test
        @DisplayName("Phương thức xác thực không hợp lệ -> 400 VALIDATION_FAILED")
        void recordPunch_InvalidMethod_Throws400() {
            KioskPunchRequest req = createRequest(sampleTime, "VERIFICATION_FINGERPRINT"); // Không hỗ trợ

            when(kioskRepository.findByIdAndIsActiveTrue(sampleKiosk.getId())).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(sampleEmployee.getId())).thenReturn(Optional.of(sampleEmployee));
            when(cooldownManager.tryAcquire(any(), any(), any(), any(), any())).thenReturn(true);
            when(attendanceLogRepository.findFirstByUserIdAndPunchTimestampBetweenOrderByPunchTimestampDesc(any(), any(), any()))
                    .thenReturn(Optional.empty());
            when(shiftManagementService.evaluatePunch(any(), any(), any()))
                    .thenReturn(ShiftEvaluationResult.onTime(1L, "CA", LocalTime.of(8, 0), 15));

            assertThatThrownBy(() -> attendanceService.recordPunch(req))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));

            verify(attendanceLogRepository, never()).save(any());
        }

        @Test
        @DisplayName("Lỗi STOMP không làm sập giao dịch điểm danh -> Vẫn trả về PunchResult")
        void recordPunch_StompFailure_HandledGracefully() {
            KioskPunchRequest req = createRequest(sampleTime, "VERIFICATION_FACE");

            when(kioskRepository.findByIdAndIsActiveTrue(sampleKiosk.getId())).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(sampleEmployee.getId())).thenReturn(Optional.of(sampleEmployee));
            when(cooldownManager.tryAcquire(any(), any(), any(), any(), any())).thenReturn(true);
            when(attendanceLogRepository.findFirstByUserIdAndPunchTimestampBetweenOrderByPunchTimestampDesc(any(), any(), any()))
                    .thenReturn(Optional.empty());
            when(shiftManagementService.evaluatePunch(any(), any(), any()))
                    .thenReturn(ShiftEvaluationResult.onTime(1L, "CA-HANH-CHINH", LocalTime.of(8, 0), 15));

            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenAnswer(inv -> {
                AttendanceLog log = inv.getArgument(0);
                log.setId(1008L);
                return log;
            });

            doThrow(new RuntimeException("WebSocket broker down"))
                    .when(stompEventBroadcaster).broadcastAttendancePunch(any());

            PunchResult result = attendanceService.recordPunch(req);

            assertThat(result).isNotNull();
            assertThat(result.recordId()).isEqualTo(1008L);
        }
    }

    @Nested
    @DisplayName("Kịch bản điều chỉnh giờ công thủ công (adjustAttendanceLog - FR-BE-008, SOL-BE-007)")
    class AdjustAttendanceLogTests {

        @Test
        @DisplayName("Điều chỉnh giờ công thành công -> Cập nhật các trường và trả về AttendanceLogItem")
        void adjustAttendanceLog_Success() {
            Long logId = 500L;
            AttendanceLog existingLog = AttendanceLog.builder()
                    .id(logId)
                    .user(sampleEmployee)
                    .kiosk(sampleKiosk)
                    .punchTimestamp(sampleTime.toInstant())
                    .punchType(PunchType.CHECK_IN)
                    .verificationMethod(VerificationMethod.VERIFICATION_FACE)
                    .status(AttendanceStatus.LATE)
                    .lateMinutes(25)
                    .build();

            when(attendanceLogRepository.findById(logId)).thenReturn(Optional.of(existingLog));
            when(attendanceLogRepository.save(any(AttendanceLog.class))).thenAnswer(inv -> inv.getArgument(0));

            OffsetDateTime newTimestamp = sampleTime.minusMinutes(25);
            AdjustAttendanceRequest request = new AdjustAttendanceRequest(
                    newTimestamp,
                    AttendanceStatus.ON_TIME,
                    0,
                    "Nhân viên có giải trình được duyệt"
            );

            AttendanceLogItem item = attendanceService.adjustAttendanceLog(logId, request);

            assertThat(item).isNotNull();
            assertThat(item.recordId()).isEqualTo(logId);
            assertThat(item.status()).isEqualTo(AttendanceStatus.ON_TIME);
            assertThat(item.lateMinutes()).isEqualTo(0);

            ArgumentCaptor<AttendanceLog> captor = ArgumentCaptor.forClass(AttendanceLog.class);
            verify(attendanceLogRepository).save(captor.capture());
            AttendanceLog saved = captor.getValue();
            assertThat(saved.getStatus()).isEqualTo(AttendanceStatus.ON_TIME);
            assertThat(saved.getLateMinutes()).isEqualTo(0);
            assertThat(saved.getPunchTimestamp()).isEqualTo(newTimestamp.toInstant());
        }

        @Test
        @DisplayName("Không tìm thấy bản ghi điểm danh -> Ném ApiException RESOURCE_NOT_FOUND")
        void adjustAttendanceLog_NotFound_ThrowsApiException() {
            Long notFoundId = 9999L;
            when(attendanceLogRepository.findById(notFoundId)).thenReturn(Optional.empty());

            AdjustAttendanceRequest request = new AdjustAttendanceRequest(
                    null,
                    AttendanceStatus.ON_TIME,
                    0,
                    "Không tìm thấy log"
            );

            assertThatThrownBy(() -> attendanceService.adjustAttendanceLog(notFoundId, request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.RESOURCE_NOT_FOUND));

            verify(attendanceLogRepository, never()).save(any());
        }
    }
}

