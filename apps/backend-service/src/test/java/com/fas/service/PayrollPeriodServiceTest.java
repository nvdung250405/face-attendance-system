package com.fas.service;

import com.fas.api.dto.response.PayrollPeriodResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.PayrollPeriod;
import com.fas.data.entity.User;
import com.fas.data.enums.PayrollPeriodStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.PayrollPeriodRepository;
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

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị cho PayrollPeriodService (SOL-BE-024, FR-BE-021, BLD-BE-032, TASK-BE-037).
 */
@ExtendWith(MockitoExtension.class)
class PayrollPeriodServiceTest {

    @Mock
    private PayrollPeriodRepository payrollPeriodRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    private final Instant fixedInstant = Instant.parse("2026-10-10T10:00:00Z");
    private final Clock fixedClock = Clock.fixed(fixedInstant, ZoneId.of("UTC"));

    private PayrollPeriodService periodService;
    private User hrManager;
    private User adminUser;

    @BeforeEach
    void setUp() {
        periodService = new PayrollPeriodService(payrollPeriodRepository, userRepository, auditLogRepository, fixedClock);

        hrManager = User.builder()
                .id(10L)
                .fullName("HR Manager")
                .email("hr@fas.com")
                .role(Role.HR_MANAGER)
                .build();

        adminUser = User.builder()
                .id(1L)
                .fullName("System Admin")
                .email("admin@fas.com")
                .role(Role.ADMIN)
                .build();
    }

    @Nested
    @DisplayName("Chốt kỳ công (lockPeriod)")
    class LockPeriodTests {

        @Test
        @DisplayName("Chốt kỳ công mới chưa tồn tại thành công và ghi AuditLog")
        void lockPeriod_newPeriod_success() {
            when(userRepository.findById(10L)).thenReturn(Optional.of(hrManager));
            when(payrollPeriodRepository.findByPeriodYearAndPeriodMonth(2026, 9)).thenReturn(Optional.empty());
            when(payrollPeriodRepository.save(any(PayrollPeriod.class))).thenAnswer(inv -> {
                PayrollPeriod p = inv.getArgument(0);
                p.setId(100L);
                return p;
            });

            PayrollPeriodResponse response = periodService.lockPeriod(2026, 9, 10L);

            assertThat(response).isNotNull();
            assertThat(response.periodYear()).isEqualTo(2026);
            assertThat(response.periodMonth()).isEqualTo(9);
            assertThat(response.status()).isEqualTo(PayrollPeriodStatus.LOCKED);
            assertThat(response.lockedById()).isEqualTo(10L);
            assertThat(response.lockedAt()).isEqualTo(fixedInstant);

            verify(payrollPeriodRepository).save(any(PayrollPeriod.class));
            verify(auditLogRepository).save(argThat(log ->
                    "LOCK_PAYROLL_PERIOD".equals(log.getAction()) &&
                    "PAYROLL_PERIOD".equals(log.getEntityType()) &&
                    hrManager.equals(log.getActor())
            ));
        }

        @Test
        @DisplayName("Ném lỗi khi năm hoặc tháng không hợp lệ")
        void lockPeriod_invalidYearMonth_throwsException() {
            assertThatThrownBy(() -> periodService.lockPeriod(1999, 5, 10L))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));

