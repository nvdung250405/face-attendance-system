package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.AssignShiftRequest;
import com.fas.api.dto.request.BatchAssignShiftRequest;
import com.fas.api.dto.response.BatchAssignShiftResponse;
import com.fas.api.dto.response.EmployeeShiftResponse;
import com.fas.service.ShiftManagementService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller Phân công & Quản lý Ca làm việc của Nhân sự
 * (APD-BE-014, API-BE-024, API-BE-025, FR-BE-013, BLD-BE-027, TASK-BE-032).
 *
 * <p>Yêu cầu quyền: {@code HR_MANAGER} hoặc {@code ADMIN}.
 */
@RestController
@RequestMapping("/api/v1/admin/employee-shifts")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class EmployeeShiftController {

    private final ShiftManagementService shiftManagementService;

    public EmployeeShiftController(ShiftManagementService shiftManagementService) {
        this.shiftManagementService = shiftManagementService;
    }

    /**
     * Phân công ca làm việc cho nhân viên theo khoảng hiệu lực (POST /api/v1/admin/employee-shifts - API-BE-024).
     *
     * @param request dữ liệu phân công ca
     * @return kết quả phân công kèm mã 201 Created
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EmployeeShiftResponse> assignShift(@Valid @RequestBody AssignShiftRequest request) {
        EmployeeShiftResponse response = shiftManagementService.assignShift(request);
        return ApiResponse.ok("EMPLOYEE_SHIFT_ASSIGNED", "Phân công ca làm việc cho nhân viên thành công", response);
    }

    /**
     * Phân công ca làm việc hàng loạt cho danh sách nhân viên (POST /api/v1/admin/employee-shifts/batch - API-BE-037).
     *
     * @param request dữ liệu phân công ca hàng loạt
     * @return báo cáo tổng hợp kết quả phân công ca kèm HTTP 200 OK
     */
    @PostMapping("/batch")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<BatchAssignShiftResponse> assignShiftBatch(@Valid @RequestBody BatchAssignShiftRequest request) {
        BatchAssignShiftResponse response = shiftManagementService.assignShiftBatch(request);
        return ApiResponse.ok("BATCH_SHIFTS_ASSIGNED", "Phân công ca làm việc hàng loạt hoàn tất", response);
    }

    /**
     * Gỡ bỏ phân công ca làm việc của nhân sự (DELETE /api/v1/admin/employee-shifts/{id} - API-BE-024).
     *
     * <p>Không làm mất lịch sử điểm danh đã ghi nhận.
     *
     * @param id mã định danh bản ghi phân ca
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unassignShift(@PathVariable("id") Long id) {
        shiftManagementService.unassignShift(id);
    }

    /**
     * Tra cứu lịch phân ca theo nhân viên và khoảng ngày (GET /api/v1/admin/employee-shifts - API-BE-025).
     *
     * @param userId   định danh nhân viên (tùy chọn)
     * @param shiftId  định danh ca làm việc (tùy chọn)
     * @param fromDate ngày bắt đầu khoảng tra cứu (tùy chọn)
     * @param toDate   ngày kết thúc khoảng tra cứu (tùy chọn)
     * @return danh sách các phân ca thỏa mãn điều kiện lọc kèm mã 200 OK
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<EmployeeShiftResponse>> getEmployeeShifts(
            @RequestParam(name = "userId", required = false) Long userId,
            @RequestParam(name = "shiftId", required = false) Long shiftId,
            @RequestParam(name = "fromDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "toDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<EmployeeShiftResponse> response = shiftManagementService.getEmployeeShifts(userId, shiftId, fromDate, toDate);
        return ApiResponse.ok("EMPLOYEE_SHIFTS_FETCHED", "Lấy danh sách phân ca thành công", response);
    }
}
