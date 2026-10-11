package com.fas.api.controller;

import com.fas.api.dto.request.CreateEmployeeRequest;
import com.fas.api.dto.request.UpdateEmployeeRequest;
import com.fas.api.dto.request.UpdateEmployeeStatusRequest;
import com.fas.api.dto.response.CreateEmployeeResponse;
import com.fas.api.dto.response.EmployeeItem;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.api.error.GlobalExceptionHandler;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.service.AccountManagementService;
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

import java.time.OffsetDateTime;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bộ kiểm thử REST Controller cho AdminEmployeeController
 * (API-BE-017, API-BE-018, API-BE-019, APD-BE-007..009, FR-BE-010, TST-BE-020, BLD-BE-021, TASK-BE-026).
 */
@ExtendWith(MockitoExtension.class)
class AdminEmployeeControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private AccountManagementService accountManagementService;

    @InjectMocks
    private AdminEmployeeController adminEmployeeController;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(adminEmployeeController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Nested
    @DisplayName("1. Khởi tạo hồ sơ nhân sự (POST /api/v1/admin/employees - API-BE-017)")
    class CreateEmployeeTests {

        @Test
        @DisplayName("Khởi tạo hồ sơ thành công trả về 201 Created kèm temporaryPassword hiển thị một lần")
        void createEmployee_Success_Returns201() throws Exception {
            CreateEmployeeRequest request = new CreateEmployeeRequest(
                    "NV-1042", "Ngô Văn Dũng", "dung.nv@company.com", "Phòng Kỹ thuật", Role.EMPLOYEE
            );

            CreateEmployeeResponse response = new CreateEmployeeResponse(
                    1042L, "NV-1042", "Ngô Văn Dũng", "dung.nv@company.com",
                    Role.EMPLOYEE, EmployeeStatus.PENDING_CONSENT, "Phòng Kỹ thuật",
                    "TempPass@123", OffsetDateTime.parse("2026-10-11T08:00:00+07:00")
            );

            when(accountManagementService.createEmployee(any(CreateEmployeeRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(post("/api/v1/admin/employees")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("EMPLOYEE_CREATED"))
                    .andExpect(jsonPath("$.data.employeeId").value(1042))
                    .andExpect(jsonPath("$.data.employeeCode").value("NV-1042"))
                    .andExpect(jsonPath("$.data.fullName").value("Ngô Văn Dũng"))
                    .andExpect(jsonPath("$.data.temporaryPassword").value("TempPass@123"))
                    .andExpect(jsonPath("$.data.status").value("PENDING_CONSENT"));

            verify(accountManagementService).createEmployee(any(CreateEmployeeRequest.class));
        }

        @Test
        @DisplayName("Trùng mã nhân viên hoặc email -> ném 409 Conflict EMPLOYEE_ALREADY_EXISTS")
        void createEmployee_Duplicate_Returns409() throws Exception {
            CreateEmployeeRequest request = new CreateEmployeeRequest(
                    "NV-1042", "Ngô Văn Dũng", "dung.nv@company.com", "Phòng Kỹ thuật", Role.EMPLOYEE
            );

            when(accountManagementService.createEmployee(any(CreateEmployeeRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.EMPLOYEE_ALREADY_EXISTS, "Mã nhân viên đã tồn tại: NV-1042"));

            mockMvc.perform(post("/api/v1/admin/employees")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("EMPLOYEE_ALREADY_EXISTS"))
                    .andExpect(jsonPath("$.detail").value(containsString("Mã nhân viên đã tồn tại")));
        }

        @Test
        @DisplayName("Dữ liệu đầu vào không hợp lệ (mã hoặc họ tên trống, sai định dạng email) -> trả về 400 Bad Request")
        void createEmployee_InvalidInput_Returns400() throws Exception {
            CreateEmployeeRequest request = new CreateEmployeeRequest(
                    "", "", "invalid-email-format", null, null
            );

            mockMvc.perform(post("/api/v1/admin/employees")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verify(accountManagementService, never()).createEmployee(any());
        }
    }

    @Nested
    @DisplayName("2. Cập nhật hồ sơ nhân sự (PATCH /api/v1/admin/employees/{id} - API-BE-018)")
    class UpdateEmployeeProfileTests {

        @Test
        @DisplayName("Cập nhật hồ sơ thành công trả về 200 OK và EmployeeItem")
        void updateEmployeeProfile_Success_Returns200() throws Exception {
            UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                    "Ngô Văn Dũng (Mới)", "dung.new@company.com", "Phòng R&D", Role.HR_MANAGER
            );

            EmployeeItem response = new EmployeeItem(
                    1042L, "NV-1042", "Ngô Văn Dũng (Mới)", "dung.new@company.com",
                    "Phòng R&D", Role.HR_MANAGER, EmployeeStatus.ACTIVE,
                    true, true, OffsetDateTime.parse("2026-10-11T08:00:00+07:00")
            );

            when(accountManagementService.updateEmployeeProfile(eq(1042L), any(UpdateEmployeeRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(patch("/api/v1/admin/employees/1042")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("EMPLOYEE_UPDATED"))
                    .andExpect(jsonPath("$.data.id").value(1042))
                    .andExpect(jsonPath("$.data.fullName").value("Ngô Văn Dũng (Mới)"))
                    .andExpect(jsonPath("$.data.department").value("Phòng R&D"))
                    .andExpect(jsonPath("$.data.role").value("HR_MANAGER"));

            verify(accountManagementService).updateEmployeeProfile(eq(1042L), any(UpdateEmployeeRequest.class));
        }

        @Test
        @DisplayName("Không tìm thấy nhân viên khi cập nhật -> trả về 404 Not Found EMPLOYEE_NOT_FOUND")
        void updateEmployeeProfile_NotFound_Returns404() throws Exception {
            UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                    "Ngô Văn Dũng", null, null, null
            );

            when(accountManagementService.updateEmployeeProfile(eq(9999L), any(UpdateEmployeeRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên ID=9999"));

            mockMvc.perform(patch("/api/v1/admin/employees/9999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("EMPLOYEE_NOT_FOUND"));
        }

        @Test
        @DisplayName("Email mới trùng lặp với tài khoản khác -> trả về 409 Conflict EMPLOYEE_ALREADY_EXISTS")
        void updateEmployeeProfile_DuplicateEmail_Returns409() throws Exception {
            UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                    null, "existing@company.com", null, null
            );

            when(accountManagementService.updateEmployeeProfile(eq(1042L), any(UpdateEmployeeRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.EMPLOYEE_ALREADY_EXISTS, "Email đã tồn tại: existing@company.com"));

            mockMvc.perform(patch("/api/v1/admin/employees/1042")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("EMPLOYEE_ALREADY_EXISTS"));
        }

        @Test
        @DisplayName("Email sai định dạng khi cập nhật -> trả về 400 Bad Request VALIDATION_FAILED")
        void updateEmployeeProfile_InvalidEmail_Returns400() throws Exception {
            UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                    null, "not-an-email", null, null
            );

            mockMvc.perform(patch("/api/v1/admin/employees/1042")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verify(accountManagementService, never()).updateEmployeeProfile(any(), any());
        }
    }

    @Nested
    @DisplayName("3. Vô hiệu hóa hoặc cập nhật trạng thái nhân sự (PATCH /api/v1/admin/employees/{id}/status - API-BE-019)")
    class UpdateEmployeeStatusTests {

        @Test
        @DisplayName("Vô hiệu hóa nhân sự (status = TERMINATED) thành công trả về 200 OK")
        void updateEmployeeStatus_Terminate_Returns200() throws Exception {
            UpdateEmployeeStatusRequest request = new UpdateEmployeeStatusRequest(
                    EmployeeStatus.TERMINATED, "Thôi việc theo nguyện vọng cá nhân"
            );

            EmployeeItem response = new EmployeeItem(
                    1042L, "NV-1042", "Ngô Văn Dũng", "dung.nv@company.com",
                    "Phòng Kỹ thuật", Role.EMPLOYEE, EmployeeStatus.TERMINATED,
                    false, false, OffsetDateTime.parse("2026-10-11T08:00:00+07:00")
            );

            when(accountManagementService.updateEmployeeStatus(eq(1042L), any(UpdateEmployeeStatusRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(patch("/api/v1/admin/employees/1042/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.code").value("EMPLOYEE_STATUS_UPDATED"))
                    .andExpect(jsonPath("$.data.id").value(1042))
                    .andExpect(jsonPath("$.data.status").value("TERMINATED"));

            verify(accountManagementService).updateEmployeeStatus(eq(1042L), any(UpdateEmployeeStatusRequest.class));
        }

        @Test
        @DisplayName("Không tìm thấy nhân viên khi cập nhật trạng thái -> trả về 404 Not Found")
        void updateEmployeeStatus_NotFound_Returns404() throws Exception {
            UpdateEmployeeStatusRequest request = new UpdateEmployeeStatusRequest(
                    EmployeeStatus.TERMINATED, "Lý do hợp lệ"
            );

            when(accountManagementService.updateEmployeeStatus(eq(9999L), any(UpdateEmployeeStatusRequest.class)))
                    .thenThrow(new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy nhân viên ID=9999"));

            mockMvc.perform(patch("/api/v1/admin/employees/9999/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("EMPLOYEE_NOT_FOUND"));
        }

        @Test
        @DisplayName("Trạng thái để trống khi gọi cập nhật -> trả về 400 Bad Request VALIDATION_FAILED")
        void updateEmployeeStatus_NullStatus_Returns400() throws Exception {
            UpdateEmployeeStatusRequest request = new UpdateEmployeeStatusRequest(
                    null, "Thiếu trạng thái"
            );

            mockMvc.perform(patch("/api/v1/admin/employees/1042/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

            verify(accountManagementService, never()).updateEmployeeStatus(any(), any());
        }
    }
}
