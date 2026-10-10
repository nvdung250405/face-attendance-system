package com.fas.api.controller;

import com.fas.api.dto.request.AssignShiftRequest;
import com.fas.api.dto.response.EmployeeShiftResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.service.ShiftManagementService;
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

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Bộ kiểm thử REST Controller cho EmployeeShiftController
 * (TASK-BE-032, BLD-BE-027, APD-BE-014, API-BE-024, API-BE-025).
 */
@ExtendWith(MockitoExtension.class)
class EmployeeShiftControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private ShiftManagementService shiftManagementService;

    @InjectMocks
    private EmployeeShiftController employeeShiftController;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(employeeShiftController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Nested
    @DisplayName("1. Phân công ca làm việc (POST /api/v1/admin/employee-shifts)")
    class AssignShiftTests {

        @Test
        @DisplayName("Phân ca thành công trả về 201 Created và ApiResponse hợp lệ")
        void assignShift_Success_Returns201() throws Exception {
            AssignShiftRequest request = new AssignShiftRequest(
                    1042L,
                    1L,
                    LocalDate.of(2026, 11, 1),
                    LocalDate.of(2026, 11, 30)
            );

            EmployeeShiftResponse response = new EmployeeShiftResponse(
                    501L,
                    1042L,
                    "NV-1042",
                    "Ngô Văn Dũng",
                    1L,
                    "CA-SANG",
                    "Ca sáng tiêu chuẩn",
                    LocalDate.of(2026, 11, 1),
                    LocalDate.of(2026, 11, 30)
            );

            when(shiftManagementService.assignShift(any(AssignShiftRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/v1/admin/employee-shifts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("EMPLOYEE_SHIFT_ASSIGNED"))
                    .andExpect(jsonPath("$.data.id").value(501L))
                    .andExpect(jsonPath("$.data.userId").value(1042L))
                    .andExpect(jsonPath("$.data.employeeCode").value("NV-1042"))
                    .andExpect(jsonPath("$.data.shiftCode").value("CA-SANG"));

            verify(shiftManagementService).assignShift(any(AssignShiftRequest.class));
        }

        @Test
        @DisplayName("Validation thất bại khi thiếu userId hoặc shiftId -> trả về 400 Bad Request")
        void assignShift_ValidationFailed_Returns400() throws Exception {
            String invalidJson = """
                    {
                        "userId": null,
                        "shiftId": null,
                        "effectiveFrom": "2026-11-01"
                    }
                    """;

            mockMvc.perform(post("/api/v1/admin/employee-shifts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.invalidParams", hasSize(greaterThan(0))));

            verify(shiftManagementService, never()).assignShift(any());
        }

        @Test
        @DisplayName("Phân ca thất bại khi nhân viên không tồn tại -> trả về 404 Not Found")
        void assignShift_EmployeeNotFound_Returns404() throws Exception {
            AssignShiftRequest request = new AssignShiftRequest(
                    999L,
                    1L,
                    LocalDate.of(2026, 11, 1),
                    null
            );

            when(shiftManagementService.assignShift(any(AssignShiftRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân sự"));

            mockMvc.perform(post("/api/v1/admin/employee-shifts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("EMPLOYEE_NOT_FOUND"));
        }

        @Test
        @DisplayName("Phân ca thất bại khi chồng lấn khoảng hiệu lực -> trả về 409 Conflict SHIFT_OVERLAPPING")
        void assignShift_Overlapping_Returns409() throws Exception {
            AssignShiftRequest request = new AssignShiftRequest(
                    1042L,
                    1L,
                    LocalDate.of(2026, 11, 1),
                    LocalDate.of(2026, 11, 30)
            );

            when(shiftManagementService.assignShift(any(AssignShiftRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.SHIFT_OVERLAPPING, "Khoảng thời gian hiệu lực bị chồng lấn"));

            mockMvc.perform(post("/api/v1/admin/employee-shifts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("SHIFT_OVERLAPPING"));
        }

        @Test
        @DisplayName("Phân ca thất bại khi nhân viên bị vô hiệu hóa/đình chỉ -> trả về 403 Forbidden ACCESS_DENIED")
        void assignShift_TerminatedUser_Returns403() throws Exception {
            AssignShiftRequest request = new AssignShiftRequest(
                    1042L,
                    1L,
                    LocalDate.of(2026, 11, 1),
                    null
            );

            when(shiftManagementService.assignShift(any(AssignShiftRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.ACCESS_DENIED, "Không thể phân ca cho nhân sự không hoạt động"));

            mockMvc.perform(post("/api/v1/admin/employee-shifts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
        }
    }

    @Nested
    @DisplayName("2. Gỡ phân công ca làm việc (DELETE /api/v1/admin/employee-shifts/{id})")
    class UnassignShiftTests {

        @Test
        @DisplayName("Gỡ phân ca thành công trả về 204 No Content")
        void unassignShift_Success_Returns204() throws Exception {
            doNothing().when(shiftManagementService).unassignShift(501L);

            mockMvc.perform(delete("/api/v1/admin/employee-shifts/501"))
                    .andExpect(status().isNoContent())
                    .andExpect(content().string(""));

            verify(shiftManagementService).unassignShift(501L);
        }

        @Test
        @DisplayName("Gỡ phân ca thất bại khi không tìm thấy bản ghi -> trả về 404 Not Found")
        void unassignShift_NotFound_Returns404() throws Exception {
            doThrow(new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bản ghi phân ca"))
                    .when(shiftManagementService).unassignShift(999L);

            mockMvc.perform(delete("/api/v1/admin/employee-shifts/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("3. Tra cứu lịch phân ca (GET /api/v1/admin/employee-shifts)")
    class GetEmployeeShiftsTests {

        @Test
        @DisplayName("Tra cứu lịch phân ca theo nhân viên và khoảng ngày thành công trả về 200 OK")
        void getEmployeeShifts_Success_Returns200() throws Exception {
            EmployeeShiftResponse item1 = new EmployeeShiftResponse(
                    501L,
                    1042L,
                    "NV-1042",
                    "Ngô Văn Dũng",
                    1L,
                    "CA-SANG",
                    "Ca sáng tiêu chuẩn",
                    LocalDate.of(2026, 11, 1),
                    LocalDate.of(2026, 11, 15)
            );

            EmployeeShiftResponse item2 = new EmployeeShiftResponse(
                    502L,
                    1042L,
                    "NV-1042",
                    "Ngô Văn Dũng",
                    2L,
                    "CA-CHIEU",
                    "Ca chiều",
                    LocalDate.of(2026, 11, 16),
                    LocalDate.of(2026, 11, 30)
            );

            when(shiftManagementService.getEmployeeShifts(
                    eq(1042L),
                    isNull(),
                    eq(LocalDate.of(2026, 11, 1)),
                    eq(LocalDate.of(2026, 11, 30))
            )).thenReturn(List.of(item1, item2));

            mockMvc.perform(get("/api/v1/admin/employee-shifts")
                            .param("userId", "1042")
                            .param("fromDate", "2026-11-01")
                            .param("toDate", "2026-11-30"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("EMPLOYEE_SHIFTS_FETCHED"))
                    .andExpect(jsonPath("$.data", hasSize(2)))
                    .andExpect(jsonPath("$.data[0].employeeCode").value("NV-1042"))
                    .andExpect(jsonPath("$.data[1].shiftCode").value("CA-CHIEU"));
        }
    }
}
