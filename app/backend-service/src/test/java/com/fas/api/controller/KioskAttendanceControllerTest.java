package com.fas.api.controller;

import com.fas.api.dto.request.KioskEnrollFaceRequest;
import com.fas.api.dto.request.KioskPunchRequest;
import com.fas.api.dto.request.KioskSyncBatchRequest;
import com.fas.api.dto.request.KioskVerifyOtpRequest;
import com.fas.api.dto.request.OfflinePunchRecord;
import com.fas.api.dto.response.BatchSyncResult;
import com.fas.api.dto.response.EnrollmentResult;
import com.fas.api.dto.response.GalleryItem;
import com.fas.api.dto.response.GalleryResponse;
import com.fas.api.dto.response.OtpVerificationResult;
import com.fas.api.dto.response.PunchResult;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.entity.Kiosk;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.PunchType;
import com.fas.security.kiosk.KioskAuthService;
import com.fas.service.AttendanceService;
import com.fas.service.EnrollmentService;
import com.fas.service.OfflineBatchSyncService;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử REST Controller cho KioskAttendanceController
 * (APD-BE-001, API-BE-003..007, API-BE-045, APD-BE-006, BLD-BE-006, TST-BE-006, TST-BE-007, TST-BE-040, TASK-BE-019, TASK-BE-044).
 */
@ExtendWith(MockitoExtension.class)
class KioskAttendanceControllerTest {

    private static final String KIOSK_SECRET = "test-secret";

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private AttendanceService attendanceService;

    @Mock
    private OfflineBatchSyncService offlineBatchSyncService;

    @Mock
    private EnrollmentService enrollmentService;

    @Mock
    private KioskAuthService kioskAuthService;

    @InjectMocks
    private KioskAttendanceController kioskAttendanceController;

    private Kiosk activeKiosk;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(kioskAttendanceController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        activeKiosk = Kiosk.builder()
                .id("KIOSK-HN-01")
                .locationName("Cổng chính Hà Nội")
                .isActive(true)
                .build();
    }

    @Nested
    @DisplayName("Kiểm tra sức khỏe trạm Kiosk (GET /api/v1/kiosk/health)")
    class KioskHealthTests {

        @Test
        @DisplayName("Kiểm tra sức khỏe trạm Kiosk thành công -> trả về 200 OK HEALTHY status UP")
        void checkHealth_Success_Returns200() throws Exception {
            mockMvc.perform(get("/api/v1/kiosk/health"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("HEALTHY"))
                    .andExpect(jsonPath("$.data.status").value("UP"));
        }
    }

    @Nested
    @DisplayName("Ghi nhận điểm danh đơn lẻ (POST /api/v1/kiosk/punch)")
    class RecordPunchTests {

        @Test
        @DisplayName("Ghi nhận lượt quẹt thành công -> trả về 200 OK PUNCH_RECORDED")
        void recordPunch_Success_Returns200() throws Exception {
            OffsetDateTime punchTime = OffsetDateTime.parse("2026-10-08T08:30:15+07:00");
            KioskPunchRequest request = new KioskPunchRequest(
                    1042L,
                    punchTime,
                    "VERIFICATION_FACE",
                    new BigDecimal("0.8824"),
                    "KIOSK-HN-01"
            );

            PunchResult result = new PunchResult(
                    9812L,
                    1042L,
                    "NV-1042",
                    "Ngô Văn Dũng",
                    PunchType.CHECK_IN,
                    punchTime,
                    AttendanceStatus.ON_TIME,
                    0,
                    "Phòng Kỹ thuật"
            );

            when(kioskAuthService.authenticate("KIOSK-HN-01", KIOSK_SECRET)).thenReturn(activeKiosk);
            when(attendanceService.recordPunch(any(KioskPunchRequest.class))).thenReturn(result);

            mockMvc.perform(post("/api/v1/kiosk/punch")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("PUNCH_RECORDED"))
                    .andExpect(jsonPath("$.message").value("Ghi nhận điểm danh thành công"))
                    .andExpect(jsonPath("$.data.recordId").value(9812))
                    .andExpect(jsonPath("$.data.employeeId").value(1042))
                    .andExpect(jsonPath("$.data.employeeCode").value("NV-1042"))
                    .andExpect(jsonPath("$.data.fullName").value("Ngô Văn Dũng"))
                    .andExpect(jsonPath("$.data.punchType").value("CHECK_IN"))
                    .andExpect(jsonPath("$.data.status").value("ON_TIME"));

            verify(attendanceService).recordPunch(any(KioskPunchRequest.class));
        }

