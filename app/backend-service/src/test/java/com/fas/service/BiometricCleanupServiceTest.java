package com.fas.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Bộ kiểm thử đơn vị cho BiometricCleanupService (TST-BE-017, BLD-BE-017, TASK-BE-018, SOL-BE-008).
 */
@ExtendWith(MockitoExtension.class)
class BiometricCleanupServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BiometricTemplateRepository biometricTemplateRepository;

    @Mock
    private ConsentWithdrawalRepository consentWithdrawalRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private BiometricCleanupService cleanupService;

    private final LocalDate today = LocalDate.of(2026, 10, 9);
    private final Instant now = Instant.parse("2026-10-09T01:00:00Z");

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(cleanupService, "retentionDays", 20);
    }

    @Test
    @DisplayName("TST-BE-017-01: Không có nhân viên thôi việc quá 20 ngày -> không xóa gì và không ghi audit log")
    void cleanupTerminatedEmployees_whenNoTerminatedUsers_doesNothing() {
        LocalDate threshold = today.minusDays(20);
        when(userRepository.findByStatusAndTerminatedDateLessThanEqual(EmployeeStatus.TERMINATED, threshold))
                .thenReturn(Collections.emptyList());

        int count = cleanupService.cleanupTerminatedEmployees(today);

        assertThat(count).isEqualTo(0);
        verify(biometricTemplateRepository, never()).deleteByUserId(any());
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("TST-BE-017-02: Nhân viên thôi việc quá 20 ngày (> 20 ngày) -> Xóa cứng mẫu và ghi audit log")
    void cleanupTerminatedEmployees_whenTerminatedOver20Days_deletesAndAudits() {
        LocalDate threshold = today.minusDays(20);
        User terminatedUser = User.builder()
                .id(101L)
                .employeeCode("EMP-101")
                .fullName("Trần Thôi Việc")
                .email("tran.thoiviec@company.vn")
                .passwordHash("hashed")
                .status(EmployeeStatus.TERMINATED)
                .role(Role.EMPLOYEE)
                .terminatedDate(today.minusDays(25)) // 25 ngày > 20 ngày
                .build();

        BiometricTemplate template = BiometricTemplate.builder()
                .id(501L)
                .user(terminatedUser)
                .encryptedVector(new byte[2048])
                .encryptionIv(new byte[12])
                .build();

        when(userRepository.findByStatusAndTerminatedDateLessThanEqual(EmployeeStatus.TERMINATED, threshold))
                .thenReturn(List.of(terminatedUser));
        when(biometricTemplateRepository.findByUserId(101L))
                .thenReturn(List.of(template));

        int count = cleanupService.cleanupTerminatedEmployees(today);

        assertThat(count).isEqualTo(1);
        verify(biometricTemplateRepository, times(1)).deleteByUserId(101L);

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(1)).save(auditCaptor.capture());

        AuditLog savedAudit = auditCaptor.getValue();
        assertThat(savedAudit.getAction()).isEqualTo("DELETE_BIOMETRIC_DATA");
        assertThat(savedAudit.getEntityType()).isEqualTo("biometric_templates");
        assertThat(savedAudit.getEntityId()).isEqualTo("101");
        assertThat(savedAudit.getActor()).isNull();
        assertThat(savedAudit.getActorEmail()).isEqualTo("SYSTEM");
        assertThat(savedAudit.getBeforeState()).contains("TERMINATED_OVER_20_DAYS");
        assertThat(savedAudit.getBeforeState()).contains("EMP-101");
        assertThat(savedAudit.getBeforeState()).contains("\"deletedTemplatesCount\":1");
    }

    @Test
    @DisplayName("TST-BE-017-03: Nhân viên thôi việc đúng 20 ngày -> Thuộc diện xóa cứng theo quy định")
    void cleanupTerminatedEmployees_whenTerminatedExactly20Days_isCleaned() {
        LocalDate threshold = today.minusDays(20);
        User userExactly20 = User.builder()
                .id(102L)
                .employeeCode("EMP-102")
                .fullName("Lê Tròn 20 Ngày")
                .email("le.20ngay@company.vn")
                .passwordHash("hashed")
                .status(EmployeeStatus.TERMINATED)
                .role(Role.EMPLOYEE)
                .terminatedDate(threshold) // Đúng 20 ngày
                .build();

        BiometricTemplate template = BiometricTemplate.builder()
                .id(502L)
                .user(userExactly20)
                .encryptedVector(new byte[2048])
                .encryptionIv(new byte[12])
                .build();

        when(userRepository.findByStatusAndTerminatedDateLessThanEqual(EmployeeStatus.TERMINATED, threshold))
                .thenReturn(List.of(userExactly20));
        when(biometricTemplateRepository.findByUserId(102L))
                .thenReturn(List.of(template));

        int count = cleanupService.cleanupTerminatedEmployees(today);

        assertThat(count).isEqualTo(1);
        verify(biometricTemplateRepository).deleteByUserId(102L);
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("TST-BE-017-04: Nhân viên đã thôi việc nhưng không có vector mẫu -> Bỏ qua xóa và audit")
    void cleanupTerminatedEmployees_whenUserHasNoTemplates_skips() {
        LocalDate threshold = today.minusDays(20);
        User terminatedUser = User.builder()
                .id(103L)
                .employeeCode("EMP-103")
                .fullName("Phạm Chưa Nạp Mẫu")
                .email("pham.chuanapm@company.vn")
                .passwordHash("hashed")
                .status(EmployeeStatus.TERMINATED)
                .role(Role.EMPLOYEE)
                .terminatedDate(today.minusDays(30))
                .build();

        when(userRepository.findByStatusAndTerminatedDateLessThanEqual(EmployeeStatus.TERMINATED, threshold))
                .thenReturn(List.of(terminatedUser));
        when(biometricTemplateRepository.findByUserId(103L))
                .thenReturn(Collections.emptyList());

        int count = cleanupService.cleanupTerminatedEmployees(today);

        assertThat(count).isEqualTo(0);
        verify(biometricTemplateRepository, never()).deleteByUserId(103L);
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("TST-BE-017-05: Tiêu hủy dữ liệu cho yêu cầu rút Consent đã đến hạn (7 ngày)")
    void cleanupWithdrawnConsents_whenDue_deletesTemplatesAndMarksProcessed() {
        User user = User.builder()
                .id(104L)
                .employeeCode("EMP-104")
                .fullName("Vũ Rút Consent")
                .email("vu.consent@company.vn")
                .passwordHash("hashed")
                .status(EmployeeStatus.ACTIVE)
                .role(Role.EMPLOYEE)
                .build();

        ConsentWithdrawal withdrawal = ConsentWithdrawal.builder()
                .id(1L)
                .user(user)
                .clientIp("192.168.1.100")
                .withdrawnAt(now.minus(8, ChronoUnit.DAYS))
                .biometricDisposalDueAt(now.minus(1, ChronoUnit.DAYS)) // Đã quá hạn 1 ngày
                .processedAt(null)
                .build();

        BiometricTemplate template = BiometricTemplate.builder()
                .id(504L)
                .user(user)
                .encryptedVector(new byte[2048])
                .encryptionIv(new byte[12])
                .build();

        when(consentWithdrawalRepository.findByProcessedAtIsNullAndBiometricDisposalDueAtLessThanEqual(now))
                .thenReturn(List.of(withdrawal));
        when(biometricTemplateRepository.findByUserId(104L))
                .thenReturn(List.of(template));

        int processed = cleanupService.cleanupWithdrawnConsents(now);

        assertThat(processed).isEqualTo(1);
        assertThat(withdrawal.getProcessedAt()).isEqualTo(now);
        verify(biometricTemplateRepository).deleteByUserId(104L);
        verify(consentWithdrawalRepository).save(withdrawal);

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(auditCaptor.capture());
        AuditLog audit = auditCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("DELETE_BIOMETRIC_DATA");
        assertThat(audit.getBeforeState()).contains("CONSENT_WITHDRAWAL_DUE");
    }

    @Test
    @DisplayName("TST-BE-017-06: Chạy tác vụ tổng thể cleanupAll và runScheduledCleanup")
    void runScheduledCleanup_executesSuccessfully() {
        when(userRepository.findByStatusAndTerminatedDateLessThanEqual(eq(EmployeeStatus.TERMINATED), any()))
                .thenReturn(Collections.emptyList());
        when(consentWithdrawalRepository.findByProcessedAtIsNullAndBiometricDisposalDueAtLessThanEqual(any()))
                .thenReturn(Collections.emptyList());

        // Kiểm tra không quăng ngoại lệ khi chạy lịch trình
        cleanupService.runScheduledCleanup();

        BiometricCleanupService.CleanupReport report = cleanupService.cleanupAll(today, now);
        assertThat(report.terminatedUsersCleaned()).isEqualTo(0);
        assertThat(report.consentWithdrawalsCleaned()).isEqualTo(0);
        assertThat(report.executionDurationMs()).isGreaterThanOrEqualTo(0);
    }
}
