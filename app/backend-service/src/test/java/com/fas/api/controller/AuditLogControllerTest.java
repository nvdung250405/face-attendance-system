package com.fas.api.controller;

import com.fas.api.dto.PageResponse;
import com.fas.api.dto.request.AuditLogFilterCriteria;
import com.fas.api.dto.response.AuditLogItemResponse;
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
 * Bộ kiểm thử REST Controller cho AuditLogController
 * (APD-BE-017, API-BE-030, FR-BE-016, BLD-BE-029, TST-BE-031, TASK-BE-034).
 */
@ExtendWith(MockitoExtension.class)
class AuditLogControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuditQueryService auditQueryService;

    @InjectMocks
    private AuditLogController auditLogController;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(auditLogController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("Tra cứu nhật ký kiểm toán thành công trả về HTTP 200 OK và danh sách phân trang")
    void getAuditLogs_Success_Returns200() throws Exception {
        AuditLogItemResponse item = new AuditLogItemResponse(
                1L, 100L, "admin@fas.com",
                "UPDATE_EMPLOYEE", "USER", "1042",
                "{\"role\":\"EMPLOYEE\"}", "{\"role\":\"HR_MANAGER\"}",
                "127.0.0.1", Instant.parse("2026-10-10T10:00:00Z")
        );
        PageResponse<AuditLogItemResponse> pageResponse = new PageResponse<>(List.of(item), 0, 20, 1L, 1, true, true);

        when(auditQueryService.queryAuditLogs(any(AuditLogFilterCriteria.class), any(Pageable.class)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .param("action", "UPDATE_EMPLOYEE")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("AUDIT_LOGS_FETCHED"))
                .andExpect(jsonPath("$.data.content[0].id").value(1))
                .andExpect(jsonPath("$.data.content[0].action").value("UPDATE_EMPLOYEE"))
                .andExpect(jsonPath("$.data.content[0].actorEmail").value("admin@fas.com"))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(auditQueryService).queryAuditLogs(any(AuditLogFilterCriteria.class), any(Pageable.class));
    }
}
