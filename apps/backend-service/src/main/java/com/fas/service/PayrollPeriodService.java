package com.fas.service;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.response.PayrollPeriodResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.AuditLog;
import com.fas.data.entity.PayrollPeriod;
import com.fas.data.entity.User;
import com.fas.data.enums.PayrollPeriodStatus;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.PayrollPeriodRepository;
import com.fas.data.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZonedDateTime;

/**
 * Dịch vụ Chốt Kỳ công & Khóa Điều chỉnh (SOL-BE-024, FR-BE-021, DATA-BE-021).
 *
 * <p>Quy tắc:
 * <ul>
 *   <li>Quản lý kỳ công theo tháng với trạng thái OPEN / LOCKED.</li>
 *   <li>Cung cấp kiểm tra kỳ đã chốt cho nộp/duyệt đơn và điều chỉnh công (trả 409 PERIOD_LOCKED).</li>
 *   <li>Cho phép ADMIN mở lại kỳ công kèm lý do bắt buộc và ghi audit.</li>
 * </ul>
 */
@Slf4j
@Service
public class PayrollPeriodService {

    private final PayrollPeriodRepository payrollPeriodRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final Clock clock;

    @Autowired
    public PayrollPeriodService(
            PayrollPeriodRepository payrollPeriodRepository,
            UserRepository userRepository,
            AuditLogRepository auditLogRepository) {
        this(payrollPeriodRepository, userRepository, auditLogRepository, Clock.systemDefaultZone());
    }

    public PayrollPeriodService(
            PayrollPeriodRepository payrollPeriodRepository,
            UserRepository userRepository,
            AuditLogRepository auditLogRepository,
            Clock clock) {
        this.payrollPeriodRepository = payrollPeriodRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.clock = clock;
    }

