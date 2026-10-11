package com.fas.service;

import com.fas.api.dto.request.KioskSyncBatchRequest;
import com.fas.api.dto.request.OfflinePunchRecord;
import com.fas.api.dto.response.BatchSyncResult;
import com.fas.api.dto.response.ShiftEvaluationResult;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.AttendanceLog;
import com.fas.data.entity.Kiosk;
import com.fas.data.entity.Shift;
import com.fas.data.entity.User;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.Role;
import com.fas.data.repository.AttendanceLogRepository;
import com.fas.data.repository.KioskRepository;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Bộ kiểm thử đơn vị cho {@link OfflineBatchSyncService} (TASK-BE-014, BLD-BE-012, TST-BE-011, SOL-BE-003, FR-BE-003).
 */
@ExtendWith(MockitoExtension.class)
class OfflineBatchSyncServiceTest {

    @Mock
    private AttendanceLogRepository attendanceLogRepository;

    @Mock
    private KioskRepository kioskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ShiftManagementService shiftManagementService;

    private final Instant fixedInstant = Instant.parse("2026-10-11T10:00:00Z");
    private final Clock fixedClock = Clock.fixed(fixedInstant, ZoneId.of("UTC"));

    private OfflineBatchSyncService batchSyncService;

    private Kiosk sampleKiosk;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        batchSyncService = new OfflineBatchSyncService(
                attendanceLogRepository,
                kioskRepository,
                userRepository,
                shiftManagementService,
                fixedClock
        );

        sampleKiosk = Kiosk.builder()
                .id("KIOSK-01")
                .locationName("Cổng chính tòa nhà A")
                .secretTokenHash("hashed-token-123")
                .isActive(true)
                .build();

