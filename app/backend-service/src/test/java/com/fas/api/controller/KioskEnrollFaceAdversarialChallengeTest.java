package com.fas.api.controller;

import com.fas.api.dto.request.KioskEnrollFaceRequest;
import com.fas.api.dto.request.KioskVerifyOtpRequest;
import com.fas.api.dto.request.PoseTemplateDto;
import com.fas.api.dto.response.EnrollmentResult;
import com.fas.api.dto.response.OtpVerificationResult;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.crypto.BiometricCryptoService;
import com.fas.data.entity.BiometricTemplate;
import com.fas.data.entity.EnrollmentSession;
import com.fas.data.entity.Kiosk;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.PoseType;
import com.fas.data.enums.Role;
import com.fas.data.repository.BiometricTemplateRepository;
import com.fas.data.repository.EnrollmentSessionRepository;
import com.fas.data.repository.KioskRepository;
import com.fas.data.repository.UserRepository;
import com.fas.security.kiosk.KioskAuthService;
import com.fas.service.EnrollmentService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

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
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Empirical Adversarial Challenge Test Suite for Multi-Template Face Enrollment
 * (POST /api/v1/kiosk/enroll-face, FEAT-ENROLL-001, APD-BE-001).
 *
 * Verifies:
 * 1. Template set validation (partial arrays, duplicate poses, unrecognized strings, corrupted vectors).
 * 2. RFC 7807 ProblemDetails compliance and error code contracts.
 * 3. Legacy single-vector backward compatibility.
 * 4. Dual-layer validation (REST Bean Validation + EnrollmentService business constraints).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Adversarial Challenge: REST Face Enrollment & DTO Validation")
public class KioskEnrollFaceAdversarialChallengeTest {

    private static final String ENROLL_URL = "/api/v1/kiosk/enroll-face";
    private static final String KIOSK_ID = "KIOSK-HN-01";
    private static final String KIOSK_SECRET = "secret-123";
    private static final String VALID_OTP = "839201";
    private static final String VALID_SESSION_TOKEN = "session_token_xyz";

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private KioskAuthService kioskAuthService;

    @Mock
    private EnrollmentService mockEnrollmentService;

    @InjectMocks
    private KioskAttendanceController kioskAttendanceController;

    private Kiosk activeKiosk;

    // Direct Service Layer testing dependencies
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
    private com.fas.api.websocket.StompEventBroadcaster stompEventBroadcaster;

    private PasswordEncoder passwordEncoder;
    private EnrollmentService realEnrollmentService;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(kioskAttendanceController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        activeKiosk = Kiosk.builder()
                .id(KIOSK_ID)
                .locationName("Cổng chính Hà Nội")
                .isActive(true)
                .build();

        passwordEncoder = new BCryptPasswordEncoder();
        realEnrollmentService = new EnrollmentService(
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
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.PENDING_CONSENT)
                .department("Phòng Kỹ thuật")
                .build();
    }

    private List<Float> createUnitVector512() {
        List<Float> list = new ArrayList<>(Collections.nCopies(512, 0.0f));
        list.set(0, 1.0f);
        return list;
    }

    private String setupVerifiedSessionAndGetToken(String plainOtp) {
        String hashedOtp = passwordEncoder.encode(plainOtp);
        EnrollmentSession session = EnrollmentSession.builder()
                .id(99L)
                .user(sampleUser)
                .otpHash(hashedOtp)
                .expiresAt(Instant.now().plus(40, ChronoUnit.HOURS))
                .isUsed(false)
                .build();

        when(kioskRepository.findById(KIOSK_ID)).thenReturn(Optional.of(activeKiosk));
        when(enrollmentSessionRepository.findByIsUsedFalseAndExpiresAtAfter(any(Instant.class)))
                .thenReturn(List.of(session));

        OtpVerificationResult verifyResult = realEnrollmentService.verifyOtp(
                new KioskVerifyOtpRequest(plainOtp, KIOSK_ID)
        );
        when(enrollmentSessionRepository.findById(99L)).thenReturn(Optional.of(session));
        return verifyResult.sessionToken();
    }

    // =========================================================================
    // 1. Partial Arrays & Set Cardinality Stress Tests
    // =========================================================================
    @Nested
    @DisplayName("1. Stress Testing Template Set Cardinality & Partial Arrays")
    class TemplateSetCardinalityTests {