            assertThatThrownBy(() -> periodService.lockPeriod(2026, 13, 10L))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));
        }
    }

    @Nested
    @DisplayName("Mở lại kỳ công (unlockPeriod)")
    class UnlockPeriodTests {

        @Test
        @DisplayName("Mở lại kỳ công đã chốt kèm lý do thành công và ghi AuditLog")
        void unlockPeriod_success() {
            PayrollPeriod locked = PayrollPeriod.builder()
                    .id(100L)
                    .periodYear(2026)
                    .periodMonth(9)
                    .status(PayrollPeriodStatus.LOCKED)
                    .lockedBy(hrManager)
                    .lockedAt(fixedInstant)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
            when(payrollPeriodRepository.findByPeriodYearAndPeriodMonth(2026, 9)).thenReturn(Optional.of(locked));
            when(payrollPeriodRepository.save(any(PayrollPeriod.class))).thenAnswer(inv -> inv.getArgument(0));

            PayrollPeriodResponse response = periodService.unlockPeriod(2026, 9, 1L, "Cần bổ sung tăng ca ngày cuối tháng");

            assertThat(response.status()).isEqualTo(PayrollPeriodStatus.OPEN);
            assertThat(response.unlockedById()).isEqualTo(1L);
            assertThat(response.unlockReason()).isEqualTo("Cần bổ sung tăng ca ngày cuối tháng");
            assertThat(response.unlockedAt()).isEqualTo(fixedInstant);

            verify(auditLogRepository).save(argThat(log ->
                    "UNLOCK_PAYROLL_PERIOD".equals(log.getAction()) &&
                    adminUser.equals(log.getActor())
            ));
        }

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED nếu lý do mở lại bị rỗng")
        void unlockPeriod_blankReason_throwsException() {
            assertThatThrownBy(() -> periodService.unlockPeriod(2026, 9, 1L, "   "))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));

            verify(payrollPeriodRepository, never()).save(any());
        }

        @Test
        @DisplayName("Ném lỗi RESOURCE_NOT_FOUND nếu kỳ công chưa từng tồn tại")
        void unlockPeriod_notFound_throwsException() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
            when(payrollPeriodRepository.findByPeriodYearAndPeriodMonth(2026, 8)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> periodService.unlockPeriod(2026, 8, 1L, "Lý do hợp lệ"))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.RESOURCE_NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("Kiểm tra kỳ công bị chốt (assertPeriodNotLocked)")
    class AssertPeriodNotLockedTests {

        @Test
        @DisplayName("Ném 409 PERIOD_LOCKED khi kỳ công đang ở trạng thái LOCKED")
        void assertPeriodNotLocked_locked_throwsException() {
            PayrollPeriod locked = PayrollPeriod.builder()
                    .periodYear(2026)
                    .periodMonth(9)
                    .status(PayrollPeriodStatus.LOCKED)
                    .build();

            when(payrollPeriodRepository.findByPeriodYearAndPeriodMonth(2026, 9)).thenReturn(Optional.of(locked));

            assertThatThrownBy(() -> periodService.assertPeriodNotLocked(2026, 9))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.PERIOD_LOCKED));

            // Kiểm tra theo LocalDate
            assertThatThrownBy(() -> periodService.assertPeriodNotLocked(LocalDate.of(2026, 9, 15)))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.PERIOD_LOCKED));
        }

        @Test
        @DisplayName("Không ném lỗi khi kỳ công đang OPEN hoặc chưa tạo bản ghi")
        void assertPeriodNotLocked_openOrNonExistent_passes() {
            PayrollPeriod openPeriod = PayrollPeriod.builder()
                    .periodYear(2026)
                    .periodMonth(10)
                    .status(PayrollPeriodStatus.OPEN)
                    .build();

            when(payrollPeriodRepository.findByPeriodYearAndPeriodMonth(2026, 10)).thenReturn(Optional.of(openPeriod));
            when(payrollPeriodRepository.findByPeriodYearAndPeriodMonth(2026, 11)).thenReturn(Optional.empty());

            assertThatCode(() -> periodService.assertPeriodNotLocked(2026, 10)).doesNotThrowAnyException();
            assertThatCode(() -> periodService.assertPeriodNotLocked(LocalDate.of(2026, 11, 1))).doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("Tra cứu kỳ công")
    class QueryPayrollPeriodTests {

        @Test
        @DisplayName("Tra cứu danh sách kỳ công theo năm")
        void getPayrollPeriods_success() {
            PayrollPeriod p1 = PayrollPeriod.builder().id(1L).periodYear(2026).periodMonth(1).status(PayrollPeriodStatus.LOCKED).build();
            Pageable pageable = PageRequest.of(0, 10);
            when(payrollPeriodRepository.findByPeriodYear(2026, pageable))
                    .thenReturn(new PageImpl<>(List.of(p1), pageable, 1));

            Page<PayrollPeriodResponse> result = periodService.getPayrollPeriods(2026, pageable);

            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).periodMonth()).isEqualTo(1);
        }
    }
}
