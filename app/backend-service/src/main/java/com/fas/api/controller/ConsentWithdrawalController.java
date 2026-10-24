package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.PageResponse;
import com.fas.api.dto.response.ConsentWithdrawalResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.repository.UserRepository;
import com.fas.service.ConsentWithdrawalService;
import jakarta.servlet.http.HttpServletRequest;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * REST Controller Rút Cam kết Informed Consent & Tiêu hủy Dữ liệu Sinh trắc
 * (APD-BE-023, API-BE-041, FR-BE-022, DATA-BE-023, BLD-BE-034, TASK-BE-039).
 */
@RestController
@RequestMapping("/api/v1")
public class ConsentWithdrawalController {

    private final ConsentWithdrawalService consentWithdrawalService;
    private final UserRepository userRepository;

    public ConsentWithdrawalController(
            ConsentWithdrawalService consentWithdrawalService,
            UserRepository userRepository) {
        this.consentWithdrawalService = consentWithdrawalService;
        this.userRepository = userRepository;
    }

    /**
     * Nhân viên rút lại thỏa thuận Informed Consent đã ký trước đó
     * (POST /api/v1/employee/consent/withdraw - API-BE-041).
     *
     * @param principal      thông tin người dùng đang thực hiện
     * @param request        HTTP request máy khách
     * @param explicitUserId mã định danh người dùng từ header (nếu có)
     * @return kết quả rút cam kết kèm hạn tiêu hủy dữ liệu sinh trắc học
     */
    @PostMapping("/employee/consent/withdraw")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ConsentWithdrawalResponse> withdrawConsent(
            Principal principal,
            HttpServletRequest request) {
        Long userId = resolveUserId(principal);
        String clientIp = resolveClientIp(request);
        ConsentWithdrawalResponse response = consentWithdrawalService.withdrawConsent(userId, clientIp);
        return ApiResponse.ok("CONSENT_WITHDRAWN", "Rút cam kết Informed Consent thành công", response);
    }

    /**
     * Tra cứu thông tin lượt rút cam kết gần nhất của nhân viên đang đăng nhập.
     *
     * @param principal      thông tin người dùng
     * @param explicitUserId mã định danh người dùng từ header (nếu có)
     * @return thông tin rút cam kết nếu có
     */
    @GetMapping("/employee/consent/withdrawal")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ConsentWithdrawalResponse> getLatestWithdrawal(
            Principal principal) {
        Long userId = resolveUserId(principal);
        ConsentWithdrawalResponse response = consentWithdrawalService.getLatestWithdrawal(userId)
                .orElse(null);
        return ApiResponse.ok("CONSENT_WITHDRAWAL_FETCHED", "Tra cứu thông tin rút cam kết thành công", response);
    }

    /**
     * Cán bộ DPO tra cứu toàn bộ danh sách các lượt rút cam kết phục vụ giám sát tuân thủ
     * (GET /api/v1/dpo/consent-withdrawals - API-BE-041).
     *
     * @param pageable thông số phân trang
     * @return danh sách các lượt rút cam kết
     */
    @GetMapping("/dpo/consent-withdrawals")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('DPO', 'ADMIN')")
    public ApiResponse<PageResponse<ConsentWithdrawalResponse>> getAllWithdrawals(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ConsentWithdrawalResponse> withdrawals = consentWithdrawalService.getAllWithdrawals(pageable);
        return ApiResponse.ok("CONSENT_WITHDRAWALS_FETCHED", "Tra cứu danh sách rút cam kết thành công", PageResponse.from(withdrawals));
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
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
