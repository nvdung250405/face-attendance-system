package com.fas.api.controller;

import com.fas.api.dto.response.ConsentWithdrawalResponse;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.entity.User;
import com.fas.data.repository.UserRepository;
import com.fas.service.ConsentWithdrawalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ConsentWithdrawalControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ConsentWithdrawalService consentWithdrawalService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ConsentWithdrawalController consentWithdrawalController;

    private ConsentWithdrawalResponse sampleResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(consentWithdrawalController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleResponse = new ConsentWithdrawalResponse(
                1L, 1042L, "NV-1042",
                Instant.now(), "192.168.1.1", Instant.now().plusSeconds(7 * 86400),
                null, Instant.now()
        );
    }

    private static User employeeUser() {
        return User.builder().id(1042L).email("dung@company.com").employeeCode("NV-1042").build();
    }

    @Test
    @DisplayName("Nhân viên rút cam kết Informed Consent -> trả về 200 OK")
    void withdrawConsent_Success() throws Exception {
        when(consentWithdrawalService.withdrawConsent(eq(1042L), any())).thenReturn(sampleResponse);

        when(userRepository.findByEmail("dung@company.com"))
                .thenReturn(Optional.of(employeeUser()));

        mockMvc.perform(post("/api/v1/employee/consent/withdraw")
                        .principal(() -> "dung@company.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("CONSENT_WITHDRAWN"))
                .andExpect(jsonPath("$.data.employeeCode").value("NV-1042"));

        verify(consentWithdrawalService).withdrawConsent(eq(1042L), any());
    }

    @Test
    @DisplayName("Nhân viên tra cứu thông tin rút cam kết gần nhất -> trả về 200 OK")
    void getLatestWithdrawal_Success() throws Exception {
        when(consentWithdrawalService.getLatestWithdrawal(1042L)).thenReturn(Optional.of(sampleResponse));

        when(userRepository.findByEmail("dung@company.com"))
                .thenReturn(Optional.of(employeeUser()));

        mockMvc.perform(get("/api/v1/employee/consent/withdrawal")
                        .principal(() -> "dung@company.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("CONSENT_WITHDRAWAL_FETCHED"))
                .andExpect(jsonPath("$.data.userId").value(1042));

        verify(consentWithdrawalService).getLatestWithdrawal(1042L);
    }

    @Test
    @DisplayName("DPO tra cứu danh sách rút cam kết -> trả về 200 OK phân trang")
    void getAllWithdrawals_Success() throws Exception {
        when(consentWithdrawalService.getAllWithdrawals(any()))
                .thenReturn(new PageImpl<>(List.of(sampleResponse), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/dpo/consent-withdrawals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("CONSENT_WITHDRAWALS_FETCHED"))
                .andExpect(jsonPath("$.data.content[0].employeeCode").value("NV-1042"));

        verify(consentWithdrawalService).getAllWithdrawals(any());
    }
}
