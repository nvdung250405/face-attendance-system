package com.fas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Dịch vụ Tác vụ Tiêu hủy Dữ liệu Sinh trắc học Định kỳ 20 Ngày (SOL-BE-008, BLD-BE-017, TASK-BE-018).
 *
 * <p>Tuân thủ Luật 91/2025/QH15 và quy định lưu trữ dữ liệu sinh trắc học:
 * <ul>
 *   <li>Cron job chạy định kỳ 01:00 hàng ngày (mặc định {@code 0 0 1 * * ?}).</li>
 *   <li>Quét và xóa cứng (Hard Delete) toàn bộ bản ghi {@code biometric_templates} của nhân viên
 *       đã thôi việc quá 20 ngày ({@code terminated_date <= CURRENT_DATE - 20 days}).</li>
 *   <li>Quét và xóa cứng vector sinh trắc học của các yêu cầu rút Consent đã đến hạn (7 ngày).</li>
 * </ul>
 *
 * <p>Logic giao dịch được ủy thác sang {@link BiometricCleanupExecutor} để {@code @Transactional}
 * được Spring AOP proxy áp dụng đúng trên luồng {@code @Scheduled} (không self-invocation).</p>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class BiometricCleanupService {

    private final BiometricCleanupExecutor cleanupExecutor;

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
        int terminatedCleaned = cleanupExecutor.cleanupTerminatedEmployees(asOfDate, retentionDays);
        int withdrawalsCleaned = cleanupExecutor.cleanupWithdrawnConsents(asOfInstant);
        long duration = System.currentTimeMillis() - startTime;
        return new CleanupReport(terminatedCleaned, withdrawalsCleaned, duration);
    }

    /**
     * Tiêu hủy vĩnh viễn vector mẫu của nhân sự thôi việc quá thời hạn lưu trữ quy định (ủy thác executor).
     *
     * @param asOfDate mốc ngày tính toán
     * @return số lượng nhân sự đã được xóa sạch dữ liệu mẫu sinh trắc
     */
    public int cleanupTerminatedEmployees(LocalDate asOfDate) {
        return cleanupExecutor.cleanupTerminatedEmployees(asOfDate, retentionDays);
    }

    /**
     * Tiêu hủy vĩnh viễn vector mẫu của các nhân sự đã rút Informed Consent và đã quá hạn hủy (ủy thác executor).
     *
     * @param asOfInstant mốc thời gian kiểm tra
     * @return số lượng hồ sơ rút consent đã được tiêu hủy
     */
    public int cleanupWithdrawnConsents(Instant asOfInstant) {
        return cleanupExecutor.cleanupWithdrawnConsents(asOfInstant);
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
