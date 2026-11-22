package com.fas.service;

import com.fas.api.dto.response.ConsentWithdrawalResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.AuditLog;
import com.fas.data.entity.BiometricTemplate;
import com.fas.data.entity.ConsentWithdrawal;
import com.fas.data.entity.User;
import com.fas.data.enums.NotificationEventType;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.BiometricTemplateRepository;
import com.fas.data.repository.ConsentWithdrawalRepository;
import com.fas.data.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Dịch vụ Rút Informed Consent & Tiêu hủy Sinh trắc (SOL-BE-025, FR-BE-022, DATA-BE-023).
 *
 * <p>Quy tắc:
 * <ul>
 *   <li>Ghi vết rút Informed Consent bất biến (thời điểm, IP, hạn tiêu hủy sinh trắc 7 ngày).</li>
 *   <li>Vô hiệu hóa khuôn mặt ngay lập tức: loại nhân sự khỏi gallery Kiosk và chặn sinh OTP mới.</li>
 *   <li>Sinh thông báo trong ứng dụng cho nhân viên.</li>
 *   <li>Ghi nhật ký kiểm toán bất biến.</li>
 * </ul>
 */
@Slf4j
@Service
public class ConsentWithdrawalService {

    public static final Duration BIOMETRIC_DISPOSAL_WINDOW = Duration.ofDays(7);

    private final ConsentWithdrawalRepository consentWithdrawalRepository;
    private final UserRepository userRepository;
    private final BiometricTemplateRepository biometricTemplateRepository;
    private final NotificationService notificationService;
    private final AuditLogRepository auditLogRepository;
    private final Clock clock;

    @Autowired
    public ConsentWithdrawalService(
            ConsentWithdrawalRepository consentWithdrawalRepository,
            UserRepository userRepository,
            BiometricTemplateRepository biometricTemplateRepository,
            NotificationService notificationService,
            AuditLogRepository auditLogRepository) {
        this(consentWithdrawalRepository, userRepository, biometricTemplateRepository, notificationService, auditLogRepository, Clock.systemDefaultZone());
    }

    public ConsentWithdrawalService(
            ConsentWithdrawalRepository consentWithdrawalRepository,
            UserRepository userRepository,
            BiometricTemplateRepository biometricTemplateRepository,
            NotificationService notificationService,
            AuditLogRepository auditLogRepository,
            Clock clock) {
        this.consentWithdrawalRepository = consentWithdrawalRepository;
        this.userRepository = userRepository;
        this.biometricTemplateRepository = biometricTemplateRepository;
        this.notificationService = notificationService;
        this.auditLogRepository = auditLogRepository;
        this.clock = clock;
    }

    /**
     * Nhân viên rút lại cam kết Informed Consent.
     */
    @Transactional
    public ConsentWithdrawalResponse withdrawConsent(Long userId, String clientIp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên ID=" + userId));

        Instant now = clock.instant();
        Instant disposalDueAt = now.plus(BIOMETRIC_DISPOSAL_WINDOW);

        // 1. Vô hiệu hóa template sinh trắc học hiện tại (loại khỏi gallery cấp cho Kiosk)
        List<BiometricTemplate> templates = biometricTemplateRepository.findByUserId(userId);
        if (!templates.isEmpty()) {
            templates.forEach(t -> t.setIsActive(false));
            biometricTemplateRepository.saveAll(templates);
            log.info("Đã vô hiệu hóa {} template sinh trắc học của nhân viên ID={}", templates.size(), userId);
        }

        // 2. Ghi nhận vết rút Consent bất biến
        ConsentWithdrawal withdrawal = ConsentWithdrawal.builder()
                .user(user)
                .withdrawnAt(now)
                .clientIp(clientIp != null ? clientIp : "127.0.0.1")
                .biometricDisposalDueAt(disposalDueAt)
                .createdAt(now)
                .build();

        ConsentWithdrawal saved = consentWithdrawalRepository.save(withdrawal);

        // 3. Sinh thông báo trong ứng dụng cho nhân viên
        notificationService.createNotification(
                userId,
                NotificationEventType.CONSENT_WITHDRAWN,
                "Rút Informed Consent thành công",
                "Bạn đã rút Informed Consent. Dữ liệu sinh trắc học khuôn mặt đã bị vô hiệu hóa và sẽ được tiêu hủy trong vòng 7 ngày.",
                "CONSENT_WITHDRAWAL",
                String.valueOf(saved.getId())
        );

        // 4. Ghi nhật ký kiểm toán bất biến
        AuditLog auditLog = AuditLog.builder()
                .actor(user)
                .actorEmail(user.getEmail())
                .action("WITHDRAW_CONSENT")
                .entityType("CONSENT_WITHDRAWAL")
                .entityId(String.valueOf(saved.getId()))
                .beforeState("{\"consentActive\":true}")
                .afterState("{\"consentActive\":false,\"disposalDueAt\":\"" + disposalDueAt + "\"}")
                .build();
        auditLogRepository.save(auditLog);

        log.info("Nhân viên ID={} đã rút Consent thành công: ID={}, Hạn tiêu hủy={}", userId, saved.getId(), disposalDueAt);
        return ConsentWithdrawalResponse.fromEntity(saved);
    }

    /**
     * Kiểm tra xem nhân viên đã từng rút Consent mà chưa ký lại hay không.
     */
    @Transactional(readOnly = true)
    public boolean hasWithdrawnConsent(Long userId) {
        return consentWithdrawalRepository.findFirstByUserIdOrderByWithdrawnAtDesc(userId).isPresent();
    }

    /**
     * Chặn thao tác nếu nhân viên đã rút Informed Consent (ví dụ khi sinh OTP hoặc đăng ký khuôn mặt).
     */
    @Transactional(readOnly = true)
    public void assertConsentActive(Long userId) {
        if (hasWithdrawnConsent(userId)) {
            throw new ApiException(ApiErrorCode.ACCESS_DENIED,
                    "Nhân viên đã rút Informed Consent. Không thể sinh mã OTP hoặc đăng ký khuôn mặt.");
        }
    }

    /**
     * Lấy thông tin vết rút Consent gần nhất của nhân viên.
     */
    @Transactional(readOnly = true)
    public Optional<ConsentWithdrawalResponse> getLatestWithdrawal(Long userId) {
        return consentWithdrawalRepository.findFirstByUserIdOrderByWithdrawnAtDesc(userId)
                .map(ConsentWithdrawalResponse::fromEntity);
    }

    /**
     * Tra cứu toàn bộ danh sách các lượt rút Consent (phục vụ DPO kiểm toán).
     */
    @Transactional(readOnly = true)
    public Page<ConsentWithdrawalResponse> getAllWithdrawals(Pageable pageable) {
        return consentWithdrawalRepository.findAllByOrderByWithdrawnAtDesc(pageable)
                .map(ConsentWithdrawalResponse::fromEntity);
    }
}
