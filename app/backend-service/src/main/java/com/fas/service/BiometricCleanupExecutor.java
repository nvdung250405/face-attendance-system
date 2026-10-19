package com.fas.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fas.data.entity.AuditLog;
import com.fas.data.entity.BiometricTemplate;
import com.fas.data.entity.ConsentWithdrawal;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.BiometricTemplateRepository;
import com.fas.data.repository.ConsentWithdrawalRepository;
import com.fas.data.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Bộ thực thi tiêu hủy dữ liệu sinh trắc học (SOL-BE-008, BLD-BE-017, TASK-BE-018).
 *
 * <p>Được tách khỏi {@link BiometricCleanupService} để các phương thức {@code @Transactional}
 * được Spring AOP proxy áp dụng đúng (tránh lỗi self-invocation khiến bulk delete
 * {@code @Modifying} ném {@code TransactionRequiredException} trong luồng {@code @Scheduled}).</p>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class BiometricCleanupExecutor {

    private final UserRepository userRepository;
    private final BiometricTemplateRepository biometricTemplateRepository;
    private final ConsentWithdrawalRepository consentWithdrawalRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    /**
     * Tiêu hủy vĩnh viễn vector mẫu của nhân sự thôi việc quá thời hạn lưu trữ quy định.
     *
     * @param asOfDate     mốc ngày tính toán
     * @param retentionDays số ngày lưu trữ tối đa
     * @return số lượng nhân sự đã được xóa sạch dữ liệu mẫu sinh trắc
     */
    @Transactional
    public int cleanupTerminatedEmployees(LocalDate asOfDate, int retentionDays) {
        LocalDate thresholdDate = asOfDate.minusDays(retentionDays);
        log.info("Quét danh sách nhân viên thôi việc có terminated_date <= {} (hạn lưu trữ {} ngày)...",
                thresholdDate, retentionDays);

        List<User> terminatedUsers = userRepository.findByStatusAndTerminatedDateLessThanEqual(
                EmployeeStatus.TERMINATED, thresholdDate);

        if (terminatedUsers.isEmpty()) {
            log.debug("Không tìm thấy nhân viên thôi việc quá {} ngày cần tiêu hủy dữ liệu.", retentionDays);
            return 0;
        }

        int cleanedUserCount = 0;
        for (User user : terminatedUsers) {
            List<BiometricTemplate> templates = biometricTemplateRepository.findByUserId(user.getId());
            if (templates.isEmpty()) {
                continue;
            }

            List<Long> templateIds = templates.stream().map(BiometricTemplate::getId).toList();
            biometricTemplateRepository.deleteByUserId(user.getId());

            Map<String, Object> beforeState = Map.of(
                    "userId", user.getId(),
                    "employeeCode", user.getEmployeeCode(),
                    "fullName", user.getFullName(),
                    "status", user.getStatus().name(),
                    "terminatedDate", user.getTerminatedDate() != null ? user.getTerminatedDate().toString() : "UNKNOWN",
                    "retentionDays", retentionDays,
                    "deletedTemplatesCount", templates.size(),
                    "deletedTemplateIds", templateIds,
                    "reason", "TERMINATED_OVER_20_DAYS"
            );

            recordAuditLog(user.getId(), beforeState);
            cleanedUserCount++;
            log.info("Đã xóa vĩnh viễn {} mẫu sinh trắc của nhân viên ID={} ({}) thôi việc ngày {}.",
                    templates.size(), user.getId(), user.getEmployeeCode(), user.getTerminatedDate());
        }

        return cleanedUserCount;
    }

    /**
     * Tiêu hủy vĩnh viễn vector mẫu của các nhân sự đã rút Informed Consent và đã quá hạn hủy.
     *
     * @param asOfInstant mốc thời gian kiểm tra
     * @return số lượng hồ sơ rút consent đã được tiêu hủy
     */
    @Transactional
    public int cleanupWithdrawnConsents(Instant asOfInstant) {
        List<ConsentWithdrawal> dueWithdrawals = consentWithdrawalRepository
                .findByProcessedAtIsNullAndBiometricDisposalDueAtLessThanEqual(asOfInstant);

        if (dueWithdrawals.isEmpty()) {
            log.debug("Không có yêu cầu rút consent đến hạn tiêu hủy sinh trắc học.");
            return 0;
        }

        int processedCount = 0;
        for (ConsentWithdrawal withdrawal : dueWithdrawals) {
            User user = withdrawal.getUser();
            if (user != null) {
                List<BiometricTemplate> templates = biometricTemplateRepository.findByUserId(user.getId());
                if (!templates.isEmpty()) {
                    List<Long> templateIds = templates.stream().map(BiometricTemplate::getId).toList();
                    biometricTemplateRepository.deleteByUserId(user.getId());

                    Map<String, Object> beforeState = Map.of(
                            "userId", user.getId(),
                            "employeeCode", user.getEmployeeCode(),
                            "withdrawalId", withdrawal.getId(),
                            "withdrawnAt", withdrawal.getWithdrawnAt().toString(),
                            "biometricDisposalDueAt", withdrawal.getBiometricDisposalDueAt().toString(),
                            "deletedTemplatesCount", templates.size(),
                            "deletedTemplateIds", templateIds,
                            "reason", "CONSENT_WITHDRAWAL_DUE"
                    );

                    recordAuditLog(user.getId(), beforeState);
                    log.info("Đã xóa vĩnh viễn {} mẫu sinh trắc cho yêu cầu rút consent ID={}, user ID={}.",
                            templates.size(), withdrawal.getId(), user.getId());
                }
            }

            withdrawal.setProcessedAt(asOfInstant);
            consentWithdrawalRepository.save(withdrawal);
            processedCount++;
        }

        return processedCount;
    }

    private void recordAuditLog(Long userId, Map<String, Object> beforeState) {
        String beforeStateJson;
        try {
            beforeStateJson = objectMapper.writeValueAsString(beforeState);
        } catch (JsonProcessingException e) {
            log.warn("Không thể tuần tự hóa before_state sang JSON cho user ID={}: {}", userId, e.getMessage());
            beforeStateJson = String.format("{\"userId\":%d,\"error\":\"SerializationFailed\"}", userId);
        }

        AuditLog auditLog = AuditLog.builder()
                .actor(null)
                .actorEmail("SYSTEM")
                .action("DELETE_BIOMETRIC_DATA")
                .entityType("biometric_templates")
                .entityId(String.valueOf(userId))
                .beforeState(beforeStateJson)
                .afterState(null)
                .ipAddress("SYSTEM")
                .createdAt(Instant.now())
                .build();

        auditLogRepository.save(auditLog);
    }
}
