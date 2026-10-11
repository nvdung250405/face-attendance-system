package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.PageResponse;
import com.fas.api.dto.request.AdjustAttendanceRequest;
import com.fas.api.dto.request.AttendanceSearchCriteria;
import com.fas.api.dto.request.EmployeeSearchCriteria;
import com.fas.api.dto.response.AttendanceLogItem;
import com.fas.api.dto.response.EmployeeItem;
import com.fas.service.AccountManagementService;
import com.fas.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller Quản trị Điểm danh & Danh sách Nhân sự Web Portal
 * (APD-BE-002, API-BE-008, API-BE-011, FR-BE-008, BLD-BE-007, TASK-BE-020).
 *
 * <p>Yêu cầu vai trò: {@code HR_MANAGER} hoặc {@code ADMIN}.</p>
 */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class AttendanceAdminController {

    private final AttendanceService attendanceService;
    private final AccountManagementService accountManagementService;

    public AttendanceAdminController(
            AttendanceService attendanceService,
            AccountManagementService accountManagementService) {
        this.attendanceService = attendanceService;
        this.accountManagementService = accountManagementService;
    }

    /**
     * Tra cứu, lọc và phân trang lịch sử điểm danh toàn công ty (GET /api/v1/admin/attendance - API-BE-008).
     *
     * @param criteria tiêu chí lọc (thời gian, phòng ban, trạng thái, từ khóa)
     * @param pageable thông số phân trang và sắp xếp
     * @return danh sách lịch sử điểm danh phân trang kèm HTTP 200 OK
     */
    @GetMapping("/attendance")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PageResponse<AttendanceLogItem>> getAttendanceLogs(
            @Valid @ModelAttribute AttendanceSearchCriteria criteria,
            @PageableDefault(size = 20, sort = "punchTimestamp", direction = Sort.Direction.DESC) Pageable pageable) {

        PageResponse<AttendanceLogItem> response = attendanceService.queryAttendanceLogs(criteria, pageable);
        return ApiResponse.ok("ATTENDANCE_QUERY_SUCCESS", "Truy vấn danh sách điểm danh thành công", response);
    }

    /**
     * Điều chỉnh thủ công bản ghi điểm danh phục vụ HR/Admin sửa giờ công (PATCH /api/v1/admin/attendance/{id}).
     *
     * @param id      mã định danh bản ghi điểm danh
     * @param request dữ liệu thông số điều chỉnh
     * @return thông tin bản ghi sau khi điều chỉnh kèm HTTP 200 OK
     */
    @PatchMapping("/attendance/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<AttendanceLogItem> adjustAttendance(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdjustAttendanceRequest request) {

        AttendanceLogItem response = attendanceService.adjustAttendanceLog(id, request);
        return ApiResponse.ok("ATTENDANCE_ADJUSTED", "Điều chỉnh bản ghi điểm danh thành công", response);
    }

    /**
     * Quản lý danh sách nhân sự, phòng ban và trạng thái kích hoạt khuôn mặt (GET /api/v1/admin/employees - API-BE-011).
     *
     * @param criteria tiêu chí lọc (trạng thái, phòng ban, từ khóa)
     * @param pageable thông số phân trang và sắp xếp
     * @return danh sách hồ sơ nhân sự phân trang kèm HTTP 200 OK
     */
    @GetMapping("/employees")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PageResponse<EmployeeItem>> getEmployees(
            @Valid @ModelAttribute EmployeeSearchCriteria criteria,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {

        PageResponse<EmployeeItem> response = accountManagementService.getEmployees(criteria, pageable);
        return ApiResponse.ok("EMPLOYEES_FETCHED", "Lấy danh sách nhân sự thành công", response);
    }
}
