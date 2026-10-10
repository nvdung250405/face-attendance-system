package com.fas.service;

import com.fas.api.dto.PageResponse;
import com.fas.api.dto.request.RegisterKioskRequest;
import com.fas.api.dto.request.UpdateKioskRequest;
import com.fas.api.dto.response.KioskHealthResponse;
import com.fas.api.dto.response.KioskItemResponse;
import com.fas.api.dto.response.RegisterKioskResponse;
import com.fas.api.dto.response.RotateKioskTokenResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.Kiosk;
import com.fas.data.repository.KioskRepository;
import com.fas.service.audit.AuditContextHolder;
import com.fas.service.audit.Auditable;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Dịch vụ Quản lý Vòng đời Trạm Kiosk
 * (TASK-BE-031, BLD-BE-026, SOL-BE-020, FR-BE-017, DATA-BE-019, DD-BE-020).
 *
 * <p>Các chức năng chính:
 * <ul>
 *   <li>Đăng ký trạm Kiosk mới, sinh Secret Token ngẫu nhiên hiển thị duy nhất một lần và lưu băm BCrypt.</li>
 *   <li>Đổi Secret Token: sinh token mới và vô hiệu hóa token cũ ngay lập tức.</li>
 *   <li>Cập nhật thông tin và vô hiệu hóa trạm Kiosk (trạm {@code INACTIVE} bị từ chối ở mọi giao diện Kiosk).</li>
 *   <li>Cung cấp trạng thái kết nối và cảnh báo khi trạm không ping quá 5 phút.</li>
 *   <li>Cập nhật mốc {@code last_ping_at} khi trạm gửi yêu cầu xác thực hợp lệ.</li>
 * </ul>
 */
@Slf4j
@Service
public class KioskAdminService {

    private static final String TOKEN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    private static final int SECRET_TOKEN_LENGTH = 36;
    private static final long HEALTH_WARNING_THRESHOLD_MINUTES = 5;

    private final KioskRepository kioskRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    public KioskAdminService(
            KioskRepository kioskRepository,
            PasswordEncoder passwordEncoder
    ) {
        this(kioskRepository, passwordEncoder, Clock.systemDefaultZone());
    }

    public KioskAdminService(
            KioskRepository kioskRepository,
            PasswordEncoder passwordEncoder,
            Clock clock
    ) {
        this.kioskRepository = kioskRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    /**
     * Đăng ký trạm Kiosk mới kèm Secret Token hiển thị duy nhất một lần (API-BE-032, FR-BE-017).
     *
     * @param request dữ liệu đăng ký trạm
     * @return thông tin trạm kèm mã bí mật chưa băm
     */
    @Auditable(action = "REGISTER_KIOSK", entityType = "KIOSK", entityId = "#result.id", includeState = false)
    @Transactional
    public RegisterKioskResponse registerKiosk(RegisterKioskRequest request) {
        if (request == null || !StringUtils.hasText(request.id()) || !StringUtils.hasText(request.locationName())) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Mã trạm và tên vị trí không được để trống");
        }

        String kioskId = request.id().trim().toUpperCase();
        if (kioskRepository.existsById(kioskId)) {
            log.warn("Đăng ký trạm thất bại: Mã trạm '{}' đã tồn tại", kioskId);
            throw new ApiException(ApiErrorCode.KIOSK_ALREADY_EXISTS, "Mã trạm Kiosk đã tồn tại: " + kioskId);
        }

        // 1. Sinh Secret Token CSPRNG ngẫu nhiên và băm một chiều
        String secretToken = generateSecretToken();
        String secretTokenHash = passwordEncoder.encode(secretToken);

        // 2. Khởi tạo thực thể Kiosk
        Kiosk kiosk = Kiosk.builder()
                .id(kioskId)
                .locationName(request.locationName().trim())
                .secretTokenHash(secretTokenHash)
                .isActive(true)
                .createdAt(clock.instant())
                .build();

        Kiosk saved = kioskRepository.save(kiosk);
        log.info("Đăng ký trạm Kiosk thành công: ID={}, Location={}", saved.getId(), saved.getLocationName());

        return new RegisterKioskResponse(
                saved.getId(),
                saved.getLocationName(),
                secretToken,
                saved.getCreatedAt()
        );
    }