    /**
     * Chốt kỳ công theo tháng (HR_MANAGER / ADMIN).
     */
    @Transactional
    public PayrollPeriodResponse lockPeriod(Integer year, Integer month, Long lockedByUserId) {
        validateYearMonth(year, month);

        User lockedBy = userRepository.findById(lockedByUserId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy người chốt ID=" + lockedByUserId));

        Instant now = clock.instant();
        PayrollPeriod period = payrollPeriodRepository.findByPeriodYearAndPeriodMonth(year, month)
                .orElseGet(() -> PayrollPeriod.builder()
                        .periodYear(year)
                        .periodMonth(month)
                        .status(PayrollPeriodStatus.OPEN)
                        .createdAt(now)
                        .updatedAt(now)
                        .build());

        String beforeStatus = period.getStatus().name();
        period.setStatus(PayrollPeriodStatus.LOCKED);
        period.setLockedBy(lockedBy);
        period.setLockedAt(now);
        period.setUpdatedAt(now);

        PayrollPeriod saved = payrollPeriodRepository.save(period);

        // Ghi nhật ký kiểm toán bất biến
        AuditLog auditLog = AuditLog.builder()
                .actor(lockedBy)
                .actorEmail(lockedBy.getEmail())
                .action("LOCK_PAYROLL_PERIOD")
                .entityType("PAYROLL_PERIOD")
                .entityId(saved.getId() != null ? String.valueOf(saved.getId()) : year + "-" + month)
                .beforeState("{\"status\":\"" + beforeStatus + "\"}")
                .afterState("{\"status\":\"LOCKED\",\"year\":" + year + ",\"month\":" + month + "}")
                .build();
        auditLogRepository.save(auditLog);

        log.info("Chốt kỳ công thành công: Tháng {}/{}, bởi ID={}", month, year, lockedByUserId);
        return PayrollPeriodResponse.fromEntity(saved);
    }

    /**
     * Mở lại kỳ công đã chốt (chỉ ADMIN, bắt buộc có lý do).
     */
    @Transactional
    public PayrollPeriodResponse unlockPeriod(Integer year, Integer month, Long unlockedByUserId, String reason) {
        validateYearMonth(year, month);

        if (!StringUtils.hasText(reason)) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Lý do mở lại kỳ công không được để trống");
        }

        User unlockedBy = userRepository.findById(unlockedByUserId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy người mở lại ID=" + unlockedByUserId));

        PayrollPeriod period = payrollPeriodRepository.findByPeriodYearAndPeriodMonth(year, month)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy kỳ công tháng " + month + "/" + year));

        Instant now = clock.instant();
        String beforeStatus = period.getStatus().name();
        period.setStatus(PayrollPeriodStatus.OPEN);
        period.setUnlockedBy(unlockedBy);
        period.setUnlockedAt(now);
        period.setUnlockReason(reason.trim());
        period.setUpdatedAt(now);

        PayrollPeriod saved = payrollPeriodRepository.save(period);

        AuditLog auditLog = AuditLog.builder()
                .actor(unlockedBy)
                .actorEmail(unlockedBy.getEmail())
                .action("UNLOCK_PAYROLL_PERIOD")
                .entityType("PAYROLL_PERIOD")
                .entityId(String.valueOf(saved.getId()))
                .beforeState("{\"status\":\"" + beforeStatus + "\"}")
                .afterState("{\"status\":\"OPEN\",\"reason\":\"" + reason.trim() + "\"}")
                .build();
        auditLogRepository.save(auditLog);

        log.info("Mở lại kỳ công thành công: Tháng {}/{}, bởi ID={}, lý do={}", month, year, unlockedByUserId, reason);
        return PayrollPeriodResponse.fromEntity(saved);
    }

    /**
     * Kiểm tra kỳ công có đang ở trạng thái LOCKED hay không.
     */
    @Transactional(readOnly = true)
    public boolean isPeriodLocked(Integer year, Integer month) {
        return payrollPeriodRepository.findByPeriodYearAndPeriodMonth(year, month)
                .map(p -> p.getStatus() == PayrollPeriodStatus.LOCKED)
                .orElse(false);
    }

    /**
     * Kiểm tra và ném lỗi 409 PERIOD_LOCKED nếu kỳ công tương ứng đã bị chốt.
     */
    @Transactional(readOnly = true)
    public void assertPeriodNotLocked(Integer year, Integer month) {
        if (isPeriodLocked(year, month)) {
            throw new ApiException(ApiErrorCode.PERIOD_LOCKED,
                    "Kỳ công tháng " + month + "/" + year + " đã bị chốt. Không thể thực hiện thao tác.");
        }
    }

    /**
     * Kiểm tra và ném lỗi 409 PERIOD_LOCKED theo ngày cụ thể.
     */
    @Transactional(readOnly = true)
    public void assertPeriodNotLocked(LocalDate date) {
        if (date != null) {
            assertPeriodNotLocked(date.getYear(), date.getMonthValue());
        }
    }

    /**
     * Kiểm tra và ném lỗi 409 PERIOD_LOCKED theo mốc thời gian Instant (múi giờ +07:00).
     */
    @Transactional(readOnly = true)
    public void assertPeriodNotLocked(Instant timestamp) {
        if (timestamp != null) {
            ZonedDateTime zdt = timestamp.atZone(ApiResponse.VIETNAM_ZONE);
            assertPeriodNotLocked(zdt.getYear(), zdt.getMonthValue());
        }
    }

    /**
     * Tra cứu chi tiết một kỳ công theo tháng/năm.
     */
    @Transactional(readOnly = true)
    public PayrollPeriodResponse getPayrollPeriod(Integer year, Integer month) {
        validateYearMonth(year, month);
        PayrollPeriod period = payrollPeriodRepository.findByPeriodYearAndPeriodMonth(year, month)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy kỳ công tháng " + month + "/" + year));
        return PayrollPeriodResponse.fromEntity(period);
    }

    /**
     * Tra cứu danh sách các kỳ công theo năm (hỗ trợ phân trang).
     */
    @Transactional(readOnly = true)
    public Page<PayrollPeriodResponse> getPayrollPeriods(Integer year, Pageable pageable) {
        if (year != null) {
            return payrollPeriodRepository.findByPeriodYear(year, pageable)
                    .map(PayrollPeriodResponse::fromEntity);
        }
        return payrollPeriodRepository.findAll(pageable)
                .map(PayrollPeriodResponse::fromEntity);
    }

    private void validateYearMonth(Integer year, Integer month) {
        if (year == null || year < 2000 || year > 2100) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Năm kỳ công không hợp lệ: " + year);
        }
        if (month == null || month < 1 || month > 12) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Tháng kỳ công không hợp lệ: " + month);
        }
    }
}