        @Test
        @DisplayName("Thiếu header X-Kiosk-Id -> trả về 400 Bad Request VALIDATION_FAILED")
        void recordPunch_MissingHeader_Returns400() throws Exception {
            KioskPunchRequest request = new KioskPunchRequest(
                    1042L,
                    OffsetDateTime.now(),
                    "VERIFICATION_FACE",
                    new BigDecimal("0.8824"),
                    "KIOSK-HN-01"
            );

            mockMvc.perform(post("/api/v1/kiosk/punch")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.invalidParams[0].field").value("X-Kiosk-Id"));

            verifyNoInteractions(attendanceService);
        }

        @Test
        @DisplayName("Thiếu header X-Kiosk-Secret -> trả về 401 KIOSK_UNAUTHORIZED")
        void recordPunch_MissingSecret_Returns401() throws Exception {
            KioskPunchRequest request = new KioskPunchRequest(
                    1042L,
                    OffsetDateTime.now(),
                    "VERIFICATION_FACE",
                    new BigDecimal("0.8824"),
                    "KIOSK-HN-01"
            );

            when(kioskAuthService.authenticate("KIOSK-HN-01", null))
                    .thenThrow(new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                            "Mã bí mật của trạm Kiosk không chính xác: KIOSK-HN-01"));

            mockMvc.perform(post("/api/v1/kiosk/punch")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("KIOSK_UNAUTHORIZED"));

            verifyNoInteractions(attendanceService);
        }

        @Test
        @DisplayName("Sai header X-Kiosk-Secret -> trả về 401 KIOSK_UNAUTHORIZED")
        void recordPunch_WrongSecret_Returns401() throws Exception {
            KioskPunchRequest request = new KioskPunchRequest(
                    1042L,
                    OffsetDateTime.now(),
                    "VERIFICATION_FACE",
                    new BigDecimal("0.8824"),
                    "KIOSK-HN-01"
            );

            when(kioskAuthService.authenticate("KIOSK-HN-01", "wrong-secret"))
                    .thenThrow(new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                            "Mã bí mật của trạm Kiosk không chính xác: KIOSK-HN-01"));

            mockMvc.perform(post("/api/v1/kiosk/punch")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .header("X-Kiosk-Secret", "wrong-secret")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("KIOSK_UNAUTHORIZED"));

            verifyNoInteractions(attendanceService);
        }

        @Test
        @DisplayName("Trạm Kiosk không tồn tại hoặc inactive -> trả về 401 KIOSK_UNAUTHORIZED")
        void recordPunch_KioskUnauthorized_Returns401() throws Exception {
            KioskPunchRequest request = new KioskPunchRequest(
                    1042L,
                    OffsetDateTime.now(),
                    "VERIFICATION_FACE",
                    new BigDecimal("0.8824"),
                    "KIOSK-DISABLED"
            );

            when(kioskAuthService.authenticate("KIOSK-DISABLED", KIOSK_SECRET))
                    .thenThrow(new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                            "Trạm Kiosk không tồn tại hoặc đã bị vô hiệu hóa: KIOSK-DISABLED"));

            mockMvc.perform(post("/api/v1/kiosk/punch")
                            .header("X-Kiosk-Id", "KIOSK-DISABLED")
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("KIOSK_UNAUTHORIZED"));

            verifyNoInteractions(attendanceService);
        }

        @Test
        @DisplayName("Header X-Kiosk-Id không khớp với kioskId trong body -> trả về 401 KIOSK_UNAUTHORIZED")
        void recordPunch_HeaderBodyMismatch_Returns401() throws Exception {
            KioskPunchRequest request = new KioskPunchRequest(
                    1042L,
                    OffsetDateTime.now(),
                    "VERIFICATION_FACE",
                    new BigDecimal("0.8824"),
                    "KIOSK-HN-02"
            );

            when(kioskAuthService.authenticate("KIOSK-HN-01", KIOSK_SECRET)).thenReturn(activeKiosk);

            mockMvc.perform(post("/api/v1/kiosk/punch")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("KIOSK_UNAUTHORIZED"));

            verifyNoInteractions(attendanceService);
        }

