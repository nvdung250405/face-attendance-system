package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.PageResponse;
import com.fas.api.dto.request.UnlockPeriodRequest;
import com.fas.api.dto.response.PayrollPeriodResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.repository.UserRepository;
import com.fas.service.PayrollPeriodService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * REST Controller Quản lý Kỳ công & Chốt Sổ Điểm danh
 * (APD-BE-022, API-BE-039, API-BE-040, FR-BE-021, DATA-BE-021, BLD-BE-034, TASK-BE-039).
 */
@RestController
@RequestMapping("/api/v1/admin/payroll-periods")
public class PayrollPeriodController {

    private final PayrollPeriodService payrollPeriodService;
    private final UserRepository userRepository;

    public PayrollPeriodController(
            PayrollPeriodService payrollPeriodService,
            UserRepository userRepository) {
        this.payrollPeriodService = payrollPeriodService;
        this.userRepository = userRepository;
    }

    /**
     * Tra cứu danh sách các kỳ công và trạng thái chốt (GET /api/v1/admin/payroll-periods - API-BE-040).
     *
     * @param year     năm cần tra cứu (tùy chọn)
     * @param pageable thông số phân trang
     * @return danh sách kỳ công phân trang
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    public ApiResponse<PageResponse<PayrollPeriodResponse>> getPayrollPeriods(
            @RequestParam(name = "year", required = false) Integer year,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PayrollPeriodResponse> periods = payrollPeriodService.getPayrollPeriods(year, pageable);
        return ApiResponse.ok("PAYROLL_PERIODS_FETCHED", "Tra cứu danh sách kỳ công thành công", PageResponse.from(periods));
    }

    /**
     * Tra cứu chi tiết một kỳ công theo mã kỳ YYYY-MM
     * (GET /api/v1/admin/payroll-periods/{period} - API-BE-040).
     *
     * @param periodStr mã kỳ định dạng YYYY-MM
     * @return chi tiết kỳ công
     */
    @GetMapping("/{period}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    public ApiResponse<PayrollPeriodResponse> getPayrollPeriod(@PathVariable("period") String periodStr) {
        int[] ym = parsePeriod(periodStr);
        PayrollPeriodResponse period = payrollPeriodService.getPayrollPeriod(ym[0], ym[1]);
        return ApiResponse.ok("PAYROLL_PERIOD_FETCHED", "Tra cứu chi tiết kỳ công thành công", period);
    }

    /**
     * Chốt kỳ công ngăn chặn mọi điều chỉnh dữ liệu công sau thời hạn
     * (POST /api/v1/admin/payroll-periods/{period}/lock - API-BE-039).
     *
     * @param periodStr      mã kỳ định dạng YYYY-MM
     * @param principal      thông tin người dùng đang thực hiện
     * @param explicitUserId mã định danh người dùng từ header (nếu có)
     * @return trạng thái kỳ công sau khi chốt
     */
    @PostMapping("/{period}/lock")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'ADMIN')")
    public ApiResponse<PayrollPeriodResponse> lockPeriod(
            @PathVariable("period") String periodStr,
            Principal principal) {
        int[] ym = parsePeriod(periodStr);
        Long userId = resolveUserId(principal);
        PayrollPeriodResponse period = payrollPeriodService.lockPeriod(ym[0], ym[1], userId);
        return ApiResponse.ok("PAYROLL_PERIOD_LOCKED", "Chốt kỳ công thành công", period);
    }

    /**
     * Mở lại kỳ công đã chốt để điều chỉnh đặc biệt (chỉ ADMIN)
     * (POST /api/v1/admin/payroll-periods/{period}/unlock - API-BE-039).
     *
     * @param periodStr      mã kỳ định dạng YYYY-MM
     * @param request        nội dung yêu cầu chứa lý do mở lại
     * @param principal      thông tin quản trị viên thực hiện
     * @param explicitUserId mã định danh người dùng từ header (nếu có)
     * @return trạng thái kỳ công sau khi mở lại
     */
    @PostMapping("/{period}/unlock")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PayrollPeriodResponse> unlockPeriod(
            @PathVariable("period") String periodStr,
            @Valid @RequestBody UnlockPeriodRequest request,
            Principal principal) {
        int[] ym = parsePeriod(periodStr);
        Long userId = resolveUserId(principal);
        String reason = request != null ? request.reason() : null;
        PayrollPeriodResponse period = payrollPeriodService.unlockPeriod(ym[0], ym[1], userId, reason);
        return ApiResponse.ok("PAYROLL_PERIOD_UNLOCKED", "Mở lại kỳ công thành công", period);
    }

    private int[] parsePeriod(String periodStr) {
        if (!StringUtils.hasText(periodStr)) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Kỳ công không được để trống");
        }
        String[] parts = periodStr.trim().split("-");
        if (parts.length != 2) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Định dạng kỳ công không hợp lệ (yêu cầu YYYY-MM): " + periodStr);
        }
        try {
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);
            return new int[]{year, month};
        } catch (NumberFormatException ex) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Định dạng kỳ công không hợp lệ: " + periodStr);
        }
    }

    private Long resolveUserId(Principal principal) {
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
