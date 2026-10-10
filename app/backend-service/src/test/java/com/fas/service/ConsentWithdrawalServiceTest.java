package com.fas.service;

import com.fas.api.dto.response.ConsentWithdrawalResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.BiometricTemplate;
import com.fas.data.entity.ConsentWithdrawal;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.NotificationEventType;
import com.fas.data.enums.Role;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.BiometricTemplateRepository;
import com.fas.data.repository.ConsentWithdrawalRepository;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị cho ConsentWithdrawalService (SOL-BE-025, FR-BE-022, BLD-BE-032, TASK-BE-037).
 */
@ExtendWith(MockitoExtension.class)
class ConsentWithdrawalServiceTest {

    @Mock
    private ConsentWithdrawalRepository consentWithdrawalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BiometricTemplateRepository biometricTemplateRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogRepository auditLogRepository;

    private final Instant fixedInstant = Instant.parse("2026-10-10T10:00:00Z");
    private final Clock fixedClock = Clock.fixed(fixedInstant, ZoneId.of("UTC"));

    private ConsentWithdrawalService consentService;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        consentService = new ConsentWithdrawalService(
                consentWithdrawalRepository,
                userRepository,
                biometricTemplateRepository,
                notificationService,
                auditLogRepository,
                fixedClock
        );

        sampleUser = User.builder()
                .id(100L)
                .employeeCode("EMP001")
                .fullName("Nguyen Van A")
                .email("nva@fas.com")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build();
    }

    @Nested
    @DisplayName("Rút Informed Consent (withdrawConsent)")
    class WithdrawConsentTests {

        @Test
        @DisplayName("Rút consent thành công: vô hiệu hóa biometric template, đặt hạn 7 ngày, sinh notification & audit")
        void withdrawConsent_success() {
            when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));

            BiometricTemplate template1 = BiometricTemplate.builder().id(1L).user(sampleUser).isActive(true).build();
            BiometricTemplate template2 = BiometricTemplate.builder().id(2L).user(sampleUser).isActive(true).build();
            when(biometricTemplateRepository.findByUserId(100L)).thenReturn(List.of(template1, template2));

            when(consentWithdrawalRepository.save(any(ConsentWithdrawal.class))).thenAnswer(inv -> {
                ConsentWithdrawal cw = inv.getArgument(0);
                cw.setId(50L);
                return cw;
            });

            ConsentWithdrawalResponse response = consentService.withdrawConsent(100L, "192.168.1.100");

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(50L);
            assertThat(response.userId()).isEqualTo(100L);
            assertThat(response.clientIp()).isEqualTo("192.168.1.100");
            assertThat(response.withdrawnAt()).isEqualTo(fixedInstant);
            assertThat(response.biometricDisposalDueAt()).isEqualTo(fixedInstant.plus(Duration.ofDays(7)));

            // 1. Kiểm tra template đã bị vô hiệu hóa
            assertThat(template1.getIsActive()).isFalse();
            assertThat(template2.getIsActive()).isFalse();
            verify(biometricTemplateRepository).saveAll(List.of(template1, template2));

            // 2. Kiểm tra sinh thông báo
            verify(notificationService).createNotification(
                    eq(100L),
                    eq(NotificationEventType.CONSENT_WITHDRAWN),
                    anyString(),
                    anyString(),
                    eq("CONSENT_WITHDRAWAL"),
                    eq("50")
            );

            // 3. Kiểm tra ghi Audit Log
            verify(auditLogRepository).save(argThat(log ->
                    "WITHDRAW_CONSENT".equals(log.getAction()) &&
                    "CONSENT_WITHDRAWAL".equals(log.getEntityType()) &&
                    sampleUser.equals(log.getActor())
            ));
        }

        @Test
        @DisplayName("Ném lỗi khi nhân viên không tồn tại")
        void withdrawConsent_userNotFound_throwsException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> consentService.withdrawConsent(999L, "127.0.0.1"))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND));

            verify(consentWithdrawalRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Kiểm tra chặn hành vi khi đã rút Consent (assertConsentActive)")
    class AssertConsentActiveTests {

        @Test
        @DisplayName("Ném 403 ACCESS_DENIED nếu nhân viên đã rút consent")
        void assertConsentActive_withdrawn_throwsException() {
            ConsentWithdrawal cw = ConsentWithdrawal.builder().id(1L).user(sampleUser).build();
            when(consentWithdrawalRepository.findFirstByUserIdOrderByWithdrawnAtDesc(100L)).thenReturn(Optional.of(cw));

            assertThatThrownBy(() -> consentService.assertConsentActive(100L))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.ACCESS_DENIED));
        }

        @Test
        @DisplayName("Không ném lỗi nếu nhân viên chưa từng rút consent")
        void assertConsentActive_notWithdrawn_passes() {
            when(consentWithdrawalRepository.findFirstByUserIdOrderByWithdrawnAtDesc(100L)).thenReturn(Optional.empty());

            assertThatCode(() -> consentService.assertConsentActive(100L)).doesNotThrowAnyException();
        }
    }
}
