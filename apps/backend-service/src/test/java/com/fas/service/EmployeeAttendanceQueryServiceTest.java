package com.fas.service;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.response.AttendanceLogItem;
import com.fas.api.dto.response.DailyAttendanceItem;
import com.fas.api.dto.response.PersonalAttendanceResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.AttendanceLog;
import com.fas.data.entity.Kiosk;
import com.fas.data.entity.User;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.Role;
import com.fas.data.enums.VerificationMethod;
import com.fas.data.repository.AttendanceLogRepository;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Kiểm thử đơn vị cho EmployeeAttendanceQueryService (SOL-BE-028, FR-BE-025, DD-BE-019, BLD-BE-033, TASK-BE-038).
 */
@ExtendWith(MockitoExtension.class)
class EmployeeAttendanceQueryServiceTest {

    @Mock
    private AttendanceLogRepository attendanceLogRepository;

    @Mock
    private UserRepository userRepository;

    private EmployeeAttendanceQueryService queryService;

    private User sampleUser;
    private Kiosk sampleKiosk;

    @BeforeEach
    void setUp() {
        queryService = new EmployeeAttendanceQueryService(attendanceLogRepository, userRepository);

        sampleUser = User.builder()
                .id(100L)
                .employeeCode("EMP001")
                .fullName("Nguyen Van A")
                .department("Engineering")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build();

        sampleKiosk = Kiosk.builder()
                .id("KIOSK-01")
                .locationName("Cổng chính")
                .secretTokenHash("hash123")
                .build();
    }

    @Nested
    @DisplayName("Tra cứu bảng công cá nhân tổng hợp (getMonthlyPersonalAttendance)")
    class MonthlyAttendanceTests {

        @Test
        @DisplayName("Tổng hợp bảng công tháng chính xác khi có nhiều lượt quẹt khác nhau")
        void getMonthlyPersonalAttendance_success() {
            when(userRepository.existsById(100L)).thenReturn(true);

            // Ngày 2026-10-01: Đúng giờ (In 08:00, Out 17:00)
            Instant day1In = ZonedDateTime.of(2026, 10, 1, 8, 0, 0, 0, ApiResponse.VIETNAM_ZONE).toInstant();
            Instant day1Out = ZonedDateTime.of(2026, 10, 1, 17, 0, 0, 0, ApiResponse.VIETNAM_ZONE).toInstant();
            AttendanceLog log1 = AttendanceLog.builder()
                    .id(1L).user(sampleUser).punchTimestamp(day1In).punchType(PunchType.CHECK_IN)
                    .verificationMethod(VerificationMethod.FACE_MATCH).status(AttendanceStatus.ON_TIME).lateMinutes(0).build();
            AttendanceLog log2 = AttendanceLog.builder()
                    .id(2L).user(sampleUser).punchTimestamp(day1Out).punchType(PunchType.CHECK_OUT)
                    .verificationMethod(VerificationMethod.FACE_MATCH).status(AttendanceStatus.ON_TIME).lateMinutes(0).build();

            // Ngày 2026-10-02: Đi trễ (In 08:35, Out 17:30, late 35m)
            Instant day2In = ZonedDateTime.of(2026, 10, 2, 8, 35, 0, 0, ApiResponse.VIETNAM_ZONE).toInstant();
            Instant day2Out = ZonedDateTime.of(2026, 10, 2, 17, 30, 0, 0, ApiResponse.VIETNAM_ZONE).toInstant();
            AttendanceLog log3 = AttendanceLog.builder()
                    .id(3L).user(sampleUser).punchTimestamp(day2In).punchType(PunchType.CHECK_IN)
                    .verificationMethod(VerificationMethod.FALLBACK_PIN).status(AttendanceStatus.LATE).lateMinutes(35).build();
            AttendanceLog log4 = AttendanceLog.builder()
                    .id(4L).user(sampleUser).punchTimestamp(day2Out).punchType(PunchType.CHECK_OUT)
                    .verificationMethod(VerificationMethod.FACE_MATCH).status(AttendanceStatus.ON_TIME).lateMinutes(0).build();

            // Ngày 2026-10-03: Về sớm (In 08:00, Out 15:00)
            Instant day3In = ZonedDateTime.of(2026, 10, 3, 8, 0, 0, 0, ApiResponse.VIETNAM_ZONE).toInstant();
            Instant day3Out = ZonedDateTime.of(2026, 10, 3, 15, 0, 0, 0, ApiResponse.VIETNAM_ZONE).toInstant();
            AttendanceLog log5 = AttendanceLog.builder()
                    .id(5L).user(sampleUser).punchTimestamp(day3In).punchType(PunchType.CHECK_IN)
                    .verificationMethod(VerificationMethod.FACE_MATCH).status(AttendanceStatus.ON_TIME).lateMinutes(0).build();
            AttendanceLog log6 = AttendanceLog.builder()
                    .id(6L).user(sampleUser).punchTimestamp(day3Out).punchType(PunchType.CHECK_OUT)
                    .verificationMethod(VerificationMethod.FACE_MATCH).status(AttendanceStatus.EARLY_LEAVE).lateMinutes(0).build();

            when(attendanceLogRepository.findByUserIdAndPunchTimestampBetween(eq(100L), any(Instant.class), any(Instant.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(log1, log2, log3, log4, log5, log6)));

            PersonalAttendanceResponse response = queryService.getMonthlyPersonalAttendance(100L, 2026, 10);

            assertThat(response).isNotNull();
            assertThat(response.year()).isEqualTo(2026);
            assertThat(response.month()).isEqualTo(10);
            assertThat(response.totalWorkDays()).isEqualTo(3);
            assertThat(response.totalOnTimeDays()).isEqualTo(1);
            assertThat(response.totalLateDays()).isEqualTo(1);
            assertThat(response.records()).hasSize(3);

            // Kiểm tra chi tiết ngày 2
            DailyAttendanceItem day2Item = response.records().stream()
                    .filter(r -> r.date().equals(LocalDate.of(2026, 10, 2)))
                    .findFirst()
                    .orElseThrow();
            assertThat(day2Item.status()).isEqualTo(AttendanceStatus.LATE);
            assertThat(day2Item.lateMinutes()).isEqualTo(35);
            assertThat(day2Item.checkInTime()).isEqualTo(LocalTime.of(8, 35));
            assertThat(day2Item.checkOutTime()).isEqualTo(LocalTime.of(17, 30));
        }

        @Test
        @DisplayName("Ném lỗi khi nhân viên không tồn tại")
        void getMonthlyPersonalAttendance_userNotFound_throwsException() {
            when(userRepository.existsById(999L)).thenReturn(false);

            assertThatThrownBy(() -> queryService.getMonthlyPersonalAttendance(999L, 2026, 10))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND));
        }