    /**
     * Lấy danh sách các trạm Kiosk có phân trang (API-BE-032, FR-BE-017).
     *
     * @param pageable thông tin phân trang
     * @return danh sách trạm Kiosk phân trang
     */
    @Transactional(readOnly = true)
    public PageResponse<KioskItemResponse> listKiosks(Pageable pageable) {
        Page<Kiosk> page = kioskRepository.findAll(pageable);
        return PageResponse.map(page, this::toKioskItem);
    }

    /**
     * Lấy danh sách toàn bộ các trạm Kiosk đang có trong hệ thống.
     *
     * @return danh sách trạm Kiosk
     */
    @Transactional(readOnly = true)
    public List<KioskItemResponse> listAllKiosks() {
        return kioskRepository.findAll().stream()
                .map(this::toKioskItem)
                .toList();
    }

    /**
     * Lấy thông tin chi tiết một trạm Kiosk theo định danh.
     *
     * @param kioskId mã định danh trạm
     * @return thông tin chi tiết trạm
     */
    @Transactional(readOnly = true)
    public KioskItemResponse getKioskById(String kioskId) {
        Kiosk kiosk = findKioskOrThrow(kioskId);
        return toKioskItem(kiosk);
    }

    /**
     * Đổi Secret Token cho trạm Kiosk (API-BE-033, FR-BE-017, DD-BE-020).
     *
     * <p>Token cũ lập tức bị vô hiệu hóa khi token mới được sinh và băm lưu vào cơ sở dữ liệu.
     *
     * @param kioskId mã định danh trạm cần đổi token
     * @return khóa bí mật mới duy nhất
     */
    @Auditable(action = "ROTATE_KIOSK_TOKEN", entityType = "KIOSK", entityId = "#kioskId", includeState = false)
    @Transactional
    public RotateKioskTokenResponse rotateSecretToken(String kioskId) {
        Kiosk kiosk = findKioskOrThrow(kioskId);

        String newSecretToken = generateSecretToken();
        String newSecretTokenHash = passwordEncoder.encode(newSecretToken);

        kiosk.setSecretTokenHash(newSecretTokenHash);
        kioskRepository.save(kiosk);

        log.info("Đã đổi Secret Token cho trạm Kiosk ID={}, token cũ lập tức bị vô hiệu hóa", kioskId);
        return new RotateKioskTokenResponse(kioskId, newSecretToken, clock.instant());
    }

    /**
     * Cập nhật thông tin hoặc vô hiệu hóa trạm Kiosk (API-BE-033, FR-BE-017).
     *
     * @param kioskId mã định danh trạm
     * @param request dữ liệu cập nhật
     * @return thông tin trạm sau cập nhật
     */
    @Auditable(action = "UPDATE_KIOSK", entityType = "KIOSK", entityId = "#kioskId")
    @Transactional
    public KioskItemResponse updateKiosk(String kioskId, UpdateKioskRequest request) {
        Kiosk kiosk = findKioskOrThrow(kioskId);

        // Chụp trạng thái trước khi thay đổi vào Audit Context
        AuditContextHolder.setBeforeState(mapToAuditState(kiosk));

        if (request != null) {
            if (StringUtils.hasText(request.locationName())) {
                kiosk.setLocationName(request.locationName().trim());
            }
            if (request.isActive() != null) {
                kiosk.setIsActive(request.isActive());
                log.info("Cập nhật trạng thái kích hoạt trạm Kiosk ID={}: isActive={}", kioskId, request.isActive());
            }
        }

        Kiosk saved = kioskRepository.save(kiosk);
        return toKioskItem(saved);
    }

