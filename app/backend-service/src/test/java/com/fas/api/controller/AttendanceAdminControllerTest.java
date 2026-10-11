package com.fas.api.controller;

import com.fas.api.dto.PageResponse;
import com.fas.api.dto.request.AdjustAttendanceRequest;
import com.fas.api.dto.request.AttendanceSearchCriteria;
import com.fas.api.dto.request.EmployeeSearchCriteria;
import com.fas.api.dto.response.AttendanceLogItem;
import com.fas.api.dto.response.EmployeeItem;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.Role;
import com.fas.data.enums.VerificationMethod;
import com.fas.service.AccountManagementService;
import com.fas.service.AttendanceService;
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

import java.time.OffsetDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử REST Controller cho AttendanceAdminController
 * (API-BE-008, API-BE-011, APD-BE-002, FR-BE-008, TASK-BE-020, BLD-BE-007).
 */
@ExtendWith(MockitoExtension.class)
class AttendanceAdminControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private AttendanceService attendanceService;

    @Mock
    private AccountManagementService accountManagementService;

    @InjectMocks
    private AttendanceAdminController attendanceAdminController;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(attendanceAdminController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Nested
    @DisplayName("1. Tra cứu Lịch sử Điểm danh (GET /api/v1/admin/attendance)")
    class GetAttendanceLogsTests {

        @Test
        @DisplayName("Tra cứu danh sách điểm danh thành công trả về 200 OK và PageResponse")
        void getAttendanceLogs_Success_Returns200() throws Exception {
            AttendanceLogItem item = new AttendanceLogItem(
                    101L, 1042L, "NV-1042", "Ngô Văn Dũng", "Phòng Kỹ thuật",
                    OffsetDateTime.parse("2026-10-10T08:30:00+07:00"),
                    PunchType.CHECK_IN, VerificationMethod.VERIFICATION_FACE,
                    AttendanceStatus.ON_TIME, 0, "KIOSK-HN-01"
            );

            PageResponse<AttendanceLogItem> pageResponse = new PageResponse<>(
                    List.of(item), 0, 20, 1L, 1, true, true
            );

            when(attendanceService.queryAttendanceLogs(any(AttendanceSearchCriteria.class), any(Pageable.class)))
                    .thenReturn(pageResponse);

            mockMvc.perform(get("/api/v1/admin/attendance")
                            .param("page", "0")
                            .param("size", "20")
                            .param("department", "Phòng Kỹ thuật")
                            .param("status", "ON_TIME"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("ATTENDANCE_QUERY_SUCCESS"))
                    .andExpect(jsonPath("$.data.content", hasSize(1)))
                    .andExpect(jsonPath("$.data.content[0].employeeCode").value("NV-1042"))
                    .andExpect(jsonPath("$.data.totalElements").value(1));

            verify(attendanceService).queryAttendanceLogs(any(AttendanceSearchCriteria.class), any(Pageable.class));
        }
    }

    @Nested
    @DisplayName("2. Điều chỉnh giờ công thủ công (PATCH /api/v1/admin/attendance/{id})")
    class AdjustAttendanceTests {

        @Test
        @DisplayName("Điều chỉnh giờ công thành công trả về 200 OK")
        void adjustAttendance_Success_Returns200() throws Exception {
            AdjustAttendanceRequest request = new AdjustAttendanceRequest(
                    OffsetDateTime.parse("2026-10-10T08:00:00+07:00"),
                    AttendanceStatus.ON_TIME,
                    0,
                    "Điều chỉnh do lỗi cảm biến kiosk"
            );

            AttendanceLogItem item = new AttendanceLogItem(
                    101L, 1042L, "NV-1042", "Ngô Văn Dũng", "Phòng Kỹ thuật",
                    OffsetDateTime.parse("2026-10-10T08:00:00+07:00"),
                    PunchType.CHECK_IN, VerificationMethod.VERIFICATION_FACE,
                    AttendanceStatus.ON_TIME, 0, "KIOSK-HN-01"
            );

            when(attendanceService.adjustAttendanceLog(eq(101L), any(AdjustAttendanceRequest.class)))
                    .thenReturn(item);

            mockMvc.perform(patch("/api/v1/admin/attendance/101")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("ATTENDANCE_ADJUSTED"))
                    .andExpect(jsonPath("$.data.status").value("ON_TIME"))
                    .andExpect(jsonPath("$.data.lateMinutes").value(0));

            verify(attendanceService).adjustAttendanceLog(eq(101L), any(AdjustAttendanceRequest.class));
        }

        @Test
        @DisplayName("Không tìm thấy bản ghi điểm danh -> trả về 404 RESOURCE_NOT_FOUND")
        void adjustAttendance_NotFound_Returns404() throws Exception {
            AdjustAttendanceRequest request = new AdjustAttendanceRequest(
                    null, AttendanceStatus.ON_TIME, 0, "Lý do hợp lệ"
            );

            when(attendanceService.adjustAttendanceLog(eq(999L), any(AdjustAttendanceRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bản ghi điểm danh ID=999"));

            mockMvc.perform(patch("/api/v1/admin/attendance/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
        }

        @Test
        @DisplayName("Thiếu lý do điều chỉnh -> trả về 400 Bad Request VALIDATION_FAILED")
        void adjustAttendance_MissingReason_Returns400() throws Exception {
            AdjustAttendanceRequest request = new AdjustAttendanceRequest(
                    null, AttendanceStatus.ON_TIME, 0, null
            );

            mockMvc.perform(patch("/api/v1/admin/attendance/101")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }
    }

    @Nested
    @DisplayName("3. Quản lý Danh sách Nhân sự (GET /api/v1/admin/employees - API-BE-011)")
    class GetEmployeesTests {

        @Test
        @DisplayName("Tra cứu danh sách nhân sự thành công trả về 200 OK")
        void getEmployees_Success_Returns200() throws Exception {
            EmployeeItem employee = new EmployeeItem(
                    1042L, "NV-1042", "Ngô Văn Dũng", "dung.nv@company.com",
                    "Phòng Kỹ thuật", Role.EMPLOYEE, EmployeeStatus.ACTIVE,
                    true, true, OffsetDateTime.parse("2026-10-01T08:00:00+07:00")
            );

            PageResponse<EmployeeItem> pageResponse = new PageResponse<>(
                    List.of(employee), 0, 20, 1L, 1, true, true
            );

            when(accountManagementService.getEmployees(any(EmployeeSearchCriteria.class), any(Pageable.class)))
                    .thenReturn(pageResponse);

            mockMvc.perform(get("/api/v1/admin/employees")
                            .param("page", "0")
                            .param("size", "20")
                            .param("status", "ACTIVE")
                            .param("keyword", "Dũng"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("EMPLOYEES_FETCHED"))
                    .andExpect(jsonPath("$.data.content", hasSize(1)))
                    .andExpect(jsonPath("$.data.content[0].employeeCode").value("NV-1042"))
                    .andExpect(jsonPath("$.data.content[0].hasBiometric").value(true))
                    .andExpect(jsonPath("$.data.content[0].hasPin").value(true));

            verify(accountManagementService).getEmployees(any(EmployeeSearchCriteria.class), any(Pageable.class));
        }
    }
}
