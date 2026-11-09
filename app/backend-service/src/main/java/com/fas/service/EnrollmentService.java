package com.fas.service;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.event.GalleryUpdateEvent;
import com.fas.api.dto.request.ConsentRequest;
import com.fas.api.dto.request.KioskEnrollFaceRequest;
import com.fas.api.dto.request.KioskVerifyOtpRequest;
import com.fas.api.dto.request.PoseTemplateDto;
import com.fas.api.dto.response.ConsentResult;
import com.fas.api.dto.response.EnrollmentResult;
import com.fas.api.dto.response.GalleryItem;
import com.fas.api.dto.response.GalleryResponse;
import com.fas.api.dto.response.OtpVerificationResult;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.websocket.StompEventBroadcaster;
import com.fas.data.crypto.BiometricCryptoService;
import com.fas.data.entity.BiometricTemplate;
import com.fas.data.entity.EnrollmentSession;
import com.fas.data.entity.Kiosk;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.PoseType;
import com.fas.data.repository.BiometricTemplateRepository;
import com.fas.data.repository.EnrollmentSessionRepository;
import com.fas.data.repository.KioskRepository;
import com.fas.data.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Dịch vụ Quản lý Đăng ký Khuôn mặt & Vòng đời OTP 48h (SOL-BE-005, SOL-BE-013, BLD-BE-013, TASK-BE-015).
 *
 * <p>Quy trình nghiệp vụ 3 bước:
 * <ol>
 *   <li><b>Ký thỏa thuận Informed Consent & Sinh OTP (Web)</b>: Tạo phiên {@code enrollment_sessions},
 *       sinh mã OTP 6 số ngẫu nhiên băm BCrypt với hiệu lực 48 giờ.</li>
 *   <li><b>Thẩm định OTP tại trạm Kiosk</b>: Kiểm tra tính hợp lệ và thời hạn OTP, cấp {@code sessionToken}
 *       tạm thời có hiệu lực 15 phút.</li>
 *   <li><b>Nạp vector khuôn mặt & Kích hoạt nhân sự</b>: Thẩm định {@code sessionToken}, mã hóa vector 512D
 *       bằng AES-256-GCM qua {@link BiometricCryptoService}, lưu {@link BiometricTemplate}, chuyển trạng thái
 *       nhân viên sang {@link EmployeeStatus#ACTIVE}, đánh dấu OTP đã dùng và phát sóng STOMP nạp nóng.</li>
 * </ol>
 */
@Service
public class EnrollmentService {

    private static final Logger logger = LoggerFactory.getLogger(EnrollmentService.class);

    private static final int OTP_VALIDITY_HOURS = 48;
    private static final int SESSION_TOKEN_TTL_MINUTES = 15;

    /** Chặn brute-force OTP: tối đa 20 lần thử sai liên tiếp mỗi trạm trong 15 phút. */
    private static final int MAX_OTP_FAILED_ATTEMPTS = 20;
    private static final int OTP_LOCKOUT_MINUTES = 15;

    private final UserRepository userRepository;
    private final EnrollmentSessionRepository enrollmentSessionRepository;
    private final BiometricTemplateRepository biometricTemplateRepository;
    private final KioskRepository kioskRepository;
    private final BiometricCryptoService biometricCryptoService;
    private final StompEventBroadcaster stompEventBroadcaster;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    /** Bộ nhớ đệm tạm thời lưu trữ các sessionToken đã xác minh hợp lệ tại trạm Kiosk. */
    private final ConcurrentMap<String, VerifiedSession> verifiedSessions = new ConcurrentHashMap<>();

    /** Bộ đếm lần thử OTP sai liên tiếp theo kioskId (chống brute-force). */
    private final ConcurrentMap<String, OtpFailedAttemptRecord> otpFailedAttempts = new ConcurrentHashMap<>();

    public EnrollmentService(
            UserRepository userRepository,
            EnrollmentSessionRepository enrollmentSessionRepository,
            BiometricTemplateRepository biometricTemplateRepository,
            KioskRepository kioskRepository,
            BiometricCryptoService biometricCryptoService,
            StompEventBroadcaster stompEventBroadcaster,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.enrollmentSessionRepository = enrollmentSessionRepository;
        this.biometricTemplateRepository = biometricTemplateRepository;
        this.kioskRepository = kioskRepository;
        this.biometricCryptoService = biometricCryptoService;
        this.stompEventBroadcaster = stompEventBroadcaster;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Bước 1: Tiếp nhận cam kết Informed Consent và sinh mã OTP 6 số có hạn 48 giờ.
     *
     * @param userId   định danh nhân viên ký cam kết trên Web Portal
     * @param request  dữ liệu cam kết gồm cờ đồng thuận và phiên bản chính sách
     * @param clientIp địa chỉ IP của thiết bị thực hiện ký
     * @return kết quả ký cam kết chứa mã OTP, ảnh QR và mốc hết hạn
     */
    @Transactional
    public ConsentResult createConsentSession(Long userId, ConsentRequest request, String clientIp) {
        if (request == null || Boolean.FALSE.equals(request.agreed())) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Cần đồng ý với thỏa thuận Informed Consent để tiếp tục");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên với ID: " + userId));

        if (user.getStatus() == EmployeeStatus.TERMINATED) {
            throw new ApiException(ApiErrorCode.ACCESS_DENIED, "Tài khoản nhân viên đã thôi việc, không thể đăng ký khuôn mặt");
        }

        Instant now = Instant.now();
        Instant expiresAt = now.plus(OTP_VALIDITY_HOURS, ChronoUnit.HOURS);

        // Sinh mã OTP 6 chữ số cryptographically secure
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        String otpHash = passwordEncoder.encode(otp);

        EnrollmentSession session = EnrollmentSession.builder()
                .user(user)
                .otpHash(otpHash)
                .consentVersion(request.consentVersion())
                .consentSignedAt(now)
                .clientIp(clientIp != null && !clientIp.isBlank() ? clientIp : "127.0.0.1")
                .expiresAt(expiresAt)
                .isUsed(false)
                .createdAt(now)
                .build();

        enrollmentSessionRepository.save(session);
        logger.info("Khởi tạo phiên đăng ký OTP thành công: userId={}, expiresAt={}", userId, expiresAt);

        OffsetDateTime expiresAtOffset = OffsetDateTime.ofInstant(expiresAt, ApiResponse.VIETNAM_ZONE);
        OffsetDateTime consentSignedAtOffset = OffsetDateTime.ofInstant(now, ApiResponse.VIETNAM_ZONE);
        String qrCodeDataUrl = "otp:" + otp;
        String notice = "Mã OTP gồm 6 chữ số có hiệu lực trong 48 giờ. Vui lòng sử dụng mã này hoặc mã QR tại trạm Kiosk gần nhất để hoàn tất đăng ký nhận diện khuôn mặt.";

        return new ConsentResult(otp, qrCodeDataUrl, expiresAtOffset, consentSignedAtOffset, notice);
    }

    /**
     * Bước 2: Thẩm định mã OTP tại trạm Kiosk và cấp token phiên tạm thời.
     *
     * @param request yêu cầu thẩm định chứa mã OTP và kioskId
     * @return kết quả thẩm định chứa thông tin nhân sự và sessionToken
     */
    @Transactional(readOnly = true)
    public OtpVerificationResult verifyOtp(KioskVerifyOtpRequest request) {
        if (request == null || request.otp() == null || request.otp().isBlank()) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Mã OTP không được để trống");
        }

        validateKiosk(request.kioskId());
        checkOtpAttemptLockout(request.kioskId());

        Instant now = Instant.now();
        List<EnrollmentSession> activeSessions = enrollmentSessionRepository.findByIsUsedFalseAndExpiresAtAfter(now);
        EnrollmentSession matchedSession = null;

        for (EnrollmentSession session : activeSessions) {
            if (passwordEncoder.matches(request.otp(), session.getOtpHash())) {
                matchedSession = session;
                break;
            }
        }

        if (matchedSession == null) {
            // Đối soát có giới hạn với các phiên đã sử dụng gần đây để trả mã lỗi chính xác
            List<EnrollmentSession> recentlyUsedSessions = enrollmentSessionRepository
                    .findTop100ByIsUsedTrueOrderByCreatedAtDesc();
            for (EnrollmentSession session : recentlyUsedSessions) {
                if (passwordEncoder.matches(request.otp(), session.getOtpHash())) {
                    recordOtpFailure(request.kioskId());
                    throw new ApiException(ApiErrorCode.OTP_ALREADY_USED, "Mã OTP này đã được sử dụng");
                }
            }

            // Đối soát có giới hạn với các phiên chưa dùng nhưng đã hết hạn gần đây
            List<EnrollmentSession> recentlyExpiredSessions = enrollmentSessionRepository
                    .findTop100ByIsUsedFalseAndExpiresAtLessThanEqualOrderByCreatedAtDesc(now);
            for (EnrollmentSession session : recentlyExpiredSessions) {
                if (passwordEncoder.matches(request.otp(), session.getOtpHash())) {
                    recordOtpFailure(request.kioskId());
                    throw new ApiException(ApiErrorCode.OTP_EXPIRED, "Mã OTP đã hết hạn");
                }
            }

            recordOtpFailure(request.kioskId());
            throw new ApiException(ApiErrorCode.OTP_INVALID, "Mã OTP không đúng hoặc không tồn tại");
        }

        otpFailedAttempts.remove(request.kioskId());

        User user = matchedSession.getUser();
        if (user == null || user.getStatus() == EmployeeStatus.TERMINATED) {
            throw new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Nhân sự không tồn tại hoặc đã thôi việc");
        }

        // Cấp sessionToken ngẫu nhiên bảo mật
        String sessionToken = UUID.randomUUID().toString().replace("-", "");
        verifiedSessions.put(sessionToken, new VerifiedSession(matchedSession.getId(), user.getId(), now, request.kioskId()));
        logger.info("Thẩm định OTP thành công tại Kiosk {}: userId={}, employeeCode={}",
                request.kioskId(), user.getId(), user.getEmployeeCode());

        return new OtpVerificationResult(
                sessionToken,
                user.getId(),
                user.getEmployeeCode(),
                user.getFullName(),
                user.getDepartment()
        );
    }

    /**
     * Bước 3: Nạp vector ArcFace 512D mới, mã hóa AES-256-GCM, kích hoạt ACTIVE và phát sóng STOMP.
     *
     * @param request yêu cầu nạp vector chứa OTP, sessionToken, vector512 và kioskId
     * @return kết quả kích hoạt mẫu sinh trắc học
     */
    @Transactional
    public EnrollmentResult enrollFace(KioskEnrollFaceRequest request) {
        if (request == null) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Yêu cầu đăng ký không được rỗng");
        }

        validateKiosk(request.kioskId());

        VerifiedSession tokenData = request.sessionToken() != null ? verifiedSessions.remove(request.sessionToken()) : null;
        if (tokenData == null) {
            throw new ApiException(ApiErrorCode.OTP_INVALID, "Phiên xác minh OTP không tồn tại hoặc đã hết hiệu lực");
        }

        if (Duration.between(tokenData.verifiedAt(), Instant.now()).toMinutes() > SESSION_TOKEN_TTL_MINUTES) {
            throw new ApiException(ApiErrorCode.OTP_EXPIRED, "Phiên xác minh OTP tại Kiosk đã quá hạn 15 phút");
        }

        EnrollmentSession session = enrollmentSessionRepository.findById(tokenData.sessionId())
                .orElseThrow(() -> new ApiException(ApiErrorCode.OTP_INVALID, "Không tìm thấy phiên đăng ký"));

        Instant now = Instant.now();
        if (Boolean.TRUE.equals(session.getIsUsed())) {
            throw new ApiException(ApiErrorCode.OTP_ALREADY_USED, "Mã OTP này đã được sử dụng");
        }
        if (session.getExpiresAt().isBefore(now)) {
            throw new ApiException(ApiErrorCode.OTP_EXPIRED, "Mã OTP đã hết hạn");
        }
        if (!passwordEncoder.matches(request.otp(), session.getOtpHash())) {
            throw new ApiException(ApiErrorCode.OTP_INVALID, "Mã OTP không khớp với phiên xác minh");
        }

        // Phân định chế độ Multi-Template vs Legacy Single-Vector
        boolean hasTemplates = request.templates() != null && !request.templates().isEmpty();
        boolean hasLegacyVector = request.vector512() != null && !request.vector512().isEmpty();

        if (!hasTemplates && !hasLegacyVector) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED,
                    "Yêu cầu đăng ký phải chứa danh sách templates hoặc vector512 đơn");
        }

        Map<PoseType, List<Float>> vectorMap = new EnumMap<>(PoseType.class);

        if (hasTemplates) {
            // Chế độ Multi-Template: Bắt buộc đúng 3 phần tử
            if (request.templates().size() != 3) {
                throw new ApiException(ApiErrorCode.INVALID_TEMPLATE_SET,
                        "Bộ mẫu sinh trắc học bắt buộc phải gồm đúng 3 tư thế phân biệt: FRONTAL, LEFT_TILT, RIGHT_TILT");
            }

            Set<PoseType> poseTypes = EnumSet.noneOf(PoseType.class);
            for (PoseTemplateDto templateDto : request.templates()) {
                if (templateDto == null || templateDto.poseType() == null || templateDto.poseType().isBlank()) {
                    throw new ApiException(ApiErrorCode.INVALID_TEMPLATE_SET,
                            "Tư thế khuôn mặt không được để trống");
                }

                PoseType poseType;
                try {
                    poseType = PoseType.valueOf(templateDto.poseType().trim().toUpperCase(Locale.ROOT));
                } catch (IllegalArgumentException ex) {
                    throw new ApiException(ApiErrorCode.INVALID_TEMPLATE_SET,
                            "Tư thế khuôn mặt không hợp lệ: " + templateDto.poseType());
                }

                if (!poseTypes.add(poseType)) {
                    throw new ApiException(ApiErrorCode.INVALID_TEMPLATE_SET,
                            "Bộ mẫu sinh trắc học chứa tư thế trùng lặp: " + poseType);
                }

                List<Float> vector = templateDto.vector512();
                validateVectorDimensionAndNorm(vector, "tư thế " + poseType);
                vectorMap.put(poseType, vector);
            }

            if (poseTypes.size() != 3 || !poseTypes.contains(PoseType.FRONTAL)
                    || !poseTypes.contains(PoseType.LEFT_TILT)
                    || !poseTypes.contains(PoseType.RIGHT_TILT)) {
                throw new ApiException(ApiErrorCode.INVALID_TEMPLATE_SET,
                        "Bộ mẫu sinh trắc học bắt buộc phải gồm đúng 3 tư thế phân biệt: FRONTAL, LEFT_TILT, RIGHT_TILT");
            }
        } else {
            // Chế độ tương thích ngược: Single-Vector lưu với nhãn FRONTAL
            List<Float> legacyVector = request.vector512();
            validateVectorDimensionAndNorm(legacyVector, "đơn");
            vectorMap.put(PoseType.FRONTAL, legacyVector);
        }

        User user = session.getUser();
        if (user == null || user.getStatus() == EmployeeStatus.TERMINATED) {
            throw new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Nhân sự không tồn tại hoặc đã thôi việc");
        }

        // Vô hiệu hóa nguyên tử toàn bộ mẫu khuôn mặt cũ của nhân viên
        int deactivatedCount = biometricTemplateRepository.deactivateAllByUserId(user.getId());
        logger.info("Vô hiệu hóa {} mẫu sinh trắc học cũ của userId={}", deactivatedCount, user.getId());

        // Mã hóa độc lập AES-256-GCM và lưu từng mẫu
        List<BiometricTemplate> savedTemplates = new ArrayList<>(vectorMap.size());
        for (Map.Entry<PoseType, List<Float>> entry : vectorMap.entrySet()) {
            PoseType pose = entry.getKey();
            List<Float> vecList = entry.getValue();

            float[] vectorArray = new float[BiometricCryptoService.VECTOR_DIMENSION];
            for (int i = 0; i < BiometricCryptoService.VECTOR_DIMENSION; i++) {
                vectorArray[i] = vecList.get(i);
            }

            BiometricCryptoService.EncryptedVector encrypted = biometricCryptoService.encryptVector(vectorArray);

            BiometricTemplate newTemplate = BiometricTemplate.builder()
                    .user(user)
                    .poseType(pose)
                    .encryptedVector(encrypted.cipherText())
                    .encryptionIv(encrypted.iv())
                    .algorithm("ARCFACE_512D")
                    .version(1)
                    .isActive(true)
                    .build();
            savedTemplates.add(biometricTemplateRepository.save(newTemplate));
        }

        // Đánh dấu phiên OTP đã sử dụng
        session.setIsUsed(true);
        enrollmentSessionRepository.save(session);

        // Kích hoạt trạng thái nhân sự thành ACTIVE
        user.setStatus(EmployeeStatus.ACTIVE);
        userRepository.save(user);

        // Chuẩn bị thông tin phát sóng STOMP
        OffsetDateTime nowVietnam = OffsetDateTime.now(ApiResponse.VIETNAM_ZONE);
        List<Float> frontalVector = vectorMap.get(PoseType.FRONTAL);
        List<GalleryUpdateEvent.TemplateItem> stompTemplates = vectorMap.entrySet().stream()
                .map(e -> new GalleryUpdateEvent.TemplateItem(e.getKey().name(), e.getValue()))
                .toList();

        // Phát sóng nạp nóng vector mới tới toàn bộ trạm Kiosk qua STOMP topic /topic/kiosk-gallery
        stompEventBroadcaster.broadcastGalleryVectorAdded(
                user.getId(),
                user.getEmployeeCode(),
                user.getFullName(),
                frontalVector,
                stompTemplates,
                nowVietnam
        );

        List<String> poseNames = vectorMap.keySet().stream()
                .map(Enum::name)
                .toList();

        // Phát sóng sự kiện hoàn tất đăng ký tới Cổng Web của nhân viên qua STOMP topic /topic/enrollment/{otp}
        try {
            stompEventBroadcaster.broadcastEnrollmentSuccess(
                    request.otp(),
                    user.getId(),
                    user.getEmployeeCode(),
                    user.getFullName(),
                    savedTemplates.size(),
                    poseNames,
                    "Đăng ký khuôn mặt thành công! Tài khoản của bạn đã được kích hoạt.",
                    nowVietnam);
        } catch (Exception ex) {
            logger.warn("Không thể phát sóng sự kiện hoàn tất đăng ký qua STOMP cho userId={}: {}",
                    user.getId(), ex.getMessage());
        }

        Long primaryTemplateId = savedTemplates.stream()
                .filter(t -> t.getPoseType() == PoseType.FRONTAL)
                .findFirst()
                .map(BiometricTemplate::getId)
                .orElseGet(() -> savedTemplates.get(0).getId());

        logger.info("Đăng ký {} mẫu khuôn mặt thành công: userId={}, primaryTemplateId={}, employeeCode={}",
                savedTemplates.size(), user.getId(), primaryTemplateId, user.getEmployeeCode());

        return new EnrollmentResult(
                user.getId(),
                primaryTemplateId,
                EmployeeStatus.ACTIVE,
                nowVietnam,
                user.getEmployeeCode(),
                savedTemplates.size(),
                poseNames
        );
    }

    private void validateVectorDimensionAndNorm(List<Float> vector, String context) {
        if (vector == null || vector.size() != BiometricCryptoService.VECTOR_DIMENSION) {
            throw new ApiException(ApiErrorCode.INVALID_VECTOR_DIMENSION,
                    "Vector " + context + " phải có đúng " + BiometricCryptoService.VECTOR_DIMENSION + " chiều");
        }

        double sumOfSquares = 0.0;
        for (int i = 0; i < BiometricCryptoService.VECTOR_DIMENSION; i++) {
            Float val = vector.get(i);
            if (val == null || Float.isNaN(val) || Float.isInfinite(val)) {
                throw new ApiException(ApiErrorCode.VALIDATION_FAILED,
                        "Giá trị vector " + context + " tại chiều " + i + " không hợp lệ");
            }
            sumOfSquares += (double) val * val;
        }

        double norm = Math.sqrt(sumOfSquares);
        if (Math.abs(norm - 1.0) > 1e-4) {
            throw new ApiException(ApiErrorCode.INVALID_VECTOR_DIMENSION,
                    "Vector " + context + " chưa được chuẩn hóa L2 = 1.0 ± 1e-4 (norm=" + norm + ")");
        }
    }

    /**
     * Lấy toàn bộ danh mục vector ArcFace 512D đã giải mã của các nhân viên đang ACTIVE
     * ({@code GET /api/v1/kiosk/gallery} - APD-BE-001, API-BE-005).
     *
     * @return danh mục vector kèm phiên bản hiện hành và số lượng bản ghi
     */
    @Transactional(readOnly = true)
    public GalleryResponse getGallery() {
        List<BiometricTemplate> templates = biometricTemplateRepository.findByIsActiveTrue();
        List<GalleryItem> items = new ArrayList<>();
        int maxVersion = 1;

        for (BiometricTemplate template : templates) {
            User user = template.getUser();
            if (user == null || user.getStatus() != EmployeeStatus.ACTIVE) {
                continue;
            }

            if (template.getVersion() != null && template.getVersion() > maxVersion) {
                maxVersion = template.getVersion();
            }

            try {
                float[] decrypted = biometricCryptoService.decryptVector(
                        template.getEncryptedVector(),
                        template.getEncryptionIv()
                );
                List<Float> vectorList = new ArrayList<>(decrypted.length);
                for (float v : decrypted) {
                    vectorList.add(v);
                }

                OffsetDateTime updatedAt = template.getCreatedAt() != null
                        ? OffsetDateTime.ofInstant(template.getCreatedAt(), ApiResponse.VIETNAM_ZONE)
                        : OffsetDateTime.now(ApiResponse.VIETNAM_ZONE);

                String poseTypeStr = template.getPoseType() != null
                        ? template.getPoseType().name()
                        : "FRONTAL";

                items.add(new GalleryItem(
                        user.getId(),
                        user.getEmployeeCode(),
                        user.getFullName(),
                        user.getDepartment(),
                        poseTypeStr,
                        vectorList,
                        updatedAt
                ));
            } catch (Exception ex) {
                logger.error("Không thể giải mã vector sinh trắc học cho nhân sự ID={}: {}",
                        user.getId(), ex.getMessage());
            }
        }

        return new GalleryResponse(maxVersion, items.size(), items);
    }

    private void validateKiosk(String kioskId) {
        if (kioskId != null && !kioskId.isBlank()) {
            Optional<Kiosk> kioskOpt = kioskRepository.findById(kioskId);
            if (kioskOpt.isPresent() && Boolean.FALSE.equals(kioskOpt.get().getIsActive())) {
                throw new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED, "Trạm Kiosk đã bị vô hiệu hóa: " + kioskId);
            }
        }
    }

    /** Kiểm tra trạng thái khóa chống brute-force OTP của trạm Kiosk. */
    private void checkOtpAttemptLockout(String kioskId) {
        OtpFailedAttemptRecord record = otpFailedAttempts.get(kioskId);
        if (record != null && record.isLocked(Instant.now())) {
            long remainingMinutes = Math.max(1, Duration.between(Instant.now(), record.lockedUntil()).toMinutes() + 1);
            logger.warn("Từ chối verify-otp: Kiosk {} đang bị khóa chống brute-force (còn ~{} phút)", kioskId, remainingMinutes);
            throw new ApiException(ApiErrorCode.OTP_LOCKED,
                    "Xác thực OTP tạm khóa do thử sai quá nhiều lần. Vui lòng thử lại sau " + remainingMinutes + " phút.");
        }
    }

    /** Ghi nhận một lần thử OTP sai; kích hoạt khóa tạm khi vượt ngưỡng. */
    private void recordOtpFailure(String kioskId) {
        Instant now = Instant.now();
        OtpFailedAttemptRecord record = otpFailedAttempts.compute(kioskId, (k, prev) -> {
            if (prev == null || prev.isExpired(now)) {
                return new OtpFailedAttemptRecord(1, now, null);
            }
            return new OtpFailedAttemptRecord(prev.count() + 1, now, prev.lockedUntil());
        });

        if (record.count() >= MAX_OTP_FAILED_ATTEMPTS && (record.lockedUntil() == null || !record.lockedUntil().isAfter(now))) {
            OtpFailedAttemptRecord locked = new OtpFailedAttemptRecord(
                    record.count(), record.lastFailedAt(), now.plus(OTP_LOCKOUT_MINUTES, ChronoUnit.MINUTES));
            otpFailedAttempts.put(kioskId, locked);
            logger.warn("Khóa verify-otp 15 phút cho Kiosk {} do thử sai quá {} lần", kioskId, MAX_OTP_FAILED_ATTEMPTS);
            throw new ApiException(ApiErrorCode.OTP_LOCKED,
                    "Xác thực OTP tạm khóa do thử sai quá nhiều lần. Vui lòng thử lại sau " + OTP_LOCKOUT_MINUTES + " phút.");
        }
    }

    /** Bản ghi theo dõi phiên Kiosk đã xác minh OTP thành công. */
    private record VerifiedSession(Long sessionId, Long userId, Instant verifiedAt, String kioskId) {}

    /** Bản ghi theo dõi số lần thử OTP sai liên tiếp của một trạm Kiosk. */
    private record OtpFailedAttemptRecord(int count, Instant lastFailedAt, Instant lockedUntil) {
        boolean isExpired(Instant now) {
            return Duration.between(lastFailedAt, now).toMinutes() >= OTP_LOCKOUT_MINUTES;
        }

        boolean isLocked(Instant now) {
            return lockedUntil != null && lockedUntil.isAfter(now);
        }
    }
}
