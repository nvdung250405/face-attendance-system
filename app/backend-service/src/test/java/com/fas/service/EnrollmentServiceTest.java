package com.fas.service;

import com.fas.api.dto.request.ConsentRequest;
import com.fas.api.dto.request.KioskEnrollFaceRequest;
import com.fas.api.dto.request.KioskVerifyOtpRequest;
import com.fas.api.dto.response.ConsentResult;
import com.fas.api.dto.response.EnrollmentResult;
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
import com.fas.data.enums.Role;
import com.fas.data.repository.BiometricTemplateRepository;
import com.fas.data.repository.EnrollmentSessionRepository;
import com.fas.data.repository.KioskRepository;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Bộ kiểm thử đơn vị cho EnrollmentService (TST-BE-013, BLD-BE-013, TASK-BE-015).
 */
@ExtendWith(MockitoExtension.class)
class EnrollmentServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EnrollmentSessionRepository enrollmentSessionRepository;

    @Mock
    private BiometricTemplateRepository biometricTemplateRepository;

    @Mock
    private KioskRepository kioskRepository;

    @Mock
    private BiometricCryptoService biometricCryptoService;

    @Mock
    private StompEventBroadcaster stompEventBroadcaster;

    private PasswordEncoder passwordEncoder;
    private EnrollmentService enrollmentService;

    private User sampleUser;
    private Kiosk activeKiosk;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        enrollmentService = new EnrollmentService(
                userRepository,
                enrollmentSessionRepository,
                biometricTemplateRepository,
                kioskRepository,
                biometricCryptoService,
                stompEventBroadcaster,
                passwordEncoder
        );

        sampleUser = User.builder()
                .id(1042L)
                .employeeCode("NV-1042")
                .fullName("Ngô Văn Dũng")
                .email("dung.ngo@fas.com")
                .passwordHash("$2a$10$dummyHash")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.PENDING_CONSENT)
                .department("Phòng Kỹ thuật")
                .build();

        activeKiosk = Kiosk.builder()
                .id("KIOSK-HN-01")
                .locationName("Kiosk Sảnh Tầng 1 - Tòa nhà A")
                .secretTokenHash("$2a$10$dummyHash")
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Ký Informed Consent thành công: sinh mã OTP 6 số, băm BCrypt, hiệu lực 48 giờ")
    void testCreateConsentSession_Success() {
        when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
        when(enrollmentSessionRepository.save(any(EnrollmentSession.class))).thenAnswer(invocation -> {
            EnrollmentSession s = invocation.getArgument(0);
            s.setId(1L);
            return s;
        });

        ConsentRequest request = new ConsentRequest(true, "v1.0-GDPR");
        ConsentResult result = enrollmentService.createConsentSession(1042L, request, "192.168.1.100");

        assertThat(result).isNotNull();
        assertThat(result.otp()).matches("\\d{6}");
        assertThat(result.qrCodeDataUrl()).isEqualTo("otp:" + result.otp());
        assertThat(result.expiresAt()).isAfter(OffsetDateTime.now());
        assertThat(result.notice()).contains("48 giờ");

        ArgumentCaptor<EnrollmentSession> captor = ArgumentCaptor.forClass(EnrollmentSession.class);
        verify(enrollmentSessionRepository).save(captor.capture());
        EnrollmentSession savedSession = captor.getValue();

        assertThat(savedSession.getUser()).isEqualTo(sampleUser);
        assertThat(savedSession.getConsentVersion()).isEqualTo("v1.0-GDPR");
        assertThat(savedSession.getClientIp()).isEqualTo("192.168.1.100");
        assertThat(savedSession.getIsUsed()).isFalse();
        assertThat(passwordEncoder.matches(result.otp(), savedSession.getOtpHash())).isTrue();
        assertThat(savedSession.getExpiresAt()).isAfter(Instant.now().plus(47, ChronoUnit.HOURS));
    }

    @Test
    @DisplayName("Ký Informed Consent thất bại khi không đồng ý thỏa thuận (agreed=false)")
    void testCreateConsentSession_WhenAgreedFalse_ThrowsValidationFailed() {
        ConsentRequest request = new ConsentRequest(false, "v1.0");

        assertThatThrownBy(() -> enrollmentService.createConsentSession(1042L, request, "127.0.0.1"))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiErrorCode.VALIDATION_FAILED);

        verify(enrollmentSessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ký Informed Consent thất bại khi không tìm thấy nhân sự")
    void testCreateConsentSession_WhenUserNotFound_ThrowsEmployeeNotFound() {
        when(userRepository.findById(9999L)).thenReturn(Optional.empty());
        ConsentRequest request = new ConsentRequest(true, "v1.0");

        assertThatThrownBy(() -> enrollmentService.createConsentSession(9999L, request, "127.0.0.1"))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiErrorCode.EMPLOYEE_NOT_FOUND);
    }

    @Test
    @DisplayName("Ký Informed Consent thất bại khi nhân viên đã thôi việc (TERMINATED)")
    void testCreateConsentSession_WhenUserTerminated_ThrowsAccessDenied() {
        sampleUser.setStatus(EmployeeStatus.TERMINATED);
        when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
        ConsentRequest request = new ConsentRequest(true, "v1.0");

        assertThatThrownBy(() -> enrollmentService.createConsentSession(1042L, request, "127.0.0.1"))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("Thẩm định OTP tại Kiosk thành công: cấp sessionToken và trả thông tin nhân sự")
    void testVerifyOtp_Success() {
        String plainOtp = "654321";
        String hashedOtp = passwordEncoder.encode(plainOtp);

        EnrollmentSession session = EnrollmentSession.builder()
                .id(10L)
                .user(sampleUser)
                .otpHash(hashedOtp)
                .consentVersion("v1.0")
                .consentSignedAt(Instant.now().minus(2, ChronoUnit.HOURS))
                .clientIp("127.0.0.1")
                .expiresAt(Instant.now().plus(46, ChronoUnit.HOURS))
                .isUsed(false)
                .build();

        when(kioskRepository.findById("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));
        when(enrollmentSessionRepository.findByIsUsedFalseAndExpiresAtAfter(any(Instant.class)))
                .thenReturn(List.of(session));

        KioskVerifyOtpRequest request = new KioskVerifyOtpRequest(plainOtp, "KIOSK-HN-01");
        OtpVerificationResult result = enrollmentService.verifyOtp(request);

        assertThat(result).isNotNull();
        assertThat(result.sessionToken()).isNotBlank();
        assertThat(result.employeeId()).isEqualTo(1042L);
        assertThat(result.employeeCode()).isEqualTo("NV-1042");
        assertThat(result.fullName()).isEqualTo("Ngô Văn Dũng");
        assertThat(result.department()).isEqualTo("Phòng Kỹ thuật");
    }

    @Test
    @DisplayName("Thẩm định OTP thất bại khi mã OTP không đúng")
    void testVerifyOtp_WhenOtpInvalid_ThrowsOtpInvalid() {
        String plainOtp = "123456";
        String wrongOtp = "999999";

        EnrollmentSession session = EnrollmentSession.builder()
                .id(10L)
                .user(sampleUser)
                .otpHash(passwordEncoder.encode(plainOtp))
                .expiresAt(Instant.now().plus(46, ChronoUnit.HOURS))
                .isUsed(false)
                .build();

        when(kioskRepository.findById("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));
        when(enrollmentSessionRepository.findByIsUsedFalseAndExpiresAtAfter(any(Instant.class)))
                .thenReturn(List.of(session));
        when(enrollmentSessionRepository.findAll()).thenReturn(List.of(session));

        KioskVerifyOtpRequest request = new KioskVerifyOtpRequest(wrongOtp, "KIOSK-HN-01");

        assertThatThrownBy(() -> enrollmentService.verifyOtp(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiErrorCode.OTP_INVALID);
    }

    @Test
    @DisplayName("Thẩm định OTP thất bại khi mã OTP đã hết hạn (quá 48h)")
    void testVerifyOtp_WhenOtpExpired_ThrowsOtpExpired() {
        String plainOtp = "123456";

        EnrollmentSession expiredSession = EnrollmentSession.builder()
                .id(10L)
                .user(sampleUser)
                .otpHash(passwordEncoder.encode(plainOtp))
                .expiresAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .isUsed(false)
                .build();

        when(kioskRepository.findById("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));
        when(enrollmentSessionRepository.findByIsUsedFalseAndExpiresAtAfter(any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(enrollmentSessionRepository.findAll()).thenReturn(List.of(expiredSession));

        KioskVerifyOtpRequest request = new KioskVerifyOtpRequest(plainOtp, "KIOSK-HN-01");

        assertThatThrownBy(() -> enrollmentService.verifyOtp(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiErrorCode.OTP_EXPIRED);
    }

    @Test
    @DisplayName("Thẩm định OTP thất bại khi mã OTP đã sử dụng trước đó")
    void testVerifyOtp_WhenOtpAlreadyUsed_ThrowsOtpAlreadyUsed() {
        String plainOtp = "123456";

        EnrollmentSession usedSession = EnrollmentSession.builder()
                .id(10L)
                .user(sampleUser)
                .otpHash(passwordEncoder.encode(plainOtp))
                .expiresAt(Instant.now().plus(20, ChronoUnit.HOURS))
                .isUsed(true)
                .build();

        when(kioskRepository.findById("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));
        when(enrollmentSessionRepository.findByIsUsedFalseAndExpiresAtAfter(any(Instant.class)))
                .thenReturn(Collections.emptyList());
        when(enrollmentSessionRepository.findAll()).thenReturn(List.of(usedSession));

        KioskVerifyOtpRequest request = new KioskVerifyOtpRequest(plainOtp, "KIOSK-HN-01");

        assertThatThrownBy(() -> enrollmentService.verifyOtp(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiErrorCode.OTP_ALREADY_USED);
    }

    @Test
    @DisplayName("Thẩm định OTP thất bại khi trạm Kiosk bị vô hiệu hóa")
    void testVerifyOtp_WhenKioskInactive_ThrowsKioskUnauthorized() {
        Kiosk inactiveKiosk = Kiosk.builder().id("KIOSK-LOCKED").isActive(false).build();
        when(kioskRepository.findById("KIOSK-LOCKED")).thenReturn(Optional.of(inactiveKiosk));

        KioskVerifyOtpRequest request = new KioskVerifyOtpRequest("123456", "KIOSK-LOCKED");

        assertThatThrownBy(() -> enrollmentService.verifyOtp(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiErrorCode.KIOSK_UNAUTHORIZED);
    }

    @Test
    @DisplayName("Nạp vector khuôn mặt thành công: mã hóa AES-256-GCM, lưu template, kích hoạt ACTIVE và broadcast STOMP")
    void testEnrollFace_Success() {
        String plainOtp = "888888";
        String hashedOtp = passwordEncoder.encode(plainOtp);

        EnrollmentSession session = EnrollmentSession.builder()
                .id(20L)
                .user(sampleUser)
                .otpHash(hashedOtp)
                .expiresAt(Instant.now().plus(40, ChronoUnit.HOURS))
                .isUsed(false)
                .build();

        when(kioskRepository.findById("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));
        when(enrollmentSessionRepository.findByIsUsedFalseAndExpiresAtAfter(any(Instant.class)))
                .thenReturn(List.of(session));

        // 1. Verify OTP để lấy sessionToken
        OtpVerificationResult verifyResult = enrollmentService.verifyOtp(
                new KioskVerifyOtpRequest(plainOtp, "KIOSK-HN-01")
        );
        String sessionToken = verifyResult.sessionToken();

        // 2. Mock các phụ thuộc cho enrollFace
        when(enrollmentSessionRepository.findById(20L)).thenReturn(Optional.of(session));

        byte[] fakeCiphertext = new byte[2064];
        byte[] fakeIv = new byte[12];
        when(biometricCryptoService.encryptVector(any(float[].class)))
                .thenReturn(new BiometricCryptoService.EncryptedVector(fakeCiphertext, fakeIv));

        when(biometricTemplateRepository.findByUserIdAndIsActiveTrue(1042L)).thenReturn(Optional.empty());
        when(biometricTemplateRepository.save(any(BiometricTemplate.class))).thenAnswer(inv -> {
            BiometricTemplate bt = inv.getArgument(0);
            bt.setId(500L);
            return bt;
        });

        List<Float> validVector = createValidVector512();
        KioskEnrollFaceRequest enrollRequest = new KioskEnrollFaceRequest(
                plainOtp,
                sessionToken,
                validVector,
                "KIOSK-HN-01"
        );

        // 3. Thực thi enrollFace
        EnrollmentResult result = enrollmentService.enrollFace(enrollRequest);

        assertThat(result).isNotNull();
        assertThat(result.employeeId()).isEqualTo(1042L);
        assertThat(result.templateId()).isEqualTo(500L);
        assertThat(result.status()).isEqualTo(EmployeeStatus.ACTIVE);

        // 4. Xác nhận trạng thái cập nhật
        assertThat(session.getIsUsed()).isTrue();
        assertThat(sampleUser.getStatus()).isEqualTo(EmployeeStatus.ACTIVE);
        verify(enrollmentSessionRepository).save(session);
        verify(userRepository).save(sampleUser);

        // 5. Xác nhận lưu BiometricTemplate
        ArgumentCaptor<BiometricTemplate> templateCaptor = ArgumentCaptor.forClass(BiometricTemplate.class);
        verify(biometricTemplateRepository).save(templateCaptor.capture());
        BiometricTemplate savedTemplate = templateCaptor.getValue();
        assertThat(savedTemplate.getEncryptedVector()).isEqualTo(fakeCiphertext);
        assertThat(savedTemplate.getEncryptionIv()).isEqualTo(fakeIv);
        assertThat(savedTemplate.getAlgorithm()).isEqualTo("ARCFACE_512D");
        assertThat(savedTemplate.getIsActive()).isTrue();

        // 6. Xác nhận phát sóng STOMP nạp nóng
        verify(stompEventBroadcaster).broadcastGalleryVectorAdded(
                eq(1042L),
                eq("NV-1042"),
                eq("Ngô Văn Dũng"),
                eq(validVector),
                any(OffsetDateTime.class)
        );
    }

    @Test
    @DisplayName("Nạp vector khuôn mặt thất bại khi sessionToken không hợp lệ hoặc giả mạo")
    void testEnrollFace_WhenSessionTokenInvalid_ThrowsOtpInvalid() {
        when(kioskRepository.findById("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));

        KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(
                "123456",
                "non-existent-token",
                createValidVector512(),
                "KIOSK-HN-01"
        );

        assertThatThrownBy(() -> enrollmentService.enrollFace(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiErrorCode.OTP_INVALID);
    }

    @Test
    @DisplayName("Nạp vector khuôn mặt thất bại khi vector không đúng 512 chiều")
    void testEnrollFace_WhenVectorDimensionInvalid_ThrowsInvalidVectorDimension() {
        String plainOtp = "777777";
        EnrollmentSession session = EnrollmentSession.builder()
                .id(30L)
                .user(sampleUser)
                .otpHash(passwordEncoder.encode(plainOtp))
                .expiresAt(Instant.now().plus(40, ChronoUnit.HOURS))
                .isUsed(false)
                .build();

        when(kioskRepository.findById("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));
        when(enrollmentSessionRepository.findByIsUsedFalseAndExpiresAtAfter(any(Instant.class)))
                .thenReturn(List.of(session));

        OtpVerificationResult verifyResult = enrollmentService.verifyOtp(
                new KioskVerifyOtpRequest(plainOtp, "KIOSK-HN-01")
        );

        when(enrollmentSessionRepository.findById(30L)).thenReturn(Optional.of(session));

        List<Float> invalidVector = List.of(0.1f, 0.2f, 0.3f);
        KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(
                plainOtp,
                verifyResult.sessionToken(),
                invalidVector,
                "KIOSK-HN-01"
        );

        assertThatThrownBy(() -> enrollmentService.enrollFace(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ApiErrorCode.INVALID_VECTOR_DIMENSION);
    }

    private List<Float> createValidVector512() {
        List<Float> list = new ArrayList<>(512);
        for (int i = 0; i < 512; i++) {
            list.add(0.044f);
        }
        return list;
    }
}
