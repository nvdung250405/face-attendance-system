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
import jakarta.persistence.criteria.Predicate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Dịch vụ Tra cứu Nhật ký Kiểm toán & Tuân thủ Dữ liệu Cá nhân
 * (TASK-BE-031, BLD-BE-026, SOL-BE-019, FR-BE-016, DATA-BE-020, DD-BE-019).
 *
 * <p>Toàn bộ các thao tác trong dịch vụ này đều là CHỈ ĐỌC (Read-Only):
 * <ul>
 *   <li>Tra cứu nhật ký kiểm toán bất biến theo khoảng thời gian, tác nhân, loại hành vi (dành cho ADMIN).</li>
 *   <li>Tra cứu dữ liệu thỏa thuận Informed Consent (dành cho DPO).</li>
 *   <li>Tra cứu lịch trình lưu trữ và tiêu hủy dữ liệu sinh trắc học 20 ngày / 7 ngày (dành cho DPO).</li>
 * </ul>
 * Không tồn tại bất kỳ phương thức sửa hoặc xóa nào đối với {@code audit_logs}.
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class AuditQueryService {

    private final AuditLogRepository auditLogRepository;
    private final EnrollmentSessionRepository enrollmentSessionRepository;
    private final ConsentWithdrawalRepository consentWithdrawalRepository;
    private final UserRepository userRepository;
    private final BiometricTemplateRepository biometricTemplateRepository;
    private final Clock clock;

    @Autowired
    public AuditQueryService(
            AuditLogRepository auditLogRepository,
            EnrollmentSessionRepository enrollmentSessionRepository,
            ConsentWithdrawalRepository consentWithdrawalRepository,
            UserRepository userRepository,
            BiometricTemplateRepository biometricTemplateRepository
    ) {
        this(auditLogRepository, enrollmentSessionRepository, consentWithdrawalRepository,
                userRepository, biometricTemplateRepository, Clock.systemDefaultZone());
    }

    public AuditQueryService(
            AuditLogRepository auditLogRepository,
            EnrollmentSessionRepository enrollmentSessionRepository,
            ConsentWithdrawalRepository consentWithdrawalRepository,
            UserRepository userRepository,
            BiometricTemplateRepository biometricTemplateRepository,
            Clock clock
    ) {
        this.auditLogRepository = auditLogRepository;
        this.enrollmentSessionRepository = enrollmentSessionRepository;
        this.consentWithdrawalRepository = consentWithdrawalRepository;
        this.userRepository = userRepository;
        this.biometricTemplateRepository = biometricTemplateRepository;
        this.clock = clock;
    }

    /**
     * Tra cứu nhật ký kiểm toán bất biến có lọc và phân trang (API-BE-030, FR-BE-016).
     *
     * @param criteria tiêu chí lọc (thời gian, tác nhân, hành vi, loại thực thể)
     * @param pageable thông tin phân trang và sắp xếp
     * @return danh sách nhật ký kiểm toán phân trang
     */
    public PageResponse<AuditLogItemResponse> queryAuditLogs(AuditLogFilterCriteria criteria, Pageable pageable) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria != null) {
                if (criteria.from() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), criteria.from()));
                }
                if (criteria.to() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), criteria.to()));
                }
                if (criteria.actorId() != null) {
                    predicates.add(cb.equal(root.get("actor").get("id"), criteria.actorId()));
                }
                if (StringUtils.hasText(criteria.action())) {
                    predicates.add(cb.equal(root.get("action"), criteria.action().trim()));
                }
                if (StringUtils.hasText(criteria.entityType())) {
                    predicates.add(cb.equal(root.get("entityType"), criteria.entityType().trim()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AuditLog> page = auditLogRepository.findAll(spec, pageable);
        return PageResponse.map(page, this::toAuditLogItem);
    }

    /**
     * Tra cứu lịch sử thỏa thuận Informed Consent phục vụ Cán bộ Bảo vệ Dữ liệu DPO (API-BE-031, FR-BE-016).
     *
     * @param pageable thông tin phân trang
     * @return danh sách bản ghi Consent phân trang
     */
    public PageResponse<ConsentRecordItem> queryConsents(Pageable pageable) {
        Page<EnrollmentSession> page = enrollmentSessionRepository.findAllByOrderByConsentSignedAtDesc(pageable);
        return PageResponse.map(page, this::toConsentRecordItem);
    }

    /**
     * Tra cứu lịch trình tiêu hủy dữ liệu sinh trắc học của nhân sự thôi việc (mốc 20 ngày theo SOL-BE-008, API-BE-031).
     *
     * @param pageable thông tin phân trang
     * @return danh sách lịch trình tiêu hủy nhân sự thôi việc
     */
    public PageResponse<RetentionScheduleItem> queryRetentionSchedule(Pageable pageable) {
        Page<User> terminatedUsers = userRepository.findByStatusOrderByTerminatedDateDesc(
                EmployeeStatus.TERMINATED, pageable);

        LocalDate today = LocalDate.now(clock);

        return PageResponse.map(terminatedUsers, user -> {
            LocalDate termDate = user.getTerminatedDate();
            String termDateStr = termDate != null ? termDate.toString() : "N/A";
            String scheduledDateStr = termDate != null ? termDate.plusDays(20).toString() : "N/A";

            // Kiểm tra mẫu sinh trắc học còn tồn tại không
            boolean hasTemplates = biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId()).isPresent()
                    || !biometricTemplateRepository.findByUserId(user.getId()).isEmpty();
            boolean isDisposed = !hasTemplates;

            return new RetentionScheduleItem(
                    user.getId(),
                    user.getEmployeeCode(),
                    user.getFullName(),
                    user.getEmail(),
                    termDateStr,
                    scheduledDateStr,
                    isDisposed,
                    isDisposed && termDate != null && !termDate.plusDays(20).isAfter(today) ? user.getUpdatedAt() : null,
                    "EMPLOYEE_TERMINATION"
            );
        });
    }

    /**
     * Tra cứu lịch trình tiêu hủy dữ liệu của các yêu cầu rút Informed Consent (mốc 7 ngày theo FR-BE-022, API-BE-031).
     *
     * @param pageable thông tin phân trang
     * @return danh sách yêu cầu rút consent và mốc tiêu hủy
     */
    public PageResponse<RetentionScheduleItem> queryConsentWithdrawals(Pageable pageable) {
        Page<ConsentWithdrawal> withdrawals = consentWithdrawalRepository.findAllByOrderByWithdrawnAtDesc(pageable);

        return PageResponse.map(withdrawals, w -> {
            User user = w.getUser();
            String employeeCode = user != null ? user.getEmployeeCode() : "N/A";
            String fullName = user != null ? user.getFullName() : "N/A";
            String email = user != null ? user.getEmail() : "N/A";

            return new RetentionScheduleItem(
                    w.getId(),
                    employeeCode,
                    fullName,
                    email,
                    w.getWithdrawnAt().toString(),
                    w.getBiometricDisposalDueAt().toString(),
                    w.getProcessedAt() != null,
                    w.getProcessedAt(),
                    "CONSENT_WITHDRAWAL"
            );
        });
    }

    private AuditLogItemResponse toAuditLogItem(AuditLog log) {
        return new AuditLogItemResponse(
                log.getId(),
                log.getActor() != null ? log.getActor().getId() : null,
                log.getActorEmail(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getBeforeState(),
                log.getAfterState(),
                log.getIpAddress(),
                log.getCreatedAt()
        );
    }

    private ConsentRecordItem toConsentRecordItem(EnrollmentSession s) {
        User u = s.getUser();
        return new ConsentRecordItem(
                s.getId(),
                u != null ? u.getId() : null,
                u != null ? u.getEmployeeCode() : null,
                u != null ? u.getFullName() : null,
                u != null ? u.getEmail() : null,
                s.getConsentVersion(),
                s.getConsentSignedAt(),
                s.getClientIp(),
                s.getIsUsed()
        );
    }
}
