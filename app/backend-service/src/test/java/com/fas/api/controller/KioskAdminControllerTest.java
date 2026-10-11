package com.fas.api.controller;

import com.fas.api.dto.PageResponse;
import com.fas.api.dto.request.RegisterKioskRequest;
import com.fas.api.dto.request.UpdateKioskRequest;
import com.fas.api.dto.response.KioskHealthResponse;
import com.fas.api.dto.response.KioskItemResponse;
import com.fas.api.dto.response.RegisterKioskResponse;
import com.fas.api.dto.response.RotateKioskTokenResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.service.KioskAdminService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử REST Controller cho KioskAdminController
 * (APD-BE-018, API-BE-032, API-BE-033, API-BE-034, FR-BE-017, BLD-BE-029, TST-BE-031, TASK-BE-034).
 */
@ExtendWith(MockitoExtension.class)
class KioskAdminControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private KioskAdminService kioskAdminService;

    @InjectMocks
    private KioskAdminController kioskAdminController;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(kioskAdminController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Nested
    @DisplayName("1. Đăng ký trạm Kiosk (POST /api/v1/admin/kiosks)")
    class RegisterKioskTests {

        @Test
        @DisplayName("Đăng ký trạm Kiosk thành công -> trả về 201 Created kèm Secret Token một lần")
        void registerKiosk_Success_Returns201() throws Exception {
            RegisterKioskRequest request = new RegisterKioskRequest("KIOSK-HN-02", "Cổng Phụ Hà Nội");
            RegisterKioskResponse response = new RegisterKioskResponse(
                    "KIOSK-HN-02", "Cổng Phụ Hà Nội", "secret-token-xyz-123", Instant.now()
            );

            when(kioskAdminService.registerKiosk(any(RegisterKioskRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/v1/admin/kiosks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("KIOSK_REGISTERED"))
                    .andExpect(jsonPath("$.data.id").value("KIOSK-HN-02"))
                    .andExpect(jsonPath("$.data.secretToken").value("secret-token-xyz-123"));

            verify(kioskAdminService).registerKiosk(any(RegisterKioskRequest.class));
        }

        @Test
        @DisplayName("Trùng mã trạm Kiosk -> trả về 409 Conflict KIOSK_ALREADY_EXISTS")
        void registerKiosk_Duplicate_Returns409() throws Exception {
            RegisterKioskRequest request = new RegisterKioskRequest("KIOSK-HN-01", "Cổng Chính");

            when(kioskAdminService.registerKiosk(any(RegisterKioskRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.KIOSK_ALREADY_EXISTS, "Mã trạm đã tồn tại"));

            mockMvc.perform(post("/api/v1/admin/kiosks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("KIOSK_ALREADY_EXISTS"));
        }

        @Test
        @DisplayName("Thiếu thông tin bắt buộc -> trả về 400 Bad Request VALIDATION_FAILED")
        void registerKiosk_BlankId_Returns400() throws Exception {
            RegisterKioskRequest request = new RegisterKioskRequest("", "Cổng Chính");

            mockMvc.perform(post("/api/v1/admin/kiosks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }
    }

    @Nested
    @DisplayName("2. Tra cứu danh sách & chi tiết trạm Kiosk")
    class QueryKioskTests {

        @Test
        @DisplayName("Lấy danh sách trạm phân trang thành công -> trả về 200 OK")
        void listKiosks_Success_Returns200() throws Exception {
            KioskItemResponse item = new KioskItemResponse(
                    "KIOSK-HN-01", "Cổng Chính Hà Nội", true, Instant.now(), Instant.now(), true
            );
            PageResponse<KioskItemResponse> pageResponse = new PageResponse<>(List.of(item), 0, 20, 1L, 1, true, true);

            when(kioskAdminService.listKiosks(any(Pageable.class))).thenReturn(pageResponse);

            mockMvc.perform(get("/api/v1/admin/kiosks")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("KIOSKS_FETCHED"))
                    .andExpect(jsonPath("$.data.content[0].id").value("KIOSK-HN-01"));

            verify(kioskAdminService).listKiosks(any(Pageable.class));
        }

        @Test
        @DisplayName("Lấy chi tiết trạm Kiosk thành công -> trả về 200 OK")
        void getKioskById_Success_Returns200() throws Exception {
            KioskItemResponse item = new KioskItemResponse(
                    "KIOSK-HN-01", "Cổng Chính Hà Nội", true, Instant.now(), Instant.now(), true
            );

            when(kioskAdminService.getKioskById("KIOSK-HN-01")).thenReturn(item);

            mockMvc.perform(get("/api/v1/admin/kiosks/KIOSK-HN-01"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value("KIOSK-HN-01"));

            verify(kioskAdminService).getKioskById("KIOSK-HN-01");
        }

        @Test
        @DisplayName("Không tìm thấy trạm Kiosk -> trả về 404 KIOSK_NOT_FOUND")
        void getKioskById_NotFound_Returns404() throws Exception {
            when(kioskAdminService.getKioskById("KIOSK-999"))
                    .thenThrow(new ApiException(ApiErrorCode.KIOSK_NOT_FOUND, "Không tìm thấy trạm Kiosk"));

            mockMvc.perform(get("/api/v1/admin/kiosks/KIOSK-999"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("KIOSK_NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("3. Cập nhật, đổi Secret Token và theo dõi sức khỏe trạm Kiosk")
    class LifecycleKioskTests {

        @Test
        @DisplayName("Cập nhật thông tin trạm Kiosk thành công -> trả về 200 OK")
        void updateKiosk_Success_Returns200() throws Exception {
            UpdateKioskRequest request = new UpdateKioskRequest("Tầng 2 Tòa Nhà", false);
            KioskItemResponse updated = new KioskItemResponse(
                    "KIOSK-HN-01", "Tầng 2 Tòa Nhà", false, Instant.now(), Instant.now(), false
            );

            when(kioskAdminService.updateKiosk(eq("KIOSK-HN-01"), any(UpdateKioskRequest.class))).thenReturn(updated);

            mockMvc.perform(patch("/api/v1/admin/kiosks/KIOSK-HN-01")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("KIOSK_UPDATED"))
                    .andExpect(jsonPath("$.data.locationName").value("Tầng 2 Tòa Nhà"))
                    .andExpect(jsonPath("$.data.isActive").value(false));

            verify(kioskAdminService).updateKiosk(eq("KIOSK-HN-01"), any(UpdateKioskRequest.class));
        }

        @Test
        @DisplayName("Đổi Secret Token trạm Kiosk thành công -> trả về 200 OK kèm token mới")
        void rotateSecretToken_Success_Returns200() throws Exception {
            RotateKioskTokenResponse response = new RotateKioskTokenResponse(
                    "KIOSK-HN-01", "new-secret-token-456", Instant.now()
            );

            when(kioskAdminService.rotateSecretToken("KIOSK-HN-01")).thenReturn(response);

            mockMvc.perform(post("/api/v1/admin/kiosks/KIOSK-HN-01/rotate-secret"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("KIOSK_TOKEN_ROTATED"))
                    .andExpect(jsonPath("$.data.newSecretToken").value("new-secret-token-456"));

            verify(kioskAdminService).rotateSecretToken("KIOSK-HN-01");
        }

        @Test
        @DisplayName("Lấy trạng thái kết nối trạm Kiosk thành công -> trả về 200 OK")
        void getKioskHealth_Success_Returns200() throws Exception {
            KioskHealthResponse response = new KioskHealthResponse(
                    "KIOSK-HN-01", "Cổng Chính Hà Nội", true, Instant.now(), true, null
            );

            when(kioskAdminService.getKioskHealth("KIOSK-HN-01")).thenReturn(response);

            mockMvc.perform(get("/api/v1/admin/kiosks/KIOSK-HN-01/health"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("KIOSK_HEALTH_FETCHED"))
                    .andExpect(jsonPath("$.data.isHealthy").value(true));

            verify(kioskAdminService).getKioskHealth("KIOSK-HN-01");
        }
    }
}
