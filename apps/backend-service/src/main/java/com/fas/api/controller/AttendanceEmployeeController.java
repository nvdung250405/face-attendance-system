package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.PageResponse;
import com.fas.api.dto.response.AttendanceLogItem;
import com.fas.api.dto.response.PersonalAttendanceResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.repository.UserRepository;
import com.fas.service.EmployeeAttendanceQueryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;

/**
 * REST Controller Tra cứu Lịch sử Chấm công Tự phục vụ của Nhân viên
 * (APD-BE-002, API-BE-009, FR-BE-008, FR-BE-025, BLD-BE-007, TASK-BE-020).
 *
 * <p>Yêu cầu xác thực: Người dùng đã đăng nhập hệ thống (mọi vai trò hợp lệ).</p>
 */
@RestController
@RequestMapping("/api/v1/employee/attendance")
@PreAuthorize("isAuthenticated()")
public class AttendanceEmployeeController {

    private final EmployeeAttendanceQueryService employeeAttendanceQueryService;
    private final UserRepository userRepository;

    public AttendanceEmployeeController(
            EmployeeAttendanceQueryService employeeAttendanceQueryService,
            UserRepository userRepository) {
        this.employeeAttendanceQueryService = employeeAttendanceQueryService;
        this.userRepository = userRepository;
    }

    /**
     * Tra cứu lịch sử chấm công tổng hợp theo tháng của chính nhân viên (GET /api/v1/employee/attendance - API-BE-009).
     *
     * @param month        tháng cần tra cứu (1-12, mặc định là tháng hiện tại)
     * @param year         năm cần tra cứu (mặc định là năm hiện tại)
     * @param principal    thông tin người dùng hiện tại từ Security Context
     * @param headerUserId mã định danh nhân viên dự phòng từ header (phục vụ test)
     * @return bảng công cá nhân tổng hợp theo tháng kèm HTTP 200 OK
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PersonalAttendanceResponse> getMonthlyPersonalAttendance(
            @RequestParam(name = "month", required = false) Integer month,
            @RequestParam(name = "year", required = false) Integer year,
            Principal principal) {

        Long userId = resolveCallerUserId(principal);

        LocalDate now = LocalDate.now(ApiResponse.VIETNAM_ZONE);
        int targetMonth = (month != null) ? month : now.getMonthValue();
        int targetYear = (year != null) ? year : now.getYear();

        PersonalAttendanceResponse response = employeeAttendanceQueryService
                .getMonthlyPersonalAttendance(userId, targetYear, targetMonth);

        return ApiResponse.ok("PERSONAL_ATTENDANCE_FETCHED", "Tra cứu lịch sử điểm danh cá nhân thành công", response);
    }

    /**
     * Tra cứu danh sách các lượt chấm công chi tiết phân trang của chính nhân viên (GET /api/v1/employee/attendance/logs).
     *
     * @param year         năm cần lọc (tùy chọn)
     * @param month        tháng cần lọc (tùy chọn)
     * @param pageable     thông số phân trang và sắp xếp
     * @param principal    thông tin người dùng hiện tại
     * @param headerUserId mã định danh nhân viên dự phòng từ header
     * @return danh sách các lượt chấm công phân trang kèm HTTP 200 OK
     */
    @GetMapping("/logs")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PageResponse<AttendanceLogItem>> getPersonalAttendanceLogs(
            @RequestParam(name = "year", required = false) Integer year,
            @RequestParam(name = "month", required = false) Integer month,
            @PageableDefault(size = 20, sort = "punchTimestamp", direction = Sort.Direction.DESC) Pageable pageable,
            Principal principal) {

        Long userId = resolveCallerUserId(principal);

        Page<AttendanceLogItem> page = employeeAttendanceQueryService
                .getPersonalAttendanceLogs(userId, year, month, pageable);

        return ApiResponse.ok("PERSONAL_LOGS_FETCHED", "Tra cứu danh sách lượt chấm công thành công", PageResponse.from(page));
    }

    private Long resolveCallerUserId(Principal principal) {
        String principalName = null;
        if (principal != null && StringUtils.hasText(principal.getName())) {
            principalName = principal.getName();
        } else {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
                principalName = auth.getName();
            }
        }

        if (StringUtils.hasText(principalName)) {
            final String name = principalName;
            return userRepository.findByEmail(name)
                    .or(() -> userRepository.findByEmployeeCode(name))
                    .map(User::getId)
                    .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy thông tin tài khoản người dùng"));
        }

        throw new ApiException(ApiErrorCode.ACCESS_DENIED, "Người dùng chưa đăng nhập");
    }
}