        @Test
        @DisplayName("Controller: Partial array with only 2 poses returns 400 INVALID_TEMPLATE_SET")
        void testController_PartialArray2Poses_Returns400InvalidTemplateSet() throws Exception {
            List<Float> vec = createUnitVector512();
            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("FRONTAL", vec),
                    new PoseTemplateDto("LEFT_TILT", vec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, VALID_SESSION_TOKEN, KIOSK_ID, templates);

            when(kioskAuthService.authenticate(KIOSK_ID, KIOSK_SECRET)).thenReturn(activeKiosk);
            when(mockEnrollmentService.enrollFace(any(KioskEnrollFaceRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.INVALID_TEMPLATE_SET,
                            "Bộ mẫu sinh trắc học bắt buộc phải gồm đúng 3 tư thế phân biệt: FRONTAL, LEFT_TILT, RIGHT_TILT"));

            mockMvc.perform(post(ENROLL_URL)
                            .header("X-Kiosk-Id", KIOSK_ID)
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("INVALID_TEMPLATE_SET"))
                    .andExpect(jsonPath("$.status").value(400));
        }

        @Test
        @DisplayName("Service Layer: Partial array with only 1 pose throws INVALID_TEMPLATE_SET")
        void testService_PartialArray1Pose_ThrowsInvalidTemplateSet() {
            String token = setupVerifiedSessionAndGetToken(VALID_OTP);
            List<Float> vec = createUnitVector512();
            List<PoseTemplateDto> templates = List.of(new PoseTemplateDto("FRONTAL", vec));
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, token, KIOSK_ID, templates);

            assertThatThrownBy(() -> realEnrollmentService.enrollFace(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.INVALID_TEMPLATE_SET);
                        assertThat(apiEx.getMessage()).contains("đúng 3 tư thế");
                    });
        }

