package com.fas.service;

import com.fas.data.entity.AuditLog;
import com.fas.data.entity.BiometricTemplate;
import com.fas.data.entity.ConsentWithdrawal;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.BiometricTemplateRepository;
import com.fas.data.repository.ConsentWithdrawalRepository;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm thử tích hợp CSDL cho BiometricCleanupService (TST-BE-017, BLD-BE-017, TASK-BE-018, SOL-BE-008).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BiometricCleanupIntegrationTest {

    @Autowired
    private BiometricCleanupService cleanupService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BiometricTemplateRepository biometricTemplateRepository;

    @Autowired
    private ConsentWithdrawalRepository consentWithdrawalRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    @DisplayName("TST-BE-017-IT: Kiểm thử toàn trình tiêu hủy dữ liệu sinh trắc học và bảo vệ nhân sự hợp lệ")
    void testEndToEndBiometricCleanup() {
        LocalDate today = LocalDate.of(2026, 10, 9);
        Instant now = Instant.parse("2026-10-09T01:00:00Z");

        // 1. Nhân viên đang làm việc (ACTIVE) -> Không bị xóa
        User activeUser = userRepository.save(User.builder()
                .employeeCode("EMP-ACT-01")
                .fullName("Nhân Viên Đang Làm")
                .email("active@company.vn")
                .passwordHash("pwd")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build());

        BiometricTemplate activeTemplate = biometricTemplateRepository.save(BiometricTemplate.builder()
                .user(activeUser)
                .encryptedVector(new byte[]{1, 2, 3})
                .encryptionIv(new byte[]{4, 5, 6})
                .build());

        // 2. Nhân viên thôi việc 10 ngày (<= 20 ngày) -> Bảo toàn trong hạn lưu trữ
        User recentTerminatedUser = userRepository.save(User.builder()
                .employeeCode("EMP-TERM-10")
                .fullName("Nhân Viên Thôi Việc 10 Ngày")
                .email("term10@company.vn")
                .passwordHash("pwd")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.TERMINATED)
                .terminatedDate(today.minusDays(10))
                .build());

        BiometricTemplate recentTemplate = biometricTemplateRepository.save(BiometricTemplate.builder()
                .user(recentTerminatedUser)
                .encryptedVector(new byte[]{7, 8, 9})
                .encryptionIv(new byte[]{10, 11, 12})
                .build());

        // 3. Nhân viên thôi việc 25 ngày (> 20 ngày) -> Phải bị Hard Delete
        User expiredTerminatedUser = userRepository.save(User.builder()
                .employeeCode("EMP-TERM-25")
                .fullName("Nhân Viên Thôi Việc 25 Ngày")
                .email("term25@company.vn")
                .passwordHash("pwd")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.TERMINATED)
                .terminatedDate(today.minusDays(25))
                .build());

        BiometricTemplate expiredTemplate = biometricTemplateRepository.save(BiometricTemplate.builder()
                .user(expiredTerminatedUser)
                .encryptedVector(new byte[]{13, 14, 15})
                .encryptionIv(new byte[]{16, 17, 18})
                .build());

        // 4. Rút Consent đã quá hạn (Due) -> Phải bị Hard Delete
        User consentDueUser = userRepository.save(User.builder()
                .employeeCode("EMP-WITHDRAW-DUE")
                .fullName("Nhân Viên Rút Consent Quá Hạn")
                .email("withdrawdue@company.vn")
                .passwordHash("pwd")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build());

        BiometricTemplate consentDueTemplate = biometricTemplateRepository.save(BiometricTemplate.builder()
                .user(consentDueUser)
                .encryptedVector(new byte[]{19, 20, 21})
                .encryptionIv(new byte[]{22, 23, 24})
                .build());

        ConsentWithdrawal dueWithdrawal = consentWithdrawalRepository.save(ConsentWithdrawal.builder()
                .user(consentDueUser)
                .clientIp("10.0.0.1")
                .withdrawnAt(now.minus(8, ChronoUnit.DAYS))
                .biometricDisposalDueAt(now.minus(1, ChronoUnit.DAYS))
                .processedAt(null)
                .build());

        // 5. Rút Consent chưa đến hạn (Not Due) -> Chưa bị xóa
        User consentPendingUser = userRepository.save(User.builder()
                .employeeCode("EMP-WITHDRAW-PENDING")
                .fullName("Nhân Viên Mới Rút Consent")
                .email("withdrawpending@company.vn")
                .passwordHash("pwd")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build());

        BiometricTemplate consentPendingTemplate = biometricTemplateRepository.save(BiometricTemplate.builder()
                .user(consentPendingUser)
                .encryptedVector(new byte[]{25, 26, 27})
                .encryptionIv(new byte[]{28, 29, 30})
                .build());

        ConsentWithdrawal pendingWithdrawal = consentWithdrawalRepository.save(ConsentWithdrawal.builder()
                .user(consentPendingUser)
                .clientIp("10.0.0.2")
                .withdrawnAt(now.minus(2, ChronoUnit.DAYS))
                .biometricDisposalDueAt(now.plus(5, ChronoUnit.DAYS))
                .processedAt(null)
                .build());

        long initialAuditCount = auditLogRepository.count();

        // THỰC THI TIÊU HỦY DỮ LIỆU
        BiometricCleanupService.CleanupReport report = cleanupService.cleanupAll(today, now);

        assertThat(report.terminatedUsersCleaned()).isEqualTo(1);
        assertThat(report.consentWithdrawalsCleaned()).isEqualTo(1);

        // KIỂM TRA BẢO TOÀN DỮ LIỆU
        assertThat(biometricTemplateRepository.existsById(activeTemplate.getId())).isTrue();
        assertThat(biometricTemplateRepository.existsById(recentTemplate.getId())).isTrue();
        assertThat(biometricTemplateRepository.existsById(consentPendingTemplate.getId())).isTrue();

        // KIỂM TRA DỮ LIỆU ĐÃ BỊ TIÊU HỦY VĨNH VIỄN
        assertThat(biometricTemplateRepository.existsById(expiredTemplate.getId())).isFalse();
        assertThat(biometricTemplateRepository.existsById(consentDueTemplate.getId())).isFalse();

        // KIỂM TRA CẬP NHẬT TRẠNG THÁI RÚT CONSENT
        ConsentWithdrawal updatedDueWithdrawal = consentWithdrawalRepository.findById(dueWithdrawal.getId()).orElseThrow();
        assertThat(updatedDueWithdrawal.getProcessedAt()).isEqualTo(now);

        ConsentWithdrawal updatedPendingWithdrawal = consentWithdrawalRepository.findById(pendingWithdrawal.getId()).orElseThrow();
        assertThat(updatedPendingWithdrawal.getProcessedAt()).isNull();

        // KIỂM TRA AUDIT LOG
        long newAuditCount = auditLogRepository.count();
        assertThat(newAuditCount).isEqualTo(initialAuditCount + 2);

        List<AuditLog> auditLogs = auditLogRepository.findAll();
        boolean hasTerminatedAudit = auditLogs.stream().anyMatch(l ->
                "DELETE_BIOMETRIC_DATA".equals(l.getAction()) &&
                String.valueOf(expiredTerminatedUser.getId()).equals(l.getEntityId()) &&
                l.getBeforeState().contains("TERMINATED_OVER_20_DAYS"));
        boolean hasWithdrawalAudit = auditLogs.stream().anyMatch(l ->
                "DELETE_BIOMETRIC_DATA".equals(l.getAction()) &&
                String.valueOf(consentDueUser.getId()).equals(l.getEntityId()) &&
                l.getBeforeState().contains("CONSENT_WITHDRAWAL_DUE"));

        assertThat(hasTerminatedAudit).isTrue();
        assertThat(hasWithdrawalAudit).isTrue();
    }
}