    /**
     * Lấy trạng thái sức khỏe và kết nối của trạm Kiosk (API-BE-034, FR-BE-017).
     *
     * <p>Cảnh báo kết nối khi trạm đang bị vô hiệu hóa hoặc không gửi tín hiệu ping quá 5 phút.
     *
     * @param kioskId mã định danh trạm Kiosk
     * @return trạng thái sức khỏe và cảnh báo
     */
    @Transactional(readOnly = true)
    public KioskHealthResponse getKioskHealth(String kioskId) {
        Kiosk kiosk = findKioskOrThrow(kioskId);
        Instant now = clock.instant();

        boolean isHealthy;
        String warningMessage = null;

        if (Boolean.FALSE.equals(kiosk.getIsActive())) {
            isHealthy = false;
            warningMessage = "Trạm Kiosk đang bị vô hiệu hóa";
        } else if (kiosk.getLastPingAt() == null) {
            isHealthy = false;
            warningMessage = "Trạm Kiosk chưa từng gửi tín hiệu ping";
        } else {
            long minutesSinceLastPing = Duration.between(kiosk.getLastPingAt(), now).toMinutes();
            if (minutesSinceLastPing > HEALTH_WARNING_THRESHOLD_MINUTES) {
                isHealthy = false;
                warningMessage = String.format("Trạm Kiosk mất kết nối quá %d phút (lần cuối: %s)",
                        HEALTH_WARNING_THRESHOLD_MINUTES, kiosk.getLastPingAt());
            } else {
                isHealthy = true;
            }
        }

        return new KioskHealthResponse(
                kiosk.getId(),
                kiosk.getLocationName(),
                kiosk.getIsActive(),
                kiosk.getLastPingAt(),
                isHealthy,
                warningMessage
        );
    }

    /**
     * Ghi nhận lượt ping hoặc yêu cầu xác thực hợp lệ từ trạm Kiosk (DATA-BE-019).
     *
     * @param kioskId mã định danh trạm Kiosk
     */
    @Transactional
    public void recordPing(String kioskId) {
        if (!StringUtils.hasText(kioskId)) {
            return;
        }

        kioskRepository.findById(kioskId).ifPresent(kiosk -> {
            if (Boolean.TRUE.equals(kiosk.getIsActive())) {
                kiosk.setLastPingAt(clock.instant());
                kioskRepository.save(kiosk);
                log.debug("Đã cập nhật mốc ping cho trạm Kiosk ID={}", kioskId);
            }
        });
    }

    private Kiosk findKioskOrThrow(String kioskId) {
        if (!StringUtils.hasText(kioskId)) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Mã trạm Kiosk không được để trống");
        }
        return kioskRepository.findById(kioskId.trim().toUpperCase())
                .orElseThrow(() -> new ApiException(ApiErrorCode.KIOSK_NOT_FOUND, "Không tìm thấy trạm Kiosk: " + kioskId));
    }

    private KioskItemResponse toKioskItem(Kiosk kiosk) {
        Instant now = clock.instant();
        boolean isOnline = Boolean.TRUE.equals(kiosk.getIsActive())
                && kiosk.getLastPingAt() != null
                && Duration.between(kiosk.getLastPingAt(), now).toMinutes() <= HEALTH_WARNING_THRESHOLD_MINUTES;

        return new KioskItemResponse(
                kiosk.getId(),
                kiosk.getLocationName(),
                kiosk.getIsActive(),
                kiosk.getLastPingAt(),
                kiosk.getCreatedAt(),
                isOnline
        );
    }

    private Map<String, Object> mapToAuditState(Kiosk kiosk) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("id", kiosk.getId());
        state.put("locationName", kiosk.getLocationName());
        state.put("isActive", kiosk.getIsActive());
        state.put("lastPingAt", kiosk.getLastPingAt() != null ? kiosk.getLastPingAt().toString() : null);
        return state;
    }

    private String generateSecretToken() {
        StringBuilder sb = new StringBuilder(SECRET_TOKEN_LENGTH);
        for (int i = 0; i < SECRET_TOKEN_LENGTH; i++) {
            sb.append(TOKEN_CHARS.charAt(secureRandom.nextInt(TOKEN_CHARS.length())));
        }
        return sb.toString();
    }
}