        @Test
        @DisplayName("Service Layer: Partial array with 2 poses throws INVALID_TEMPLATE_SET")
        void testService_PartialArray2Poses_ThrowsInvalidTemplateSet() {
            String token = setupVerifiedSessionAndGetToken(VALID_OTP);
            List<Float> vec = createUnitVector512();
            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("FRONTAL", vec),
                    new PoseTemplateDto("LEFT_TILT", vec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, token, KIOSK_ID, templates);

            assertThatThrownBy(() -> realEnrollmentService.enrollFace(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.INVALID_TEMPLATE_SET);
                    });
        }

        @Test
        @DisplayName("Service Layer: Array with 4 poses throws INVALID_TEMPLATE_SET")
        void testService_ArrayWith4Poses_ThrowsInvalidTemplateSet() {
            String token = setupVerifiedSessionAndGetToken(VALID_OTP);
            List<Float> vec = createUnitVector512();
            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("FRONTAL", vec),
                    new PoseTemplateDto("LEFT_TILT", vec),
                    new PoseTemplateDto("RIGHT_TILT", vec),
                    new PoseTemplateDto("FRONTAL", vec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, token, KIOSK_ID, templates);

            assertThatThrownBy(() -> realEnrollmentService.enrollFace(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.INVALID_TEMPLATE_SET);
                    });
        }

        @Test
        @DisplayName("Service Layer: Empty templates and null vector512 throws VALIDATION_FAILED")
        void testService_EmptyTemplatesAndNullVector_ThrowsValidationFailed() {
            String token = setupVerifiedSessionAndGetToken(VALID_OTP);
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(
                    VALID_OTP, token, Collections.emptyList(), null, KIOSK_ID
            );

            assertThatThrownBy(() -> realEnrollmentService.enrollFace(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED);
                    });
        }
    }

    // =========================================================================
    // 2. Duplicate Poses Stress Tests
    // =========================================================================
    @Nested
    @DisplayName("2. Stress Testing Duplicate Poses within 3-Template Array")
    class DuplicatePosesTests {

        @Test
        @DisplayName("Service Layer: 2 FRONTAL, 1 LEFT_TILT throws INVALID_TEMPLATE_SET with duplicate message")
        void testService_DuplicateFrontal_ThrowsInvalidTemplateSet() {
            String token = setupVerifiedSessionAndGetToken(VALID_OTP);
            List<Float> vec = createUnitVector512();
            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("FRONTAL", vec),
                    new PoseTemplateDto("FRONTAL", vec),
                    new PoseTemplateDto("LEFT_TILT", vec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, token, KIOSK_ID, templates);

            assertThatThrownBy(() -> realEnrollmentService.enrollFace(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.INVALID_TEMPLATE_SET);
                        assertThat(apiEx.getMessage()).contains("trùng lặp: FRONTAL");
                    });
        }

        @Test
        @DisplayName("Service Layer: 2 LEFT_TILT, 1 RIGHT_TILT throws INVALID_TEMPLATE_SET with duplicate message")
        void testService_DuplicateLeftTilt_ThrowsInvalidTemplateSet() {
            String token = setupVerifiedSessionAndGetToken(VALID_OTP);
            List<Float> vec = createUnitVector512();
            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("LEFT_TILT", vec),
                    new PoseTemplateDto("LEFT_TILT", vec),
                    new PoseTemplateDto("RIGHT_TILT", vec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, token, KIOSK_ID, templates);

            assertThatThrownBy(() -> realEnrollmentService.enrollFace(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.INVALID_TEMPLATE_SET);
                        assertThat(apiEx.getMessage()).contains("trùng lặp: LEFT_TILT");
                    });
        }

        @Test
        @DisplayName("Service Layer: 3 identical RIGHT_TILT throws INVALID_TEMPLATE_SET")
        void testService_AllIdenticalPoses_ThrowsInvalidTemplateSet() {
            String token = setupVerifiedSessionAndGetToken(VALID_OTP);
            List<Float> vec = createUnitVector512();
            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("RIGHT_TILT", vec),
                    new PoseTemplateDto("RIGHT_TILT", vec),
                    new PoseTemplateDto("RIGHT_TILT", vec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, token, KIOSK_ID, templates);

            assertThatThrownBy(() -> realEnrollmentService.enrollFace(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.INVALID_TEMPLATE_SET);
                    });
        }
    }

    // =========================================================================
    // 3. Unrecognized & Invalid Pose Strings
    // =========================================================================
    @Nested
    @DisplayName("3. Stress Testing Unrecognized & Malformed Pose Strings")
    class UnrecognizedPoseStringsTests {

        @Test
        @DisplayName("REST Controller: Unrecognized pose 'BACKWARD' is rejected at DTO boundary with 400 VALIDATION_FAILED")
        void testController_UnrecognizedPoseString_RejectedByBeanValidation() throws Exception {
            List<Float> vec = createUnitVector512();
            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("FRONTAL", vec),
                    new PoseTemplateDto("LEFT_TILT", vec),
                    new PoseTemplateDto("BACKWARD", vec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, VALID_SESSION_TOKEN, KIOSK_ID, templates);

            MvcResult mvcResult = mockMvc.perform(post(ENROLL_URL)
                            .header("X-Kiosk-Id", KIOSK_ID)
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.status").value(400))
                    .andReturn();

            JsonNode body = objectMapper.readTree(mvcResult.getResponse().getContentAsString());
            assertThat(body.path("invalidParams").toString()).contains("poseType");
            verifyNoInteractions(mockEnrollmentService);
        }

        @Test
        @DisplayName("REST Controller: Lowercase pose 'frontal' is rejected with 400 VALIDATION_FAILED")
        void testController_LowercasePoseString_RejectedByBeanValidation() throws Exception {
            List<Float> vec = createUnitVector512();
            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("frontal", vec),
                    new PoseTemplateDto("LEFT_TILT", vec),
                    new PoseTemplateDto("RIGHT_TILT", vec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, VALID_SESSION_TOKEN, KIOSK_ID, templates);

            mockMvc.perform(post(ENROLL_URL)
                            .header("X-Kiosk-Id", KIOSK_ID)
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verifyNoInteractions(mockEnrollmentService);
        }

        @Test
        @DisplayName("REST Controller: Blank pose '' is rejected with 400 VALIDATION_FAILED")
        void testController_BlankPoseString_RejectedByBeanValidation() throws Exception {
            List<Float> vec = createUnitVector512();
            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("", vec),
                    new PoseTemplateDto("LEFT_TILT", vec),
                    new PoseTemplateDto("RIGHT_TILT", vec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, VALID_SESSION_TOKEN, KIOSK_ID, templates);

            mockMvc.perform(post(ENROLL_URL)
                            .header("X-Kiosk-Id", KIOSK_ID)
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verifyNoInteractions(mockEnrollmentService);
        }

        @Test
        @DisplayName("Service Layer: Unrecognized pose bypassed to service throws INVALID_TEMPLATE_SET")
        void testService_UnrecognizedPose_ThrowsInvalidTemplateSet() {
            String token = setupVerifiedSessionAndGetToken(VALID_OTP);
            List<Float> vec = createUnitVector512();
            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("FRONTAL", vec),
                    new PoseTemplateDto("LEFT_TILT", vec),
                    new PoseTemplateDto("UPWARD_TILT", vec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, token, KIOSK_ID, templates);

            assertThatThrownBy(() -> realEnrollmentService.enrollFace(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.INVALID_TEMPLATE_SET);
                        assertThat(apiEx.getMessage()).contains("UPWARD_TILT");
                    });
        }
    }

    // =========================================================================
    // 4. Corrupted Vectors (Dimension & L2 Normalization)
    // =========================================================================
    @Nested
    @DisplayName("4. Stress Testing Corrupted Vectors (Dimension & L2 Normalization)")
    class CorruptedVectorsTests {

        @Test
        @DisplayName("REST Controller: Short vector (2 floats) in multi-template rejected with 400 VALIDATION_FAILED")
        void testController_ShortVectorInTemplate_RejectedWith400() throws Exception {
            List<Float> validVec = createUnitVector512();
            List<Float> shortVec = List.of(0.707f, 0.707f);
            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("FRONTAL", validVec),
                    new PoseTemplateDto("LEFT_TILT", shortVec),
                    new PoseTemplateDto("RIGHT_TILT", validVec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, VALID_SESSION_TOKEN, KIOSK_ID, templates);

            mockMvc.perform(post(ENROLL_URL)
                            .header("X-Kiosk-Id", KIOSK_ID)
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verifyNoInteractions(mockEnrollmentService);
        }

        @Test
        @DisplayName("REST Controller: Over-dimensioned vector (513 floats) rejected with 400 VALIDATION_FAILED")
        void testController_OverDimensionedVector_RejectedWith400() throws Exception {
            List<Float> validVec = createUnitVector512();
            List<Float> longVec = new ArrayList<>(Collections.nCopies(513, 0.0f));
            longVec.set(0, 1.0f);

            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("FRONTAL", validVec),
                    new PoseTemplateDto("LEFT_TILT", longVec),
                    new PoseTemplateDto("RIGHT_TILT", validVec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, VALID_SESSION_TOKEN, KIOSK_ID, templates);

            mockMvc.perform(post(ENROLL_URL)
                            .header("X-Kiosk-Id", KIOSK_ID)
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verifyNoInteractions(mockEnrollmentService);
        }

        @Test
        @DisplayName("REST Controller: Non-L2 normalized vector (all 0.0) rejected with 400 VALIDATION_FAILED")
        void testController_ZeroVector_RejectedWith400() throws Exception {
            List<Float> validVec = createUnitVector512();
            List<Float> zeroVec = new ArrayList<>(Collections.nCopies(512, 0.0f));

            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("FRONTAL", validVec),
                    new PoseTemplateDto("LEFT_TILT", zeroVec),
                    new PoseTemplateDto("RIGHT_TILT", validVec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, VALID_SESSION_TOKEN, KIOSK_ID, templates);

            mockMvc.perform(post(ENROLL_URL)
                            .header("X-Kiosk-Id", KIOSK_ID)
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verifyNoInteractions(mockEnrollmentService);
        }

        @Test
        @DisplayName("REST Controller: Non-L2 normalized vector (norm = 1.05) rejected with 400 VALIDATION_FAILED")
        void testController_UnnormalizedMagnitude_RejectedWith400() throws Exception {
            List<Float> validVec = createUnitVector512();
            List<Float> offNormVec = new ArrayList<>(Collections.nCopies(512, 0.0f));
            offNormVec.set(0, 1.05f); // norm = 1.05 > 1.0 + 1e-4

            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("FRONTAL", validVec),
                    new PoseTemplateDto("LEFT_TILT", offNormVec),
                    new PoseTemplateDto("RIGHT_TILT", validVec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, VALID_SESSION_TOKEN, KIOSK_ID, templates);

            mockMvc.perform(post(ENROLL_URL)
                            .header("X-Kiosk-Id", KIOSK_ID)
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verifyNoInteractions(mockEnrollmentService);
        }

        @Test
        @DisplayName("Service Layer: Vector with invalid dimension directly passed throws INVALID_VECTOR_DIMENSION")
        void testService_InvalidVectorDimension_ThrowsInvalidVectorDimension() {
            String token = setupVerifiedSessionAndGetToken(VALID_OTP);
            List<Float> validVec = createUnitVector512();
            List<Float> invalidDimensionVec = List.of(1.0f, 0.0f);

            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("FRONTAL", validVec),
                    new PoseTemplateDto("LEFT_TILT", invalidDimensionVec),
                    new PoseTemplateDto("RIGHT_TILT", validVec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, token, KIOSK_ID, templates);

            assertThatThrownBy(() -> realEnrollmentService.enrollFace(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.INVALID_VECTOR_DIMENSION);
                        assertThat(apiEx.getMessage()).contains("512 chiều");
                    });
        }

        @Test
        @DisplayName("Service Layer: Vector with norm violation (norm=2.0) directly passed throws INVALID_VECTOR_DIMENSION")
        void testService_InvalidVectorNorm_ThrowsInvalidVectorDimension() {
            String token = setupVerifiedSessionAndGetToken(VALID_OTP);
            List<Float> validVec = createUnitVector512();
            List<Float> norm2Vec = new ArrayList<>(Collections.nCopies(512, 0.0f));
            norm2Vec.set(0, 2.0f); // norm = 2.0

            List<PoseTemplateDto> templates = List.of(
                    new PoseTemplateDto("FRONTAL", validVec),
                    new PoseTemplateDto("LEFT_TILT", norm2Vec),
                    new PoseTemplateDto("RIGHT_TILT", validVec)
            );
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(VALID_OTP, token, KIOSK_ID, templates);

            assertThatThrownBy(() -> realEnrollmentService.enrollFace(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.INVALID_VECTOR_DIMENSION);
                        assertThat(apiEx.getMessage()).contains("chuẩn hóa L2 = 1.0 ± 1e-4");
                    });
        }
    }

    // =========================================================================
    // 5. Legacy Single-Vector Backward Compatibility
    // =========================================================================
    @Nested
    @DisplayName("5. Legacy Single-Vector Enrollment Backward Compatibility")
    class LegacySingleVectorTests {

        @Test
        @DisplayName("REST Controller: Legacy request with vector512 and no templates succeeds with 200 OK")
        void testController_LegacyEnrollment_SucceedsWith200() throws Exception {
            List<Float> legacyVector = createUnitVector512();
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(
                    VALID_OTP,
                    VALID_SESSION_TOKEN,
                    legacyVector,
                    KIOSK_ID
            );

            EnrollmentResult mockResult = new EnrollmentResult(
                    1042L,
                    77L,
                    EmployeeStatus.ACTIVE,
                    OffsetDateTime.now(),
                    "NV-1042",
                    1,
                    List.of("FRONTAL")
            );

            when(kioskAuthService.authenticate(KIOSK_ID, KIOSK_SECRET)).thenReturn(activeKiosk);
            when(mockEnrollmentService.enrollFace(any(KioskEnrollFaceRequest.class))).thenReturn(mockResult);

            mockMvc.perform(post(ENROLL_URL)
                            .header("X-Kiosk-Id", KIOSK_ID)
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("FACE_ENROLLED"))
                    .andExpect(jsonPath("$.data.employeeId").value(1042))
                    .andExpect(jsonPath("$.data.templateCount").value(1))
                    .andExpect(jsonPath("$.data.poses[0]").value("FRONTAL"));
        }

        @Test
        @DisplayName("Service Layer: Legacy request saves template as FRONTAL and activates employee")
        void testService_LegacyEnrollment_SavesAsFrontalAndActivatesUser() {
            String token = setupVerifiedSessionAndGetToken(VALID_OTP);
            List<Float> legacyVector = createUnitVector512();
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(
                    VALID_OTP,
                    token,
                    legacyVector,
                    KIOSK_ID
            );

            byte[] fakeCiphertext = new byte[2064];
            byte[] fakeIv = new byte[12];
            when(biometricCryptoService.encryptVector(any(float[].class)))
                    .thenReturn(new BiometricCryptoService.EncryptedVector(fakeCiphertext, fakeIv));
            when(biometricTemplateRepository.deactivateAllByUserId(1042L)).thenReturn(0);
            when(biometricTemplateRepository.save(any(BiometricTemplate.class))).thenAnswer(inv -> {
                BiometricTemplate bt = inv.getArgument(0);
                bt.setId(101L);
                return bt;
            });

            EnrollmentResult result = realEnrollmentService.enrollFace(request);

            assertThat(result).isNotNull();
            assertThat(result.employeeId()).isEqualTo(1042L);
            assertThat(result.templateCount()).isEqualTo(1);
            assertThat(result.poses()).containsExactly("FRONTAL");
            assertThat(result.status()).isEqualTo(EmployeeStatus.ACTIVE);

            verify(biometricTemplateRepository).deactivateAllByUserId(1042L);
            verify(biometricCryptoService, times(1)).encryptVector(any(float[].class));
            verify(biometricTemplateRepository, times(1)).save(argThat(bt -> bt.getPoseType() == PoseType.FRONTAL));
        }

        @Test
        @DisplayName("REST Controller: Legacy vector with wrong dimension is rejected with 400 VALIDATION_FAILED")
        void testController_LegacyVectorWrongDimension_RejectedWith400() throws Exception {
            List<Float> shortVector = List.of(1.0f, 0.0f);
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(
                    VALID_OTP,
                    VALID_SESSION_TOKEN,
                    shortVector,
                    KIOSK_ID
            );

            mockMvc.perform(post(ENROLL_URL)
                            .header("X-Kiosk-Id", KIOSK_ID)
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verifyNoInteractions(mockEnrollmentService);
        }
    }

    // =========================================================================
    // 6. Security, Header Boundary & RFC 7807 ProblemDetails Contract
    // =========================================================================
    @Nested
    @DisplayName("6. Boundary Constraints & RFC 7807 ProblemDetails Structure")
    class SecurityAndProblemDetailsTests {

        @Test
        @DisplayName("Kiosk ID mismatch between header and request body returns 401 KIOSK_UNAUTHORIZED")
        void testController_KioskIdMismatch_Returns401() throws Exception {
            List<Float> vec = createUnitVector512();
            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(
                    VALID_OTP, VALID_SESSION_TOKEN, vec, "KIOSK-OTHER"
            );

            when(kioskAuthService.authenticate(KIOSK_ID, KIOSK_SECRET)).thenReturn(activeKiosk);

            mockMvc.perform(post(ENROLL_URL)
                            .header("X-Kiosk-Id", KIOSK_ID)
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("KIOSK_UNAUTHORIZED"));

            verifyNoInteractions(mockEnrollmentService);
        }

        @Test
        @DisplayName("RFC 7807 Error Response contains all required contract fields")
        void testController_Rfc7807ContractCompliance() throws Exception {
            // Malformed request missing sessionToken and kioskId
            String invalidPayload = """
                    {
                      "otp": "123",
                      "templates": []
                    }
                    """;

            MvcResult mvcResult = mockMvc.perform(post(ENROLL_URL)
                            .header("X-Kiosk-Id", KIOSK_ID)
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidPayload))
                    .andExpect(status().isBadRequest())
                    .andReturn();

            JsonNode body = objectMapper.readTree(mvcResult.getResponse().getContentAsString());
            assertThat(body.has("type")).isTrue();
            assertThat(body.path("type").asText()).startsWith("https://fas.company.com/errors/");
            assertThat(body.has("title")).isTrue();
            assertThat(body.path("status").asInt()).isEqualTo(400);
            assertThat(body.path("code").asText()).isEqualTo("VALIDATION_FAILED");
            assertThat(body.has("message")).isTrue();
            assertThat(body.has("instance")).isTrue();
            assertThat(body.path("instance").asText()).isEqualTo(ENROLL_URL);
            assertThat(body.has("timestamp")).isTrue();
            assertThat(body.has("invalidParams")).isTrue();
            assertThat(body.path("invalidParams").isArray()).isTrue();
        }
    }
}
