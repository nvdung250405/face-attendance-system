package com.fas.api.controller;

import com.fas.api.dto.response.PinOperationResult;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.entity.User;
import com.fas.data.repository.UserRepository;
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

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử REST Controller cho EmployeePinController
 * (APD-BE-011, API-BE-021, FR-BE-012, BLD-BE-022, TASK-BE-027).
 */
@ExtendWith(MockitoExtension.class)
class EmployeePinControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private PinService pinService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EmployeePinController employeePinController;

    private final Principal mockPrincipal = () -> "dung.nv@company.com";
    private User sampleUser;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(employeePinController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleUser = User.builder()
                .id(1042L)
                .employeeCode("NV-1042")
                .email("dung.nv@company.com")
                .build();
    }

    @Nested
    @DisplayName("1. Tra cứu trạng thái mã PIN (GET /api/v1/employee/pin)")
    class GetPinStatusTests {

        @Test
        @DisplayName("Lấy trạng thái thành công khi tài khoản đã có PIN -> hasPin: true")
        void getPinStatus_HasPin_Returns200() throws Exception {
            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));
            when(pinService.hasPin(1042L)).thenReturn(true);

            mockMvc.perform(get("/api/v1/employee/pin")
                            .principal(mockPrincipal))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("PIN_STATUS"))
                    .andExpect(jsonPath("$.data.hasPin").value(true));

            verify(pinService).hasPin(1042L);
        }

        @Test
        @DisplayName("Lấy trạng thái thành công khi tài khoản chưa có PIN -> hasPin: false")
        void getPinStatus_NoPin_Returns200() throws Exception {
            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));
            when(pinService.hasPin(1042L)).thenReturn(false);

            mockMvc.perform(get("/api/v1/employee/pin")
                            .principal(mockPrincipal))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("PIN_STATUS"))
                    .andExpect(jsonPath("$.data.hasPin").value(false));

            verify(pinService).hasPin(1042L);
        }

        @Test
        @DisplayName("Chưa đăng nhập -> trả về 403 Forbidden")
        void getPinStatus_Unauthenticated_Returns403() throws Exception {
            mockMvc.perform(get("/api/v1/employee/pin"))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
        }
    }

    @Nested
    @DisplayName("2. Thiết lập hoặc đổi mã PIN (POST /api/v1/employee/pin)")
    class ManagePinTests {

        @Test
        @DisplayName("Thiết lập mã PIN lần đầu thành công -> trả về 200 OK và hasPin: true")
        void setupPin_Success_Returns200() throws Exception {
            Map<String, String> body = Map.of(
                    "pin", "123456",
                    "confirmPin", "123456"
            );

            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));
            when(pinService.setupPin(eq(1042L), eq("123456"), eq("123456")))
                    .thenReturn(new PinOperationResult(true, "Thiết lập mã PIN dự phòng thành công"));

            mockMvc.perform(post("/api/v1/employee/pin")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("PIN_SUCCESS"))
                    .andExpect(jsonPath("$.data.hasPin").value(true));

            verify(pinService).setupPin(1042L, "123456", "123456");
        }

        @Test
        @DisplayName("Đổi mã PIN thành công khi có currentPin -> trả về 200 OK và hasPin: true")
        void changePin_Success_Returns200() throws Exception {
            Map<String, String> body = Map.of(
                    "currentPin", "123456",
                    "newPin", "654321",
                    "confirmPin", "654321"
            );

            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));
            when(pinService.changePin(eq(1042L), eq("123456"), eq("654321"), eq("654321")))
                    .thenReturn(new PinOperationResult(true, "Đổi mã PIN dự phòng thành công"));

            mockMvc.perform(post("/api/v1/employee/pin")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("PIN_SUCCESS"))
                    .andExpect(jsonPath("$.data.hasPin").value(true));

            verify(pinService).changePin(1042L, "123456", "654321", "654321");
        }

        @Test
        @DisplayName("Đổi PIN thất bại khi mã PIN hiện tại sai -> trả về 401 PIN_INVALID")
        void changePin_WrongCurrentPin_Returns401() throws Exception {
            Map<String, String> body = Map.of(
                    "currentPin", "000000",
                    "newPin", "654321",
                    "confirmPin", "654321"
            );

            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));
            when(pinService.changePin(eq(1042L), eq("000000"), eq("654321"), eq("654321")))
                    .thenThrow(new ApiException(ApiErrorCode.PIN_INVALID, "Mã PIN hiện tại không chính xác."));

            mockMvc.perform(post("/api/v1/employee/pin")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("PIN_INVALID"));
        }

        @Test
        @DisplayName("Thiết lập lại khi đã có PIN -> trả về 400 DATA_INTEGRITY_VIOLATION")
        void setupPin_AlreadyHasPin_Returns400() throws Exception {
            Map<String, String> body = Map.of(
                    "pin", "123456",
                    "confirmPin", "123456"
            );

            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));
            when(pinService.setupPin(eq(1042L), eq("123456"), eq("123456")))
                    .thenThrow(new ApiException(ApiErrorCode.DATA_INTEGRITY_VIOLATION, "Nhân viên đã thiết lập mã PIN."));

            mockMvc.perform(post("/api/v1/employee/pin")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("DATA_INTEGRITY_VIOLATION"));
        }

        @Test
        @DisplayName("Mã PIN xác nhận không khớp -> trả về 400 VALIDATION_FAILED")
        void setupPin_MismatchConfirm_Returns400() throws Exception {
            Map<String, String> body = Map.of(
                    "pin", "123456",
                    "confirmPin", "654321"
            );

            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));
            when(pinService.setupPin(eq(1042L), eq("123456"), eq("654321")))
                    .thenThrow(new ApiException(ApiErrorCode.VALIDATION_FAILED, "Mã PIN xác nhận không khớp."));

            mockMvc.perform(post("/api/v1/employee/pin")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }

        @Test
        @DisplayName("Chưa đăng nhập -> trả về 403 Forbidden")
        void managePin_Unauthenticated_Returns403() throws Exception {
            Map<String, String> body = Map.of("pin", "123456", "confirmPin", "123456");

            mockMvc.perform(post("/api/v1/employee/pin")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
        }
    }
}
