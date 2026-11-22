package com.fas.api.controller;

import com.fas.api.dto.request.ConsentRequest;
import com.fas.api.dto.response.ConsentResult;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.entity.User;
import com.fas.data.repository.UserRepository;
import com.fas.service.EnrollmentService;
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
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử REST Controller cho ConsentController
 * (API-BE-010, APD-BE-002, FR-BE-005, TASK-BE-020, BLD-BE-007).
 */
@ExtendWith(MockitoExtension.class)
class ConsentControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private EnrollmentService enrollmentService;



    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ConsentController consentController;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(consentController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleUser = User.builder()
                .id(1042L)
                .employeeCode("NV-1042")
                .fullName("Ngô Văn Dũng")
                .email("dung.nv@company.com")
                .build();
    }

    @Nested
    @DisplayName("1. Ký cam kết Informed Consent (POST /api/v1/employee/consent - API-BE-010)")
    class SignConsentTests {

        @Test
        @DisplayName("Ký cam kết thành công trả về 200 OK kèm mã OTP")
        void signConsent_Success() throws Exception {
            ConsentRequest request = new ConsentRequest(true, "v1.0");

            Principal mockPrincipal = () -> "dung.nv@company.com";
            when(userRepository.findByEmail("dung.nv@company.com")).thenReturn(Optional.of(sampleUser));

            ConsentResult result = new ConsentResult(
                    "839201",
                    "otp:839201",
                    OffsetDateTime.parse("2026-10-12T08:00:00+07:00"),
                    OffsetDateTime.parse("2026-10-10T08:00:00+07:00"),
                    "Mã OTP có hiệu lực trong 48 giờ"
            );

            when(enrollmentService.createConsentSession(eq(1042L), any(ConsentRequest.class), any()))
                    .thenReturn(result);

            mockMvc.perform(post("/api/v1/employee/consent")
                            .principal(mockPrincipal)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("CONSENT_ACCEPTED"))
                    .andExpect(jsonPath("$.data.otp").value("839201"))
                    .andExpect(jsonPath("$.data.qrCodeDataUrl").value("otp:839201"));

            verify(enrollmentService).createConsentSession(eq(1042L), any(ConsentRequest.class), any());
        }

        @Test
        @DisplayName("Ký cam kết với agreed = false -> trả về 400 Bad Request VALIDATION_FAILED")
        void signConsent_AgreedFalse_Returns400() throws Exception {
            ConsentRequest request = new ConsentRequest(false, "v1.0");

            mockMvc.perform(post("/api/v1/employee/consent")
                            .header("X-User-Id", 1042L)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }

        @Test
        @DisplayName("Ký cam kết thiếu consentVersion -> trả về 400 Bad Request VALIDATION_FAILED")
        void signConsent_BlankVersion_Returns400() throws Exception {
            ConsentRequest request = new ConsentRequest(true, "   ");

            mockMvc.perform(post("/api/v1/employee/consent")
                            .header("X-User-Id", 1042L)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }

        @Test
        @DisplayName("Chưa đăng nhập -> trả về 403 Forbidden ACCESS_DENIED")
        void signConsent_Unauthenticated_Returns403() throws Exception {
            ConsentRequest request = new ConsentRequest(true, "v1.0");

            mockMvc.perform(post("/api/v1/employee/consent")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
        }
    }
}
