package com.fas.data;

import com.fas.data.entity.*;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.Role;
import com.fas.data.enums.VerificationMethod;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * TST-BE-DAT-002: Kiểm thử Mapping ORM của JPA Entities & Ràng buộc Toàn vẹn Khóa / Duy nhất.
 * Covers: DATA-BE-001 đến DATA-BE-008, DBL-BE-002.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EntityMappingAndConstraintTest {

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("TST-BE-DAT-002: Cố tình chèn trùng employee_code phải ném DataIntegrityViolationException")
    void shouldThrowExceptionWhenDuplicateEmployeeCode() {
        User user1 = User.builder()
                .employeeCode("NV-1001")
                .fullName("Nguyen Van A")
                .email("nva@fas.com")
                .passwordHash("$2a$12$dummyhash")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build();
        entityManager.persist(user1);
        entityManager.flush();

        User user2 = User.builder()
                .employeeCode("NV-1001") // Trùng employee_code
                .fullName("Nguyen Van B")
                .email("nvb@fas.com")
                .passwordHash("$2a$12$dummyhash")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build();

        assertThatThrownBy(() -> {
            entityManager.persist(user2);
            entityManager.flush();
        }).isInstanceOfAny(DataIntegrityViolationException.class, org.hibernate.exception.ConstraintViolationException.class);
    }

    @Test
    @DisplayName("TST-BE-DAT-002: Cố tình chèn trùng email phải ném DataIntegrityViolationException")
    void shouldThrowExceptionWhenDuplicateEmail() {
        User user1 = User.builder()
                .employeeCode("NV-1002")
                .fullName("Tran Thi B")
                .email("same_email@fas.com")
                .passwordHash("$2a$12$dummyhash")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build();
        entityManager.persist(user1);
        entityManager.flush();

        User user2 = User.builder()
                .employeeCode("NV-1003")
                .fullName("Le Van C")
                .email("same_email@fas.com") // Trùng email
                .passwordHash("$2a$12$dummyhash")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build();

        assertThatThrownBy(() -> {
            entityManager.persist(user2);
            entityManager.flush();
        }).isInstanceOfAny(DataIntegrityViolationException.class, org.hibernate.exception.ConstraintViolationException.class);
    }

    @Test
    @DisplayName("TST-BE-DAT-002: Ràng buộc duy nhất uq_punch_user_time_type trong attendance_logs")
    void shouldThrowExceptionWhenDuplicateAttendancePunch() {
        User user = User.builder()
                .employeeCode("NV-1004")
                .fullName("Hoang Van D")
                .email("hvd@fas.com")
                .passwordHash("$2a$12$dummyhash")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build();
        entityManager.persist(user);

        Kiosk kiosk = Kiosk.builder()
                .id("KIOSK-HN-01")
                .locationName("Sảnh Tầng 1")
                .secretTokenHash("$2a$12$dummykiosksecret")
                .isActive(true)
                .build();
        entityManager.persist(kiosk);
        entityManager.flush();

        Instant punchTime = Instant.now();

        AttendanceLog log1 = AttendanceLog.builder()
                .user(user)
                .kiosk(kiosk)
                .punchTimestamp(punchTime)
                .punchType(PunchType.CHECK_IN)
                .verificationMethod(VerificationMethod.VERIFICATION_FACE)
                .confidenceScore(new BigDecimal("0.8950"))
                .status(AttendanceStatus.ON_TIME)
                .build();
        entityManager.persist(log1);
        entityManager.flush();

        AttendanceLog log2 = AttendanceLog.builder()
                .user(user)
                .kiosk(kiosk)
                .punchTimestamp(punchTime) // Trùng user_id, punch_timestamp và punch_type
                .punchType(PunchType.CHECK_IN)
                .verificationMethod(VerificationMethod.VERIFICATION_PIN)
                .status(AttendanceStatus.ON_TIME)
                .build();

        assertThatThrownBy(() -> {
            entityManager.persist(log2);
            entityManager.flush();
        }).isInstanceOfAny(DataIntegrityViolationException.class, org.hibernate.exception.ConstraintViolationException.class);
    }

    @Test
    @DisplayName("DBL-BE-002: Persist và truy xuất đầy đủ toàn bộ 8 JPA Entities")
    void shouldPersistAndRetrieveAllEntities() {
        // 1. User
        User user = User.builder()
                .employeeCode("NV-1005")
                .fullName("Pham Thi E")
                .email("pte@fas.com")
                .passwordHash("$2a$12$dummyhash")
                .role(Role.HR_MANAGER)
                .status(EmployeeStatus.ACTIVE)
                .department("Nhan su")
                .build();
        entityManager.persist(user);

        // 2. Shift
        Shift shift = Shift.builder()
                .shiftCode("CA_HC")
                .shiftName("Ca Hanh Chinh")
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(17, 30))
                .gracePeriodMinutes(15)
                .isActive(true)
                .build();
        entityManager.persist(shift);

        // 3. EmployeeShift
        EmployeeShift employeeShift = EmployeeShift.builder()
                .user(user)
                .shift(shift)
                .effectiveFrom(LocalDate.now())
                .build();
        entityManager.persist(employeeShift);

        // 4. Kiosk
        Kiosk kiosk = Kiosk.builder()
                .id("KIOSK-HCM-01")
                .locationName("Chi nhanh HCM")
                .secretTokenHash("$2a$12$dummykioskhcm")
                .isActive(true)
                .build();
        entityManager.persist(kiosk);

        // 5. BiometricTemplate
        BiometricTemplate template = BiometricTemplate.builder()
                .user(user)
                .encryptedVector(new byte[]{1, 2, 3, 4})
                .encryptionIv(new byte[]{5, 6, 7, 8, 9, 10, 11, 12})
                .algorithm("ARCFACE_512D")
                .version(1)
                .isActive(true)
                .build();
        entityManager.persist(template);

        // 6. AttendanceLog
        AttendanceLog attendanceLog = AttendanceLog.builder()
                .user(user)
                .kiosk(kiosk)
                .punchTimestamp(Instant.now())
                .punchType(PunchType.CHECK_OUT)
                .verificationMethod(VerificationMethod.FACE_MATCH)
                .confidenceScore(new BigDecimal("0.9250"))
                .status(AttendanceStatus.ON_TIME)
                .lateMinutes(0)
                .isOfflineSync(false)
                .build();
        entityManager.persist(attendanceLog);

        // 7. EnrollmentSession
        EnrollmentSession enrollmentSession = EnrollmentSession.builder()
                .user(user)
                .otpHash("$2a$12$dummyotphash")
                .consentVersion("v1.0")
                .consentSignedAt(Instant.now())
                .clientIp("192.168.1.100")
                .expiresAt(Instant.now().plusSeconds(172800))
                .isUsed(false)
                .build();
        entityManager.persist(enrollmentSession);

        // 8. AuditLog
        AuditLog auditLog = AuditLog.builder()
                .actor(user)
                .actorEmail(user.getEmail())
                .action("ENROLL_FACE")
                .entityType("biometric_templates")
                .entityId(template.getId() != null ? template.getId().toString() : "1")
                .beforeState("{\"status\":\"PENDING\"}")
                .afterState("{\"status\":\"ACTIVE\"}")
                .ipAddress("127.0.0.1")
                .build();
        entityManager.persist(auditLog);

        entityManager.flush();
        entityManager.clear();

        // Kiểm tra truy xuất lại
        User foundUser = entityManager.find(User.class, user.getId());
        assertThat(foundUser).isNotNull();
        assertThat(foundUser.getEmployeeCode()).isEqualTo("NV-1005");
        assertThat(foundUser.getRole()).isEqualTo(Role.HR_MANAGER);

        AttendanceLog foundLog = entityManager.find(AttendanceLog.class, attendanceLog.getId());
        assertThat(foundLog).isNotNull();
        assertThat(foundLog.getUser().getId()).isEqualTo(user.getId());
        assertThat(foundLog.getKiosk().getId()).isEqualTo(kiosk.getId());
        assertThat(foundLog.getPunchType()).isEqualTo(PunchType.CHECK_OUT);
    }
}
