package com.fas.data;

import com.fas.data.entity.*;
import com.fas.data.enums.*;
import com.fas.data.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TST-BE-DAT-003: Kiểm thử hiệu năng Batch Insert và các thao tác Repository đa tiêu chí.
 * Covers: DBL-BE-003, DTD-BE-001, DATA-BE-006.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RepositoryIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private EmployeeShiftRepository employeeShiftRepository;

    @Autowired
    private KioskRepository kioskRepository;

    @Autowired
    private BiometricTemplateRepository biometricTemplateRepository;

    @Autowired
    private AttendanceLogRepository attendanceLogRepository;

    @Autowired
    private EnrollmentSessionRepository enrollmentSessionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private User sampleUser;
    private Kiosk sampleKiosk;
    private Shift sampleShift;

    @BeforeEach
    void setUp() {
        sampleUser = userRepository.save(User.builder()
                .employeeCode("NV-BATCH-01")
                .fullName("Nguyen Van Test")
                .email("test.batch@fas.com")
                .passwordHash("$2a$12$dummyhash")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .department("Kho Cong Nghe")
                .build());

        sampleKiosk = kioskRepository.save(Kiosk.builder()
                .id("KIOSK-TEST-01")
                .locationName("Cổng chính FAS")
                .secretTokenHash("$2a$12$dummysecret")
                .isActive(true)
                .build());

        sampleShift = shiftRepository.save(Shift.builder()
                .shiftCode("CA_TEST")
                .shiftName("Ca Test 08h-17h")
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(17, 0))
                .gracePeriodMinutes(15)
                .isActive(true)
                .build());
    }

    @Test
    @DisplayName("TST-BE-DAT-003: Ghi lô 50 bản ghi điểm danh với hiệu năng cao <= 50ms")
    void testBatchInsertFiftyAttendanceLogsPerformance() {
        List<AttendanceLog> logs = new ArrayList<>();
        Instant baseTime = Instant.now().truncatedTo(ChronoUnit.SECONDS);

        for (int i = 0; i < 50; i++) {
            logs.add(AttendanceLog.builder()
                    .user(sampleUser)
                    .kiosk(sampleKiosk)
                    .punchTimestamp(baseTime.plus(i, ChronoUnit.MINUTES))
                    .punchType(i % 2 == 0 ? PunchType.CHECK_IN : PunchType.CHECK_OUT)
                    .verificationMethod(VerificationMethod.FACE_MATCH)
                    .confidenceScore(new BigDecimal("0.9125"))
                    .status(AttendanceStatus.ON_TIME)
                    .lateMinutes(0)
                    .isOfflineSync(true)
                    .build());
        }

        long startTime = System.currentTimeMillis();
        int inserted = attendanceLogRepository.batchInsertOfflineLogs(logs);
        long durationMs = System.currentTimeMillis() - startTime;

        assertThat(inserted).isEqualTo(50);
        // Kiểm chứng tiêu chuẩn done when: batch insert 50 bản ghi <= 50ms
        assertThat(durationMs)
                .as("Thời gian batch insert 50 bản ghi phải <= 50ms (thực tế: %d ms)", durationMs)
                .isLessThanOrEqualTo(50L);
    }

    @Test
    @DisplayName("DBL-BE-003: Truy vấn điểm danh theo ngày và người dùng có phân trang phản hồi nhanh < 15ms")
    void testQueryAttendanceByUserAndDateRangePerformance() {
        // Chuẩn bị 10 bản ghi điểm danh
        Instant now = Instant.now();
        for (int i = 0; i < 10; i++) {
            attendanceLogRepository.save(AttendanceLog.builder()
                    .user(sampleUser)
                    .kiosk(sampleKiosk)
                    .punchTimestamp(now.minus(i, ChronoUnit.HOURS))
                    .punchType(PunchType.CHECK_IN)
                    .verificationMethod(VerificationMethod.VERIFICATION_FACE)
                    .status(AttendanceStatus.ON_TIME)
                    .build());
        }

        Pageable pageable = PageRequest.of(0, 10);
        Instant start = now.minus(24, ChronoUnit.HOURS);
        Instant end = now.plus(1, ChronoUnit.HOURS);

        // Warmup query để nạp Hibernate Query Plan cache và Connection Pool
        attendanceLogRepository.findByUserIdAndPunchTimestampBetween(sampleUser.getId(), start, end, pageable);

        long startTime = System.currentTimeMillis();
        Page<AttendanceLog> page = attendanceLogRepository
                .findByUserIdAndPunchTimestampBetween(sampleUser.getId(), start, end, pageable);
        long durationMs = System.currentTimeMillis() - startTime;

        assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(10);
        // Tiêu chí nghiệm thu: truy vấn điểm danh theo ngày và người dùng phản hồi < 15 ms
        assertThat(durationMs)
                .as("Truy vấn điểm danh có phân trang phải phản hồi < 15ms (thực tế: %d ms)", durationMs)
                .isLessThan(15L);
    }

    @Test
    @DisplayName("DBL-BE-003: Quản lý và xóa mẫu sinh trắc học theo userId")
    void testBiometricTemplateRepository() {
        biometricTemplateRepository.save(BiometricTemplate.builder()
                .user(sampleUser)
                .encryptedVector(new byte[]{1, 2})
                .encryptionIv(new byte[]{3, 4})
                .algorithm("ARCFACE_512D")
                .version(1)
                .isActive(true)
                .build());

        Optional<BiometricTemplate> template = biometricTemplateRepository.findByUserIdAndIsActiveTrue(sampleUser.getId());
        assertThat(template).isPresent();

        biometricTemplateRepository.deleteByUserId(sampleUser.getId());
        assertThat(biometricTemplateRepository.findByUserIdAndIsActiveTrue(sampleUser.getId())).isEmpty();
    }

    @Test
    @DisplayName("DBL-BE-003: Tìm kiếm người dùng đa tiêu chí và theo phòng ban/trạng thái")
    void testUserSearchAndFiltering() {
        Page<User> activeUsers = userRepository.findByStatus(EmployeeStatus.ACTIVE, PageRequest.of(0, 5));
        assertThat(activeUsers.getContent()).isNotEmpty();

        Page<User> searchResult = userRepository
                .findByFullNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase(
                        "Nguyen", "NON_EXIST", PageRequest.of(0, 5));
        assertThat(searchResult.getContent()).isNotEmpty();

        // Kiểm tra logic tiêu hủy dữ liệu 20 ngày
        sampleUser.setStatus(EmployeeStatus.TERMINATED);
        sampleUser.setTerminatedDate(LocalDate.now().minusDays(21));
        userRepository.save(sampleUser);

        List<User> expiredUsers = userRepository.findByStatusAndTerminatedDateLessThanEqual(
                EmployeeStatus.TERMINATED, LocalDate.now().minusDays(20));
        assertThat(expiredUsers).extracting(User::getId).contains(sampleUser.getId());
    }

    @Test
    @DisplayName("DBL-BE-003: Tìm kiếm ca làm việc hiệu lực cho nhân viên (findActiveShiftForUser)")
    void testFindActiveShiftForUser() {
        employeeShiftRepository.save(EmployeeShift.builder()
                .user(sampleUser)
                .shift(sampleShift)
                .effectiveFrom(LocalDate.now().minusDays(5))
                .effectiveTo(LocalDate.now().plusDays(30))
                .build());

        Optional<EmployeeShift> activeShift = employeeShiftRepository
                .findActiveShiftForUser(sampleUser.getId(), LocalDate.now());
        assertThat(activeShift).isPresent();
        assertThat(activeShift.get().getShift().getShiftCode()).isEqualTo("CA_TEST");
    }

    @Test
    @DisplayName("DBL-BE-003: Kiểm tra phiên đăng ký OTP hợp lệ và chưa sử dụng")
    void testEnrollmentSessionLookup() {
        String otpHash = "$2a$12$sampleotphashvalue";
        enrollmentSessionRepository.save(EnrollmentSession.builder()
                .user(sampleUser)
                .otpHash(otpHash)
                .consentVersion("v1.0")
                .consentSignedAt(Instant.now())
                .clientIp("127.0.0.1")
                .expiresAt(Instant.now().plusSeconds(3600))
                .isUsed(false)
                .build());

        Optional<EnrollmentSession> validSession = enrollmentSessionRepository
                .findByOtpHashAndIsUsedFalseAndExpiresAtAfter(otpHash, Instant.now());
        assertThat(validSession).isPresent();
        assertThat(validSession.get().getUser().getId()).isEqualTo(sampleUser.getId());
    }

    @Test
    @DisplayName("DBL-BE-003: Phân trang nhật ký kiểm toán AuditLog")
    void testAuditLogPagination() {
        auditLogRepository.save(AuditLog.builder()
                .actor(sampleUser)
                .actorEmail(sampleUser.getEmail())
                .action("LOGIN")
                .entityType("users")
                .entityId(sampleUser.getId().toString())
                .ipAddress("10.0.0.1")
                .build());

        Page<AuditLog> auditPage = auditLogRepository
                .findByActorId(sampleUser.getId(), PageRequest.of(0, 10));
        assertThat(auditPage.getContent()).isNotEmpty();
        assertThat(auditPage.getContent().get(0).getAction()).isEqualTo("LOGIN");
    }
}
