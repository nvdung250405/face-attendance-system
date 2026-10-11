package com.fas.api.controller;

import com.fas.api.dto.request.UnlockPeriodRequest;
import com.fas.api.dto.response.PayrollPeriodResponse;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.enums.PayrollPeriodStatus;
import com.fas.data.repository.UserRepository;
import com.fas.service.PayrollPeriodService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PayrollPeriodControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private PayrollPeriodService payrollPeriodService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PayrollPeriodController payrollPeriodController;

    private PayrollPeriodResponse sampleResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(payrollPeriodController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleResponse = new PayrollPeriodResponse(
                1L, 2026, 10, PayrollPeriodStatus.LOCKED,
                100L, "Admin User", Instant.now(),
                null, null, null, null,
                Instant.now(), Instant.now()
        );
    }

    @Test
    @DisplayName("Lấy danh sách kỳ công -> trả về 200 OK phân trang")
    void getPayrollPeriods_Success() throws Exception {
        when(payrollPeriodService.getPayrollPeriods(eq(2026), any()))
                .thenReturn(new PageImpl<>(List.of(sampleResponse), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/admin/payroll-periods?year=2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("PAYROLL_PERIODS_FETCHED"))
                .andExpect(jsonPath("$.data.content[0].periodYear").value(2026));

        verify(payrollPeriodService).getPayrollPeriods(eq(2026), any());
    }

    @Test
    @DisplayName("Lấy chi tiết một kỳ công -> trả về 200 OK")
    void getPayrollPeriod_Success() throws Exception {
        when(payrollPeriodService.getPayrollPeriod(2026, 10)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/admin/payroll-periods/2026-10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("PAYROLL_PERIOD_FETCHED"))
                .andExpect(jsonPath("$.data.periodMonth").value(10));

        verify(payrollPeriodService).getPayrollPeriod(2026, 10);
    }

    @Test
    @DisplayName("Chốt kỳ công -> trả về 200 OK")
    void lockPeriod_Success() throws Exception {
        when(payrollPeriodService.lockPeriod(2026, 10, 100L)).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/admin/payroll-periods/2026-10/lock")
                        .header("X-User-Id", 100L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("PAYROLL_PERIOD_LOCKED"));

        verify(payrollPeriodService).lockPeriod(2026, 10, 100L);
    }

    @Test
    @DisplayName("Mở lại kỳ công -> trả về 200 OK")
    void unlockPeriod_Success() throws Exception {
        UnlockPeriodRequest request = new UnlockPeriodRequest("Điều chỉnh lỗi kỹ thuật");
        PayrollPeriodResponse openResponse = new PayrollPeriodResponse(
                1L, 2026, 10, PayrollPeriodStatus.OPEN,
                null, null, null,
                100L, "Admin User", Instant.now(), "Điều chỉnh lỗi kỹ thuật",
                Instant.now(), Instant.now()
        );
        when(payrollPeriodService.unlockPeriod(2026, 10, 100L, "Điều chỉnh lỗi kỹ thuật"))
                .thenReturn(openResponse);

        mockMvc.perform(post("/api/v1/admin/payroll-periods/2026-10/unlock")
                        .header("X-User-Id", 100L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("PAYROLL_PERIOD_UNLOCKED"))
                .andExpect(jsonPath("$.data.status").value("OPEN"));

        verify(payrollPeriodService).unlockPeriod(2026, 10, 100L, "Điều chỉnh lỗi kỹ thuật");
    }

    @Test
    @DisplayName("Kỳ công sai định dạng -> trả về 400 Bad Request")
    void lockPeriod_InvalidFormat_Returns400() throws Exception {
        mockMvc.perform(post("/api/v1/admin/payroll-periods/invalid-format/lock")
                        .header("X-User-Id", 100L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        verifyNoInteractions(payrollPeriodService);
    }
}
