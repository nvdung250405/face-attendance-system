package com.fas.service;

import com.fas.api.dto.PageResponse;
import com.fas.api.dto.request.AuditLogFilterCriteria;
import com.fas.api.dto.response.AuditLogItemResponse;
import com.fas.api.dto.response.ConsentRecordItem;
import com.fas.api.dto.response.RetentionScheduleItem;
import com.fas.data.entity.AuditLog;
import com.fas.data.entity.ConsentWithdrawal;
import com.fas.data.entity.EnrollmentSession;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.BiometricTemplateRepository;
import com.fas.data.repository.ConsentWithdrawalRepository;
import com.fas.data.repository.EnrollmentSessionRepository;
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
import org.springframework.data.jpa.domain.Specification;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Bộ kiểm thử đơn vị cho AuditQueryService (TASK-BE-031, BLD-BE-026, SOL-BE-019, FR-BE-016).
 */
@ExtendWith(MockitoExtension.class)
class AuditQueryServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private EnrollmentSessionRepository enrollmentSessionRepository;

    @Mock
    private ConsentWithdrawalRepository consentWithdrawalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BiometricTemplateRepository biometricTemplateRepository;

    private Clock fixedClock;
    private AuditQueryService auditQueryService;

    private static final Instant NOW = Instant.parse("2026-10-10T12:00:00Z");
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(NOW, ZONE);
        auditQueryService = new AuditQueryService(
                auditLogRepository,
                enrollmentSessionRepository,
                consentWithdrawalRepository,
                userRepository,
                biometricTemplateRepository,
                fixedClock
        );
    }

    @Nested
    @DisplayName("1. Tra cứu nhật ký kiểm toán (queryAuditLogs)")
    class QueryAuditLogsTests {

        @Test
        @DisplayName("Tra cứu thành công có tiêu chí lọc theo thời gian, tác nhân và hành vi")
        void queryAuditLogs_WithCriteria_Success() {
            User actor = User.builder().id(100L).email("admin@fas.com").build();
            AuditLog log1 = AuditLog.builder()
                    .id(1L)
                    .actor(actor)
                    .actorEmail("admin@fas.com")
                    .action("CREATE_EMPLOYEE")
                    .entityType("USER")
                    .entityId("200")
                    .beforeState(null)
                    .afterState("{\"employeeCode\":\"NV-1001\"}")
                    .ipAddress("192.168.1.10")
                    .createdAt(NOW.minusSeconds(3600))
                    .build();

            Page<AuditLog> page = new PageImpl<>(List.of(log1), PageRequest.of(0, 10), 1);
            when(auditLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

            AuditLogFilterCriteria criteria = new AuditLogFilterCriteria(
                    NOW.minusSeconds(7200),
                    NOW,
                    100L,
                    "CREATE_EMPLOYEE",
                    "USER"
            );

            PageResponse<AuditLogItemResponse> response = auditQueryService.queryAuditLogs(criteria, PageRequest.of(0, 10));

            assertThat(response).isNotNull();
            assertThat(response.totalElements()).isEqualTo(1);
            assertThat(response.content()).hasSize(1);

            AuditLogItemResponse item = response.content().get(0);
            assertThat(item.id()).isEqualTo(1L);
            assertThat(item.actorId()).isEqualTo(100L);
            assertThat(item.actorEmail()).isEqualTo("admin@fas.com");
            assertThat(item.action()).isEqualTo("CREATE_EMPLOYEE");
            assertThat(item.entityType()).isEqualTo("USER");
            assertThat(item.ipAddress()).isEqualTo("192.168.1.10");

            verify(auditLogRepository).findAll(any(Specification.class), eq(PageRequest.of(0, 10)));
        }

        @Test
        @DisplayName("Tra cứu thành công khi criteria null (lấy toàn bộ phân trang)")
        void queryAuditLogs_NullCriteria_Success() {
            Page<AuditLog> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 20), 0);
            when(auditLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

            PageResponse<AuditLogItemResponse> response = auditQueryService.queryAuditLogs(null, PageRequest.of(0, 20));

            assertThat(response).isNotNull();
            assertThat(response.totalElements()).isZero();
            assertThat(response.content()).isEmpty();
        }
    }

    @Nested
    @DisplayName("2. Tra cứu thỏa thuận Informed Consent (queryConsents)")
    class QueryConsentsTests {

        @Test
        @DisplayName("Tra cứu thỏa thuận Consent thành công trả về đầy đủ metadata ký và IP")
        void queryConsents_Success() {
            User user = User.builder()
                    .id(50L)
                    .employeeCode("NV-50")
                    .fullName("Nguyễn Thị C")
                    .email("c.nguyen@fas.com")
                    .build();

            EnrollmentSession session = EnrollmentSession.builder()
                    .id(10L)
                    .user(user)
                    .consentVersion("v1.0")
                    .consentSignedAt(NOW.minusSeconds(86400))
                    .clientIp("10.0.0.15")
                    .isUsed(true)
                    .build();

            Page<EnrollmentSession> page = new PageImpl<>(List.of(session), PageRequest.of(0, 10), 1);
            when(enrollmentSessionRepository.findAllByOrderByConsentSignedAtDesc(any(Pageable.class))).thenReturn(page);

            PageResponse<ConsentRecordItem> response = auditQueryService.queryConsents(PageRequest.of(0, 10));

            assertThat(response).isNotNull();
            assertThat(response.totalElements()).isEqualTo(1);
            ConsentRecordItem item = response.content().get(0);
            assertThat(item.sessionId()).isEqualTo(10L);
            assertThat(item.userId()).isEqualTo(50L);
            assertThat(item.employeeCode()).isEqualTo("NV-50");
            assertThat(item.fullName()).isEqualTo("Nguyễn Thị C");
            assertThat(item.email()).isEqualTo("c.nguyen@fas.com");
            assertThat(item.consentVersion()).isEqualTo("v1.0");
            assertThat(item.clientIp()).isEqualTo("10.0.0.15");
            assertThat(item.isUsed()).isTrue();
        }
    }

    @Nested
    @DisplayName("3. Tra cứu lịch trình tiêu hủy dữ liệu sinh trắc học (queryRetentionSchedule)")
    class QueryRetentionScheduleTests {

        @Test
        @DisplayName("Tra cứu lịch trình nhân sự thôi việc: tính mốc 20 ngày và trạng thái tiêu hủy mẫu")
        void queryRetentionSchedule_Success() {
            LocalDate termDate = LocalDate.now(fixedClock).minusDays(10);
            User terminatedUser = User.builder()
                    .id(70L)
                    .employeeCode("NV-70")
                    .fullName("Lê Văn T")
                    .email("t.le@fas.com")
                    .status(EmployeeStatus.TERMINATED)
                    .terminatedDate(termDate)
                    .updatedAt(NOW)
                    .build();

            Page<User> page = new PageImpl<>(List.of(terminatedUser), PageRequest.of(0, 10), 1);
            when(userRepository.findByStatusOrderByTerminatedDateDesc(eq(EmployeeStatus.TERMINATED), any(Pageable.class)))
                    .thenReturn(page);

            // Mẫu sinh trắc học đã bị xóa
            when(biometricTemplateRepository.findByUserIdAndIsActiveTrue(70L)).thenReturn(Optional.empty());
            when(biometricTemplateRepository.findByUserId(70L)).thenReturn(Collections.emptyList());

            PageResponse<RetentionScheduleItem> response = auditQueryService.queryRetentionSchedule(PageRequest.of(0, 10));

            assertThat(response).isNotNull();
            assertThat(response.totalElements()).isEqualTo(1);

            RetentionScheduleItem item = response.content().get(0);
            assertThat(item.sourceId()).isEqualTo(70L);
            assertThat(item.employeeCode()).isEqualTo("NV-70");
            assertThat(item.triggerDate()).isEqualTo(termDate.toString());
            assertThat(item.scheduledDisposalDate()).isEqualTo(termDate.plusDays(20).toString());
            assertThat(item.isDisposed()).isTrue();
            assertThat(item.retentionType()).isEqualTo("EMPLOYEE_TERMINATION");
        }

        @Test
        @DisplayName("Tra cứu lịch trình rút Consent: mốc tiêu hủy 7 ngày")
        void queryConsentWithdrawals_Success() {
            User user = User.builder().id(80L).employeeCode("NV-80").fullName("Trần Rút").email("rut@fas.com").build();
            ConsentWithdrawal withdrawal = ConsentWithdrawal.builder()
                    .id(99L)
                    .user(user)
                    .withdrawnAt(NOW.minusSeconds(3600))
                    .biometricDisposalDueAt(NOW.plusSeconds(7 * 86400))
                    .processedAt(null)
                    .build();

            Page<ConsentWithdrawal> page = new PageImpl<>(List.of(withdrawal), PageRequest.of(0, 10), 1);
            when(consentWithdrawalRepository.findAllByOrderByWithdrawnAtDesc(any(Pageable.class))).thenReturn(page);

            PageResponse<RetentionScheduleItem> response = auditQueryService.queryConsentWithdrawals(PageRequest.of(0, 10));

            assertThat(response).isNotNull();
            assertThat(response.totalElements()).isEqualTo(1);

            RetentionScheduleItem item = response.content().get(0);
            assertThat(item.sourceId()).isEqualTo(99L);
            assertThat(item.employeeCode()).isEqualTo("NV-80");
            assertThat(item.isDisposed()).isFalse();
            assertThat(item.retentionType()).isEqualTo("CONSENT_WITHDRAWAL");
        }
    }
}
