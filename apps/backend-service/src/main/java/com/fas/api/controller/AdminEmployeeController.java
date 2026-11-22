package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.CreateEmployeeRequest;
import com.fas.api.dto.request.UpdateEmployeeRequest;
import com.fas.api.dto.request.UpdateEmployeeStatusRequest;
import com.fas.api.dto.response.CreateEmployeeResponse;
import com.fas.api.dto.response.EmployeeItem;
import com.fas.service.AccountManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller Quản lý Hồ sơ & Vòng đời Nhân sự dành cho HR/Admin
 * (APD-BE-007, APD-BE-008, APD-BE-009, API-BE-017, API-BE-018, API-BE-019, FR-BE-010, BLD-BE-021, TASK-BE-026).
 *
 * <p>Yêu cầu vai trò: {@code HR_MANAGER} hoặc {@code ADMIN}.</p>
 */
@RestController
@RequestMapping("/api/v1/admin/employees")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class AdminEmployeeController {

    private final AccountManagementService accountManagementService;

    public AdminEmployeeController(AccountManagementService accountManagementService) {
        this.accountManagementService = accountManagementService;
    }

    /**
     * Khởi tạo hồ sơ nhân sự kèm tài khoản đăng nhập và mật khẩu tạm (POST /api/v1/admin/employees - API-BE-017).
     *
     * @param request dữ liệu khởi tạo hồ sơ nhân sự
     * @return kết quả khởi tạo kèm mật khẩu tạm (hiển thị duy nhất một lần) với mã HTTP 201 Created
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CreateEmployeeResponse> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        CreateEmployeeResponse response = accountManagementService.createEmployee(request);
        return ApiResponse.ok("EMPLOYEE_CREATED", "Khởi tạo hồ sơ nhân sự thành công", response);
    }

    /**
     * Cập nhật thông tin hồ sơ nhân sự (PATCH /api/v1/admin/employees/{id} - API-BE-018).
     *
     * @param id      mã định danh nhân viên cần cập nhật
     * @param request dữ liệu cập nhật hồ sơ (họ tên, email, phòng ban, vai trò)
     * @return hồ sơ nhân viên sau cập nhật kèm mã HTTP 200 OK
     */
    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<EmployeeItem> updateEmployeeProfile(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        EmployeeItem response = accountManagementService.updateEmployeeProfile(id, request);
        return ApiResponse.ok("EMPLOYEE_UPDATED", "Cập nhật hồ sơ nhân sự thành công", response);
    }

    /**
     * Vô hiệu hóa hoặc phục hồi trạng thái công tác của nhân sự (PATCH /api/v1/admin/employees/{id}/status - API-BE-019).
     *
     * @param id      mã định danh nhân viên
     * @param request dữ liệu trạng thái mới và lý do thay đổi
     * @return hồ sơ nhân viên sau khi cập nhật trạng thái kèm mã HTTP 200 OK
     */
    @PatchMapping("/{id}/status")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<EmployeeItem> updateEmployeeStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateEmployeeStatusRequest request) {
        EmployeeItem response = accountManagementService.updateEmployeeStatus(id, request);
        return ApiResponse.ok("EMPLOYEE_STATUS_UPDATED", "Cập nhật trạng thái nhân sự thành công", response);
    }
}
