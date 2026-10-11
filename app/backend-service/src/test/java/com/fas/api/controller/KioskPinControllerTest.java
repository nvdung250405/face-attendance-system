package com.fas.api.controller;

import com.fas.api.dto.request.KioskVerifyPinRequest;
import com.fas.api.dto.response.PinVerificationResult;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.entity.Kiosk;
import com.fas.data.repository.KioskRepository;
import com.fas.service.PinService;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử REST Controller cho KioskPinController
 * (APD-BE-012, API-BE-022, FR-BE-012, BLD-BE-022, TST-BE-021, TASK-BE-027).
 */
@ExtendWith(MockitoExtension.class)
class KioskPinControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private PinService pinService;

    @Mock
    private KioskRepository kioskRepository;

    @InjectMocks
    private KioskPinController kioskPinController;

    private Kiosk activeKiosk;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(kioskPinController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        activeKiosk = Kiosk.builder()
                .id("KIOSK-HN-01")
                .locationName("Cổng chính Hà Nội")
                .isActive(true)
                .build();
    }

    @Nested
    @DisplayName("Thẩm định mã PIN trạm Kiosk (POST /api/v1/kiosk/verify-pin)")
    class VerifyPinTests {

        @Test
        @DisplayName("Thẩm định PIN đúng -> trả về 200 OK kèm mã PIN_VERIFIED và thông tin nhân sự")
        void verifyPin_Success_Returns200() throws Exception {
            KioskVerifyPinRequest request = new KioskVerifyPinRequest("NV-1042", "123456");
            PinVerificationResult result = new PinVerificationResult(1042L, "NV-1042", "Ngô Văn Dũng", "Phòng Kỹ thuật");

            when(kioskRepository.findByIdAndIsActiveTrue("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));
            when(pinService.verifyPin(any(KioskVerifyPinRequest.class))).thenReturn(result);

            mockMvc.perform(post("/api/v1/kiosk/verify-pin")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("PIN_VERIFIED"))
                    .andExpect(jsonPath("$.message").value("Mã PIN chính xác"))
                    .andExpect(jsonPath("$.data.employeeId").value(1042))
                    .andExpect(jsonPath("$.data.employeeCode").value("NV-1042"))
                    .andExpect(jsonPath("$.data.fullName").value("Ngô Văn Dũng"))
                    .andExpect(jsonPath("$.data.department").value("Phòng Kỹ thuật"));

            verify(pinService).verifyPin(any(KioskVerifyPinRequest.class));
        }

        @Test
        @DisplayName("Thiếu header X-Kiosk-Id -> trả về 400 Bad Request VALIDATION_FAILED")
        void verifyPin_MissingKioskHeader_Returns400() throws Exception {
            KioskVerifyPinRequest request = new KioskVerifyPinRequest("NV-1042", "123456");

            mockMvc.perform(post("/api/v1/kiosk/verify-pin")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verifyNoInteractions(pinService);
        }

        @Test
        @DisplayName("Trạm Kiosk không tồn tại hoặc inactive -> trả về 401 KIOSK_UNAUTHORIZED")
        void verifyPin_KioskInactiveOrNotFound_Returns401() throws Exception {
            KioskVerifyPinRequest request = new KioskVerifyPinRequest("NV-1042", "123456");

            when(kioskRepository.findByIdAndIsActiveTrue("KIOSK-DISABLED")).thenReturn(Optional.empty());

            mockMvc.perform(post("/api/v1/kiosk/verify-pin")
                            .header("X-Kiosk-Id", "KIOSK-DISABLED")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("KIOSK_UNAUTHORIZED"));

            verifyNoInteractions(pinService);
        }

        @Test
        @DisplayName("Mã PIN không đúng -> ném PIN_INVALID trả về 401 Unauthorized")
        void verifyPin_WrongPin_Returns401() throws Exception {
            KioskVerifyPinRequest request = new KioskVerifyPinRequest("NV-1042", "000000");

            when(kioskRepository.findByIdAndIsActiveTrue("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));
            when(pinService.verifyPin(any(KioskVerifyPinRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.PIN_INVALID, "Mã PIN không chính xác. Bạn còn 4 lần thử."));

            mockMvc.perform(post("/api/v1/kiosk/verify-pin")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("PIN_INVALID"));
        }

        @Test
        @DisplayName("Sai quá 5 lần hoặc đang bị khóa -> ném PIN_LOCKED trả về 423 Locked")
        void verifyPin_Locked_Returns423() throws Exception {
            KioskVerifyPinRequest request = new KioskVerifyPinRequest("NV-1042", "123456");

            when(kioskRepository.findByIdAndIsActiveTrue("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));
            when(pinService.verifyPin(any(KioskVerifyPinRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.PIN_LOCKED, "Mã PIN đã bị khóa 15 phút do nhập sai 5 lần liên tiếp."));

            mockMvc.perform(post("/api/v1/kiosk/verify-pin")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isLocked())
                    .andExpect(jsonPath("$.code").value("PIN_LOCKED"));
        }

        @Test
        @DisplayName("Không tìm thấy nhân viên -> trả về 404 EMPLOYEE_NOT_FOUND")
        void verifyPin_EmployeeNotFound_Returns404() throws Exception {
            KioskVerifyPinRequest request = new KioskVerifyPinRequest("NV-9999", "123456");

            when(kioskRepository.findByIdAndIsActiveTrue("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));
            when(pinService.verifyPin(any(KioskVerifyPinRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân sự với mã: NV-9999"));

            mockMvc.perform(post("/api/v1/kiosk/verify-pin")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("EMPLOYEE_NOT_FOUND"));
        }

        @Test
        @DisplayName("Nhân viên bị TERMINATED -> trả về 403 ACCESS_DENIED")
        void verifyPin_TerminatedEmployee_Returns403() throws Exception {
            KioskVerifyPinRequest request = new KioskVerifyPinRequest("NV-1042", "123456");

            when(kioskRepository.findByIdAndIsActiveTrue("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));
            when(pinService.verifyPin(any(KioskVerifyPinRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.ACCESS_DENIED, "Tài khoản nhân viên không ở trạng thái hoạt động."));

            mockMvc.perform(post("/api/v1/kiosk/verify-pin")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
        }

        @Test
        @DisplayName("Dữ liệu request không hợp lệ (mã PIN không đủ 6 chữ số) -> trả về 400 Bad Request")
        void verifyPin_InvalidPinFormat_Returns400() throws Exception {
            KioskVerifyPinRequest request = new KioskVerifyPinRequest("NV-1042", "123");

            mockMvc.perform(post("/api/v1/kiosk/verify-pin")
                            .header("X-Kiosk-Id", "KIOSK-HN-01")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }
    }
}
