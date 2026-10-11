package com.fas.api.controller;

import com.fas.api.dto.request.PinResetRequest;
import com.fas.api.dto.response.PinOperationResult;
import com.fas.api.dto.response.ResetCredentialsResponse;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.repository.UserRepository;
import com.fas.service.CredentialRecoveryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CredentialRecoveryControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private CredentialRecoveryService credentialRecoveryService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CredentialRecoveryController credentialRecoveryController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(credentialRecoveryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("Admin cấp lại mật khẩu tạm thành công -> trả về 200 OK kèm temporaryPassword")
    void resetCredentials_Success() throws Exception {
        ResetCredentialsResponse response = new ResetCredentialsResponse(
                1042L, "NV-1042", "dung.ngo@fas.com", "Temp@1234567"
        );
        when(credentialRecoveryService.resetPassword(1042L)).thenReturn(response);

        mockMvc.perform(post("/api/v1/admin/employees/1042/credentials/reset"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("CREDENTIALS_RESET"))
                .andExpect(jsonPath("$.data.temporaryPassword").value("Temp@1234567"));

        verify(credentialRecoveryService).resetPassword(1042L);
    }

    @Test
    @DisplayName("Nhân viên đặt lại PIN thành công -> trả về 200 OK")
    void resetPin_Success() throws Exception {
        PinResetRequest request = new PinResetRequest("Current@123", "654321", "654321");
        PinOperationResult result = new PinOperationResult(true, "Đặt lại mã PIN thành công");

        when(credentialRecoveryService.resetPin(eq(1042L), any(PinResetRequest.class))).thenReturn(result);

        mockMvc.perform(post("/api/v1/employee/pin/reset")
                        .header("X-User-Id", 1042L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("PIN_RESET"))
                .andExpect(jsonPath("$.data.hasPin").value(true));

        verify(credentialRecoveryService).resetPin(eq(1042L), any(PinResetRequest.class));
    }

    @Test
    @DisplayName("Đặt lại PIN với dữ liệu sai định dạng (PIN < 6 số) -> trả về 400 Bad Request")
    void resetPin_InvalidPin_Returns400() throws Exception {
        PinResetRequest request = new PinResetRequest("Current@123", "123", "123");

        mockMvc.perform(post("/api/v1/employee/pin/reset")
                        .header("X-User-Id", 1042L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        verifyNoInteractions(credentialRecoveryService);
    }
}
