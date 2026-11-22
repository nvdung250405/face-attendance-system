package com.fas.api.controller;

import com.fas.api.dto.PageResponse;
import com.fas.api.dto.response.ConsentRecordItem;
import com.fas.api.dto.response.RetentionScheduleItem;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.service.AuditQueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử REST Controller cho DpoComplianceController
 * (APD-BE-017, API-BE-031, FR-BE-016, BLD-BE-029, TST-BE-031, TASK-BE-034).
 */
@ExtendWith(MockitoExtension.class)
class DpoComplianceControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuditQueryService auditQueryService;

    @InjectMocks
    private DpoComplianceController dpoComplianceController;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(dpoComplianceController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("Tra cứu danh sách Consent thành công trả về HTTP 200 OK")
    void getConsents_Success_Returns200() throws Exception {
        ConsentRecordItem item = new ConsentRecordItem(
                10L, 1042L, "NV-1042", "Ngô Văn Dũng", "dung.nv@company.com",
                "v1.0", Instant.parse("2026-10-01T08:00:00Z"), "192.168.1.50", true
        );
        PageResponse<ConsentRecordItem> pageResponse = new PageResponse<>(List.of(item), 0, 20, 1L, 1, true, true);

        when(auditQueryService.queryConsents(any(Pageable.class))).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/dpo/consents")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("CONSENTS_FETCHED"))
                .andExpect(jsonPath("$.data.content[0].employeeCode").value("NV-1042"))
                .andExpect(jsonPath("$.data.content[0].consentVersion").value("v1.0"));

        verify(auditQueryService).queryConsents(any(Pageable.class));
    }

    @Test
    @DisplayName("Tra cứu lịch trình tiêu hủy sinh trắc học thành công trả về HTTP 200 OK")
    void getRetentionSchedule_Success_Returns200() throws Exception {
        RetentionScheduleItem item = new RetentionScheduleItem(
                1042L, "NV-1042", "Ngô Văn Dũng", "dung.nv@company.com",
                "2026-10-01", "2026-10-21", false, null, "EMPLOYEE_TERMINATION"
        );
        PageResponse<RetentionScheduleItem> pageResponse = new PageResponse<>(List.of(item), 0, 20, 1L, 1, true, true);

        when(auditQueryService.queryRetentionSchedule(any(Pageable.class))).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/dpo/retention-schedule")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("RETENTION_SCHEDULE_FETCHED"))
                .andExpect(jsonPath("$.data.content[0].employeeCode").value("NV-1042"))
                .andExpect(jsonPath("$.data.content[0].retentionType").value("EMPLOYEE_TERMINATION"));

        verify(auditQueryService).queryRetentionSchedule(any(Pageable.class));
    }
}