        @Test
        @DisplayName("Vi phạm Cooldown 120 giây -> trả về 409 Conflict COOLDOWN_ACTIVE")
        void recordPunch_CooldownActive_Returns409() throws Exception {
            KioskPunchRequest request = new KioskPunchRequest(
                    1042L,
                    OffsetDateTime.now(),
                    "VERIFICATION_FACE",
                    new BigDecimal("0.8824"),
                    "KIOSK-HN-01"
            );

            when(kioskAuthService.authenticate("KIOSK-HN-01", KIOSK_SECRET)).thenReturn(activeKiosk);
            when(attendanceService.recordPunch(any(KioskPunchRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.COOLDOWN_ACTIVE, "Chống quẹt trùng lặp trong 120s"));

            mockMvc.perform(post("/api/v1/kiosk/punch")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("COOLDOWN_ACTIVE"));
        }

        @Test
        @DisplayName("Request body sai validate (thiếu employeeId) -> trả về 400 VALIDATION_FAILED")
        void recordPunch_InvalidBody_Returns400() throws Exception {
            String invalidJson = """
                    {
                      "employeeId": null,
                      "punchTimestamp": "2026-10-08T08:30:15+07:00",
                      "verificationMethod": "VERIFICATION_FACE",
                      "kioskId": "KIOSK-HN-01"
                    }
                    """;

            mockMvc.perform(post("/api/v1/kiosk/punch")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }
    }

    @Nested
    @DisplayName("Đồng bộ gói lô ngoại tuyến (POST /api/v1/kiosk/sync-batch)")
    class SyncBatchTests {

        @Test
        @DisplayName("Đồng bộ gói lô thành công -> trả về 200 OK BATCH_SYNCED")
        void syncBatch_Success_Returns200() throws Exception {
            OfflinePunchRecord rec1 = new OfflinePunchRecord(101L, 1042L, OffsetDateTime.now(), "VERIFICATION_FACE", new BigDecimal("0.891"));
            OfflinePunchRecord rec2 = new OfflinePunchRecord(102L, 1045L, OffsetDateTime.now(), "VERIFICATION_PIN", null);
            KioskSyncBatchRequest request = new KioskSyncBatchRequest("KIOSK-HN-01", 2, List.of(rec1, rec2));

            BatchSyncResult result = new BatchSyncResult(2, List.of(101L, 102L), List.of());

            when(kioskAuthService.authenticate("KIOSK-HN-01", KIOSK_SECRET)).thenReturn(activeKiosk);
            when(offlineBatchSyncService.processOfflineBatch(any(KioskSyncBatchRequest.class))).thenReturn(result);

            mockMvc.perform(post("/api/v1/kiosk/sync-batch")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("BATCH_SYNCED"))
                    .andExpect(jsonPath("$.data.syncedCount").value(2))
                    .andExpect(jsonPath("$.data.syncedLocalIds[0]").value(101))
                    .andExpect(jsonPath("$.data.syncedLocalIds[1]").value(102));

            verify(offlineBatchSyncService).processOfflineBatch(any(KioskSyncBatchRequest.class));
        }

        @Test
        @DisplayName("Thiếu header X-Kiosk-Id -> trả về 400 Bad Request")
        void syncBatch_MissingHeader_Returns400() throws Exception {
            KioskSyncBatchRequest request = new KioskSyncBatchRequest("KIOSK-HN-01", 1, List.of(
                    new OfflinePunchRecord(101L, 1042L, OffsetDateTime.now(), "VERIFICATION_FACE", new BigDecimal("0.891"))
            ));

            mockMvc.perform(post("/api/v1/kiosk/sync-batch")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verifyNoInteractions(offlineBatchSyncService);
        }

        @Test
        @DisplayName("Thiếu header X-Kiosk-Secret -> trả về 401 KIOSK_UNAUTHORIZED")
        void syncBatch_MissingSecret_Returns401() throws Exception {
            KioskSyncBatchRequest request = new KioskSyncBatchRequest("KIOSK-HN-01", 1, List.of(
                    new OfflinePunchRecord(101L, 1042L, OffsetDateTime.now(), "VERIFICATION_FACE", new BigDecimal("0.891"))
            ));

            when(kioskAuthService.authenticate("KIOSK-HN-01", null))
                    .thenThrow(new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                            "Mã bí mật của trạm Kiosk không chính xác: KIOSK-HN-01"));

            mockMvc.perform(post("/api/v1/kiosk/sync-batch")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("KIOSK_UNAUTHORIZED"));

            verifyNoInteractions(offlineBatchSyncService);
        }

        @Test
        @DisplayName("Header X-Kiosk-Id không khớp body -> trả về 401 KIOSK_UNAUTHORIZED")
        void syncBatch_HeaderMismatch_Returns401() throws Exception {
            KioskSyncBatchRequest request = new KioskSyncBatchRequest("KIOSK-HN-02", 1, List.of(
                    new OfflinePunchRecord(101L, 1042L, OffsetDateTime.now(), "VERIFICATION_FACE", new BigDecimal("0.891"))
            ));

            when(kioskAuthService.authenticate("KIOSK-HN-01", KIOSK_SECRET)).thenReturn(activeKiosk);

            mockMvc.perform(post("/api/v1/kiosk/sync-batch")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("KIOSK_UNAUTHORIZED"));

            verifyNoInteractions(offlineBatchSyncService);
        }
    }

    @Nested
    @DisplayName("Tải danh mục vector ArcFace (GET /api/v1/kiosk/gallery)")
    class GetGalleryTests {

        @Test
        @DisplayName("Tải gallery thành công -> trả về 200 OK GALLERY_FETCHED")
        void getGallery_Success_Returns200() throws Exception {
            List<Float> vector = new ArrayList<>(Collections.nCopies(512, 0.05f));
            GalleryItem item = new GalleryItem(
                    1042L,
                    "NV-1042",
                    "Ngô Văn Dũng",
                    "Phòng Kỹ thuật",
                    vector,
                    OffsetDateTime.now()
            );
            GalleryResponse response = new GalleryResponse(18, 1, List.of(item));

            when(kioskAuthService.authenticate("KIOSK-HN-01", KIOSK_SECRET)).thenReturn(activeKiosk);
            when(enrollmentService.getGallery()).thenReturn(response);

            mockMvc.perform(get("/api/v1/kiosk/gallery")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .header("X-Kiosk-Secret", KIOSK_SECRET))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("GALLERY_FETCHED"))
                    .andExpect(jsonPath("$.data.galleryVersion").value(18))
                    .andExpect(jsonPath("$.data.totalCount").value(1))
                    .andExpect(jsonPath("$.data.items[0].employeeCode").value("NV-1042"));

            verify(enrollmentService).getGallery();
        }

        @Test
        @DisplayName("Thiếu header X-Kiosk-Id -> trả về 400 Bad Request")
        void getGallery_MissingHeader_Returns400() throws Exception {
            mockMvc.perform(get("/api/v1/kiosk/gallery"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verifyNoInteractions(enrollmentService);
        }

        @Test
        @DisplayName("Thiếu header X-Kiosk-Secret -> trả về 401 KIOSK_UNAUTHORIZED")
        void getGallery_MissingSecret_Returns401() throws Exception {
            when(kioskAuthService.authenticate("KIOSK-HN-01", null))
                    .thenThrow(new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                            "Mã bí mật của trạm Kiosk không chính xác: KIOSK-HN-01"));

            mockMvc.perform(get("/api/v1/kiosk/gallery")
                            .header("X-Kiosk-Id", "KIOSK-HN-01"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("KIOSK_UNAUTHORIZED"));

            verifyNoInteractions(enrollmentService);
        }

        @Test
        @DisplayName("Trạm Kiosk không tồn tại -> trả về 401 KIOSK_UNAUTHORIZED")
        void getGallery_KioskUnauthorized_Returns401() throws Exception {
            when(kioskAuthService.authenticate("KIOSK-UNKNOWN", KIOSK_SECRET))
                    .thenThrow(new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                            "Trạm Kiosk không tồn tại hoặc đã bị vô hiệu hóa: KIOSK-UNKNOWN"));

            mockMvc.perform(get("/api/v1/kiosk/gallery")
                            .header("X-Kiosk-Id", "KIOSK-UNKNOWN")
                            .header("X-Kiosk-Secret", KIOSK_SECRET))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("KIOSK_UNAUTHORIZED"));

            verifyNoInteractions(enrollmentService);
        }
    }

