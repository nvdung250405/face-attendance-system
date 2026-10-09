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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Dịch vụ Tác vụ Tiêu hủy Dữ liệu Sinh trắc học Định kỳ 20 Ngày (SOL-BE-008, BLD-BE-017, TASK-BE-018).
 *
 * <p>Tuân thủ Luật 91/2025/QH15 và quy định lưu trữ dữ liệu sinh trắc học:
 * <ul>
 *   <li>Cron job chạy định kỳ 01:00 hàng ngày (mặc định {@code 0 0 1 * * ?}).</li>
 *   <li>Quét và xóa cứng (Hard Delete) toàn bộ bản ghi {@code biometric_templates} của nhân viên
 *       đã thôi việc quá 20 ngày ({@code terminated_date <= CURRENT_DATE - 20 days}).</li>
 *   <li>Quét và xóa cứng vector sinh trắc học của các yêu cầu rút Consent đã đến hạn (7 ngày).</li>
 *   <li>Ghi vết kiểm toán bất biến vào {@code audit_logs} với {@code action = DELETE_BIOMETRIC_DATA},
 *       {@code actor_id = NULL} (Hệ thống).</li>
 * </ul>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class BiometricCleanupService {

    private final UserRepository userRepository;
    private final BiometricTemplateRepository biometricTemplateRepository;
    private final ConsentWithdrawalRepository consentWithdrawalRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Value("${fas.compliance.data-retention-days:20}")
    private int retentionDays = 20;

    /**
     * Tác vụ định kỳ theo lịch trình Spring Scheduling (mặc định 01:00 hàng ngày).
     */
    @Scheduled(cron = "${fas.scheduler.biometric-cleanup.cron:0 0 1 * * ?}")
    public void runScheduledCleanup() {
        log.info("Kích hoạt tác vụ nền tiêu hủy dữ liệu sinh trắc học định kỳ (SOL-BE-008)...");
        CleanupReport report = cleanupAll(LocalDate.now(), Instant.now());
        log.info("Hoàn tất tác vụ nền tiêu hủy dữ liệu sinh trắc học: {} nhân viên thôi việc > {} ngày, " +
                        "{} yêu cầu rút consent đã xử lý (Thời gian: {} ms)",
                report.terminatedUsersCleaned(), retentionDays,
                report.consentWithdrawalsCleaned(), report.executionDurationMs());
    }

    /**
     * Thực thi đồng thời cả hai quy trình tiêu hủy dữ liệu sinh trắc học.
     *
     * @param asOfDate    mốc ngày kiểm tra nhân sự thôi việc
     * @param asOfInstant mốc thời gian kiểm tra yêu cầu rút consent
     * @return báo cáo tổng kết kết quả tiêu hủy dữ liệu
     */
    public CleanupReport cleanupAll(LocalDate asOfDate, Instant asOfInstant) {
        long startTime = System.currentTimeMillis();
        int terminatedCleaned = cleanupTerminatedEmployees(asOfDate);
        int withdrawalsCleaned = cleanupWithdrawnConsents(asOfInstant);
        long duration = System.currentTimeMillis() - startTime;
        return new CleanupReport(terminatedCleaned, withdrawalsCleaned, duration);
    }

    /**
     * Tiêu hủy vĩnh viễn vector mẫu của nhân sự thôi việc quá thời hạn lưu trữ quy định (mặc định 20 ngày).
     *
     * @param asOfDate mốc ngày tính toán
     * @return số lượng nhân sự đã được xóa sạch dữ liệu mẫu sinh trắc
     */
    @Transactional
    public int cleanupTerminatedEmployees(LocalDate asOfDate) {
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
     * Tiêu hủy vĩnh viễn vector mẫu của các nhân sự đã rút Informed Consent và đã quá hạn hủy (7 ngày).
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

    /**
     * Bản ghi tổng kết kết quả thực thi tiêu hủy dữ liệu sinh trắc học.
     */
    public record CleanupReport(
            int terminatedUsersCleaned,
            int consentWithdrawalsCleaned,
            long executionDurationMs
    ) {}
}