        @Test
        @DisplayName("Ném lỗi khi tháng hoặc năm không hợp lệ")
        void getMonthlyPersonalAttendance_invalidMonthYear_throwsException() {
            assertThatThrownBy(() -> queryService.getMonthlyPersonalAttendance(100L, 1999, 10))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));

            assertThatThrownBy(() -> queryService.getMonthlyPersonalAttendance(100L, 2026, 13))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));
        }
    }

    @Nested
    @DisplayName("Tra cứu danh sách lượt chấm công phân trang (getPersonalAttendanceLogs)")
    class AttendanceLogsTests {

        @Test
        @DisplayName("Tra cứu có lọc theo tháng và phân trang")
        void getPersonalAttendanceLogs_filteredByMonth_success() {
            when(userRepository.existsById(100L)).thenReturn(true);

            Instant punchTime = ZonedDateTime.of(2026, 10, 1, 8, 0, 0, 0, ApiResponse.VIETNAM_ZONE).toInstant();
            AttendanceLog log = AttendanceLog.builder()
                    .id(1L)
                    .user(sampleUser)
                    .punchTimestamp(punchTime)
                    .punchType(PunchType.CHECK_IN)
                    .verificationMethod(VerificationMethod.FACE_MATCH)
                    .status(AttendanceStatus.ON_TIME)
                    .kiosk(sampleKiosk)
                    .build();

            Pageable pageable = PageRequest.of(0, 10);
            when(attendanceLogRepository.findByUserIdAndPunchTimestampBetween(eq(100L), any(Instant.class), any(Instant.class), eq(pageable)))
                    .thenReturn(new PageImpl<>(List.of(log), pageable, 1));

            Page<AttendanceLogItem> page = queryService.getPersonalAttendanceLogs(100L, 2026, 10, pageable);

            assertThat(page.getTotalElements()).isEqualTo(1);
            AttendanceLogItem item = page.getContent().get(0);
            assertThat(item.recordId()).isEqualTo(1L);
            assertThat(item.employeeId()).isEqualTo(100L);
            assertThat(item.employeeCode()).isEqualTo("EMP001");
            assertThat(item.department()).isEqualTo("Engineering");
            assertThat(item.kioskId()).isEqualTo("KIOSK-01");
        }
    }

    @Nested
    @DisplayName("Bảo mật chống truy cập chéo (assertCanAccess)")
    class AccessControlTests {

        @Test
        @DisplayName("Chặn truy cập khi ID người gọi khác với ID người cần tra cứu")
        void assertCanAccess_crossAccess_throwsAccessDenied() {
            assertThatThrownBy(() -> queryService.assertCanAccess(100L, 200L))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.ACCESS_DENIED));
        }

        @Test
        @DisplayName("Cho phép khi ID người gọi khớp với ID cần tra cứu")
        void assertCanAccess_sameUser_passes() {
            assertThatCode(() -> queryService.assertCanAccess(100L, 100L)).doesNotThrowAnyException();
        }
    }
}