    @Nested
    @DisplayName("Thẩm định OTP trạm Kiosk (POST /api/v1/kiosk/verify-otp)")
    class VerifyOtpTests {

        @Test
        @DisplayName("Thẩm định OTP hợp lệ -> trả về 200 OK OTP_VERIFIED")
        void verifyOtp_Success_Returns200() throws Exception {
            KioskVerifyOtpRequest request = new KioskVerifyOtpRequest("123456", "KIOSK-HN-01");
            OtpVerificationResult result = new OtpVerificationResult(
                    "token123",
                    1042L,
                    "NV-1042",
                    "Ngô Văn Dũng",
                    "Phòng Kỹ thuật"
            );

            when(kioskAuthService.authenticate("KIOSK-HN-01", KIOSK_SECRET)).thenReturn(activeKiosk);
            when(enrollmentService.verifyOtp(any(KioskVerifyOtpRequest.class))).thenReturn(result);

            mockMvc.perform(post("/api/v1/kiosk/verify-otp")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("OTP_VERIFIED"))
                    .andExpect(jsonPath("$.data.sessionToken").value("token123"))
                    .andExpect(jsonPath("$.data.employeeCode").value("NV-1042"));

            verify(enrollmentService).verifyOtp(any(KioskVerifyOtpRequest.class));
        }