        sampleUser = User.builder()
                .id(100L)
                .employeeCode("NV-1042")
                .fullName("Nguyễn Văn A")
                .email("nva@fas.com")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build();
    }

    @Nested
    @DisplayName("1. Thẩm định yêu cầu & tính hợp lệ của trạm Kiosk")
    class ValidationAndKioskTests {

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED khi request null hoặc kioskId rỗng")
        void validate_nullOrEmptyRequest_throwsException() {
            assertThatThrownBy(() -> batchSyncService.processOfflineBatch(null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));

            KioskSyncBatchRequest emptyKioskIdReq = new KioskSyncBatchRequest("", 1, List.of(createRecord(1L, 100L, 8, 0)));
            assertThatThrownBy(() -> batchSyncService.processOfflineBatch(emptyKioskIdReq))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));
        }

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED khi records rỗng hoặc vượt quá 50 phần tử")
        void validate_invalidRecordsSize_throwsException() {
            KioskSyncBatchRequest emptyRecordsReq = new KioskSyncBatchRequest("KIOSK-01", 0, Collections.emptyList());
            assertThatThrownBy(() -> batchSyncService.processOfflineBatch(emptyRecordsReq))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));

            List<OfflinePunchRecord> over50Records = new ArrayList<>();
            for (long i = 1; i <= 51; i++) {
                over50Records.add(createRecord(i, 100L, 8, 0));
            }
            KioskSyncBatchRequest over50Req = new KioskSyncBatchRequest("KIOSK-01", 51, over50Records);
            assertThatThrownBy(() -> batchSyncService.processOfflineBatch(over50Req))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));
        }

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED khi batchSize không khớp records.size()")
        void validate_mismatchedBatchSize_throwsException() {
            KioskSyncBatchRequest mismatchedReq = new KioskSyncBatchRequest("KIOSK-01", 5, List.of(createRecord(1L, 100L, 8, 0)));
            assertThatThrownBy(() -> batchSyncService.processOfflineBatch(mismatchedReq))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));
        }

        @Test
        @DisplayName("Ném lỗi KIOSK_NOT_FOUND khi trạm Kiosk không tồn tại trong CSDL")
        void kiosk_notFound_throwsException() {
            when(kioskRepository.findById("KIOSK-99")).thenReturn(Optional.empty());

            KioskSyncBatchRequest req = new KioskSyncBatchRequest("KIOSK-99", 1, List.of(createRecord(1L, 100L, 8, 0)));
            assertThatThrownBy(() -> batchSyncService.processOfflineBatch(req))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.KIOSK_NOT_FOUND));
        }

        @Test
        @DisplayName("Ném lỗi KIOSK_UNAUTHORIZED khi trạm Kiosk đã bị vô hiệu hóa")
        void kiosk_inactive_throwsException() {
            sampleKiosk.setIsActive(false);
            when(kioskRepository.findById("KIOSK-01")).thenReturn(Optional.of(sampleKiosk));

            KioskSyncBatchRequest req = new KioskSyncBatchRequest("KIOSK-01", 1, List.of(createRecord(1L, 100L, 8, 0)));
            assertThatThrownBy(() -> batchSyncService.processOfflineBatch(req))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.KIOSK_UNAUTHORIZED));
        }

        @Test
        @DisplayName("Cập nhật lastPingAt cho trạm Kiosk khi đồng bộ")
        void kiosk_updatesLastPingAt() {
            when(kioskRepository.findById("KIOSK-01")).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
            when(attendanceLogRepository.findByUserIdAndPunchTimestampBetween(eq(100L), any(), any(), any()))
                    .thenReturn(new PageImpl<>(Collections.emptyList()));
            when(shiftManagementService.evaluatePunch(any(), any(), any()))
                    .thenReturn(ShiftEvaluationResult.onTime(1L, "CA-HC", LocalTime.of(8, 0), 15));

            KioskSyncBatchRequest req = new KioskSyncBatchRequest("KIOSK-01", 1, List.of(createRecord(1L, 100L, 8, 0)));
            batchSyncService.processOfflineBatch(req);

            assertThat(sampleKiosk.getLastPingAt()).isEqualTo(fixedInstant);
            verify(kioskRepository).save(sampleKiosk);
        }
    }

    @Nested
    @DisplayName("2. Xử lý đồng bộ bù lô tối đa 50 bản ghi thành công 100% (TST-BE-011)")
    class BatchSyncFullSuccessTests {

        @Test
        @DisplayName("Tiếp nhận gói 50 bản ghi ngoại tuyến và lưu thành công 100% vào CSDL")
        void processOfflineBatch_fiftyRecords_success() {
            when(kioskRepository.findById("KIOSK-01")).thenReturn(Optional.of(sampleKiosk));

            List<OfflinePunchRecord> fiftyRecords = new ArrayList<>();
            for (long i = 1; i <= 50; i++) {
                User user = User.builder().id(i).employeeCode("NV-" + i).status(EmployeeStatus.ACTIVE).build();
                when(userRepository.findById(i)).thenReturn(Optional.of(user));
                when(attendanceLogRepository.findByUserIdAndPunchTimestampBetween(eq(i), any(), any(), any()))
                        .thenReturn(new PageImpl<>(Collections.emptyList()));
                when(shiftManagementService.evaluatePunch(eq(i), any(), any()))
                        .thenReturn(ShiftEvaluationResult.onTime(1L, "CA-HC", LocalTime.of(8, 0), 15));

                fiftyRecords.add(createRecord(i, i, 8, 0));
            }

            when(attendanceLogRepository.batchInsertOfflineLogs(anyList())).thenReturn(50);

            KioskSyncBatchRequest request = new KioskSyncBatchRequest("KIOSK-01", 50, fiftyRecords);
            BatchSyncResult result = batchSyncService.processOfflineBatch(request);

            assertThat(result).isNotNull();
            assertThat(result.syncedCount()).isEqualTo(50);
            assertThat(result.syncedLocalIds()).hasSize(50);
            assertThat(result.failedLocalIds()).isEmpty();

            // Kiểm tra các trường dữ liệu được gán vào AttendanceLog
            @SuppressWarnings("unchecked")
            ArgumentCaptor<List<AttendanceLog>> captor = ArgumentCaptor.forClass(List.class);
            verify(attendanceLogRepository).batchInsertOfflineLogs(captor.capture());

            List<AttendanceLog> savedLogs = captor.getValue();
            assertThat(savedLogs).hasSize(50);
            assertThat(savedLogs.get(0).getIsOfflineSync()).isTrue();
            assertThat(savedLogs.get(0).getKiosk().getId()).isEqualTo("KIOSK-01");
            assertThat(savedLogs.get(0).getCreatedAt()).isEqualTo(fixedInstant);
        }
    }

    @Nested
    @DisplayName("3. Xử lý Idempotency chống trùng lặp & lọc nhân sự không hợp lệ")
    class IdempotencyAndInvalidUserTests {

        @Test
        @DisplayName("Bỏ qua bản ghi trùng lặp khóa tự nhiên (user_id, punch_timestamp, punch_type) và đưa vào failedLocalIds")
        void processOfflineBatch_duplicateRecord_skipped() {
            when(kioskRepository.findById("KIOSK-01")).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
            when(attendanceLogRepository.findByUserIdAndPunchTimestampBetween(eq(100L), any(), any(), any()))
                    .thenReturn(new PageImpl<>(Collections.emptyList()));

            // Giả lập bản ghi localQueueId = 1 đã tồn tại trong CSDL
            when(attendanceLogRepository.existsByUserIdAndPunchTimestampAndPunchType(eq(100L), any(), eq(PunchType.CHECK_IN)))
                    .thenReturn(true);

            OfflinePunchRecord duplicateRecord = createRecord(1L, 100L, 8, 0);
            KioskSyncBatchRequest request = new KioskSyncBatchRequest("KIOSK-01", 1, List.of(duplicateRecord));

            BatchSyncResult result = batchSyncService.processOfflineBatch(request);

            assertThat(result.syncedCount()).isEqualTo(0);
            assertThat(result.syncedLocalIds()).isEmpty();
            assertThat(result.failedLocalIds()).containsExactly(1L);
            verify(attendanceLogRepository, never()).batchInsertOfflineLogs(anyList());
        }

        @Test
        @DisplayName("Bỏ qua bản ghi của nhân viên đã thôi việc (TERMINATED) hoặc không tồn tại")
        void processOfflineBatch_terminatedOrNonExistentUser_skipped() {
            when(kioskRepository.findById("KIOSK-01")).thenReturn(Optional.of(sampleKiosk));

            // User 100L: TERMINATED
            User terminatedUser = User.builder().id(100L).status(EmployeeStatus.TERMINATED).build();
            when(userRepository.findById(100L)).thenReturn(Optional.of(terminatedUser));

            // User 200L: không tồn tại
            when(userRepository.findById(200L)).thenReturn(Optional.empty());

            // User 300L: ACTIVE hợp lệ
            User activeUser = User.builder().id(300L).status(EmployeeStatus.ACTIVE).build();
            when(userRepository.findById(300L)).thenReturn(Optional.of(activeUser));
            when(attendanceLogRepository.findByUserIdAndPunchTimestampBetween(eq(300L), any(), any(), any()))
                    .thenReturn(new PageImpl<>(Collections.emptyList()));
            when(shiftManagementService.evaluatePunch(eq(300L), any(), any()))
                    .thenReturn(ShiftEvaluationResult.onTime(1L, "CA-HC", LocalTime.of(8, 0), 15));

            OfflinePunchRecord rec1 = createRecord(1L, 100L, 8, 0);
            OfflinePunchRecord rec2 = createRecord(2L, 200L, 8, 5);
            OfflinePunchRecord rec3 = createRecord(3L, 300L, 8, 10);

            KioskSyncBatchRequest request = new KioskSyncBatchRequest("KIOSK-01", 3, List.of(rec1, rec2, rec3));
            BatchSyncResult result = batchSyncService.processOfflineBatch(request);

            assertThat(result.syncedCount()).isEqualTo(1);
            assertThat(result.syncedLocalIds()).containsExactly(3L);
            assertThat(result.failedLocalIds()).containsExactly(1L, 2L);
        }
    }

    @Nested
    @DisplayName("4. Xác định PunchType tuần tự và đánh giá ca kíp trong cùng lô")
    class SequentialPunchTypeTests {

        @Test
        @DisplayName("Hai lượt quẹt trong ngày của cùng một nhân viên được xác định lần lượt CHECK_IN và CHECK_OUT")
        void processOfflineBatch_sameUserMultiplePunches_sequentialTypes() {
            when(kioskRepository.findById("KIOSK-01")).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));

            // Lượt quẹt ban đầu chưa có gì trong ngày -> CHECK_IN
            when(attendanceLogRepository.findByUserIdAndPunchTimestampBetween(eq(100L), any(), any(), any()))
                    .thenReturn(new PageImpl<>(Collections.emptyList()));

            when(shiftManagementService.evaluatePunch(eq(100L), any(), eq(LocalTime.of(8, 0))))
                    .thenReturn(ShiftEvaluationResult.onTime(1L, "CA-HC", LocalTime.of(8, 0), 15));

            Shift activeShift = Shift.builder()
                    .id(1L)
                    .shiftCode("CA-HC")
                    .startTime(LocalTime.of(8, 0))
                    .endTime(LocalTime.of(17, 0))
                    .build();
            when(shiftManagementService.findActiveShiftForUser(eq(100L), any()))
                    .thenReturn(Optional.of(activeShift));

            // Bản ghi 1 lúc 08:00 (Check in), bản ghi 2 lúc 17:05 (Check out)
            OfflinePunchRecord punchMorning = createRecord(101L, 100L, 8, 0);
            OfflinePunchRecord punchEvening = createRecord(102L, 100L, 17, 5);

            KioskSyncBatchRequest request = new KioskSyncBatchRequest("KIOSK-01", 2, List.of(punchMorning, punchEvening));
            BatchSyncResult result = batchSyncService.processOfflineBatch(request);

            assertThat(result.syncedCount()).isEqualTo(2);

            @SuppressWarnings("unchecked")
            ArgumentCaptor<List<AttendanceLog>> captor = ArgumentCaptor.forClass(List.class);
            verify(attendanceLogRepository).batchInsertOfflineLogs(captor.capture());

            List<AttendanceLog> savedLogs = captor.getValue();
            assertThat(savedLogs).hasSize(2);
            assertThat(savedLogs.get(0).getPunchType()).isEqualTo(PunchType.CHECK_IN);
            assertThat(savedLogs.get(0).getStatus()).isEqualTo(AttendanceStatus.ON_TIME);
            assertThat(savedLogs.get(1).getPunchType()).isEqualTo(PunchType.CHECK_OUT);
            assertThat(savedLogs.get(1).getStatus()).isEqualTo(AttendanceStatus.ON_TIME);
        }

        @Test
        @DisplayName("CHECK_OUT về sớm trước giờ kết thúc ca được gán trạng thái EARLY_LEAVE")
        void processOfflineBatch_checkOutEarly_assignedEarlyLeave() {
            when(kioskRepository.findById("KIOSK-01")).thenReturn(Optional.of(sampleKiosk));
            when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));

            // Đã có bản ghi CHECK_IN trong ngày -> lượt tiếp theo là CHECK_OUT
            AttendanceLog checkInLog = AttendanceLog.builder().punchType(PunchType.CHECK_IN).build();
            when(attendanceLogRepository.findByUserIdAndPunchTimestampBetween(eq(100L), any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of(checkInLog)));

            Shift activeShift = Shift.builder()
                    .startTime(LocalTime.of(8, 0))
                    .endTime(LocalTime.of(17, 0))
                    .build();
            when(shiftManagementService.findActiveShiftForUser(eq(100L), any()))
                    .thenReturn(Optional.of(activeShift));

            // Quẹt ra lúc 16:30 (sớm hơn 17:00)
            OfflinePunchRecord punchEarly = createRecord(105L, 100L, 16, 30);
            KioskSyncBatchRequest request = new KioskSyncBatchRequest("KIOSK-01", 1, List.of(punchEarly));

            BatchSyncResult result = batchSyncService.processOfflineBatch(request);

            assertThat(result.syncedCount()).isEqualTo(1);

            @SuppressWarnings("unchecked")
            ArgumentCaptor<List<AttendanceLog>> captor = ArgumentCaptor.forClass(List.class);
            verify(attendanceLogRepository).batchInsertOfflineLogs(captor.capture());

            AttendanceLog savedLog = captor.getValue().get(0);
            assertThat(savedLog.getPunchType()).isEqualTo(PunchType.CHECK_OUT);
            assertThat(savedLog.getStatus()).isEqualTo(AttendanceStatus.EARLY_LEAVE);
        }
    }

    private OfflinePunchRecord createRecord(Long localQueueId, Long employeeId, int hour, int minute) {
        OffsetDateTime timestamp = OffsetDateTime.of(
                LocalDate.of(2026, 10, 11),
                LocalTime.of(hour, minute),
                ZoneOffset.ofHours(7)
        );
        return new OfflinePunchRecord(
                localQueueId,
                employeeId,
                timestamp,
                "VERIFICATION_FACE",
                BigDecimal.valueOf(0.9234)
        );
    }
}