        @Test
        @DisplayName("Mã OTP sai format (không đủ 6 số) -> trả về 400 VALIDATION_FAILED")
        void verifyOtp_InvalidFormat_Returns400() throws Exception {
            KioskVerifyOtpRequest request = new KioskVerifyOtpRequest("12", "KIOSK-HN-01");

            mockMvc.perform(post("/api/v1/kiosk/verify-otp")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verifyNoInteractions(enrollmentService);
        }
    }

    @Nested
    @DisplayName("Đăng ký vector khuôn mặt (POST /api/v1/kiosk/enroll-face)")
    class EnrollFaceTests {

        @Test
        @DisplayName("Nạp vector 512D thành công -> trả về 200 OK FACE_ENROLLED")
        void enrollFace_Success_Returns200() throws Exception {
            List<Float> vector = new ArrayList<>();
            // Vector 512D chuẩn hóa L2 đơn giản: phần tử đầu tiên = 1.0, còn lại = 0.0
            vector.add(1.0f);
            for (int i = 1; i < 512; i++) {
                vector.add(0.0f);
            }

            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(
                    "123456",
                    "sessionToken123",
                    vector,
                    "KIOSK-HN-01"
            );

            EnrollmentResult result = new EnrollmentResult(
                    1042L,
                    55L,
                    EmployeeStatus.ACTIVE,
                    OffsetDateTime.now()
            );

            when(kioskAuthService.authenticate("KIOSK-HN-01", KIOSK_SECRET)).thenReturn(activeKiosk);
            when(enrollmentService.enrollFace(any(KioskEnrollFaceRequest.class))).thenReturn(result);

            mockMvc.perform(post("/api/v1/kiosk/enroll-face")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .header("X-Kiosk-Secret", KIOSK_SECRET)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("FACE_ENROLLED"))
                    .andExpect(jsonPath("$.data.employeeId").value(1042))
                    .andExpect(jsonPath("$.data.status").value("ACTIVE"));

            verify(enrollmentService).enrollFace(any(KioskEnrollFaceRequest.class));
        }

        @Test
        @DisplayName("Thiếu header X-Kiosk-Id -> trả về 400 Bad Request")
        void enrollFace_MissingHeader_Returns400() throws Exception {
            List<Float> vector = new ArrayList<>(Collections.nCopies(512, 0.0f));
            vector.set(0, 1.0f);

            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(
                    "123456",
                    "sessionToken123",
                    vector,
                    "KIOSK-HN-01"
            );

            mockMvc.perform(post("/api/v1/kiosk/enroll-face")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verifyNoInteractions(enrollmentService);
        }

        @Test
        @DisplayName("Thiếu header X-Kiosk-Secret -> trả về 401 KIOSK_UNAUTHORIZED")
        void enrollFace_MissingSecret_Returns401() throws Exception {
            List<Float> vector = new ArrayList<>(Collections.nCopies(512, 0.0f));
            vector.set(0, 1.0f);

            KioskEnrollFaceRequest request = new KioskEnrollFaceRequest(
                    "123456",
                    "sessionToken123",
                    vector,
                    "KIOSK-HN-01"
            );

            when(kioskAuthService.authenticate("KIOSK-HN-01", null))
                    .thenThrow(new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                            "Mã bí mật của trạm Kiosk không chính xác: KIOSK-HN-01"));

            mockMvc.perform(post("/api/v1/kiosk/enroll-face")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("KIOSK_UNAUTHORIZED"));

            verifyNoInteractions(enrollmentService);
        }
    }
}
