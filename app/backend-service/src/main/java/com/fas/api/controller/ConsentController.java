package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.ConsentRequest;
import com.fas.api.dto.response.ConsentResult;
import com.fas.api.dto.response.ConsentWithdrawalResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.repository.UserRepository;
import com.fas.service.ConsentWithdrawalService;
import com.fas.service.EnrollmentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * REST Controller Quản lý Thỏa thuận Informed Consent của Nhân viên
 * (APD-BE-002, API-BE-010, API-BE-041, FR-BE-005, FR-BE-022, BLD-BE-007, TASK-BE-020).
 *
 * <p>Yêu cầu xác thực: Người dùng đã đăng nhập hệ thống (mọi vai trò hợp lệ).</p>
 */
@RestController
@RequestMapping("/api/v1/employee/consent")
@PreAuthorize("isAuthenticated()")
public class ConsentController {

    private final EnrollmentService enrollmentService;
    private final ConsentWithdrawalService consentWithdrawalService;
    private final UserRepository userRepository;

    public ConsentController(
            EnrollmentService enrollmentService,
            ConsentWithdrawalService consentWithdrawalService,
            UserRepository userRepository) {
        this.enrollmentService = enrollmentService;
        this.consentWithdrawalService = consentWithdrawalService;
        this.userRepository = userRepository;
    }

    /**
     * Ghi nhận chữ ký điện tử Informed Consent và tự động sinh mã OTP 48h (POST /api/v1/employee/consent - API-BE-010).
     *
     * @param request        dữ liệu thỏa thuận gồm cờ đồng thuận và phiên bản chính sách
     * @param servletRequest đối tượng request để trích xuất IP client
     * @param principal      thông tin người dùng hiện tại
     * @param headerUserId   mã định danh nhân viên dự phòng từ header
     * @return kết quả ký cam kết gồm mã OTP, ảnh QR và mốc hết hạn kèm HTTP 200 OK
     */
    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<ConsentResult> signConsent(
            @Valid @RequestBody ConsentRequest request,
            HttpServletRequest servletRequest,
            Principal principal,
            @RequestHeader(name = "X-User-Id", required = false) Long headerUserId) {

        Long userId = resolveCallerUserId(principal, headerUserId);
        String clientIp = resolveClientIp(servletRequest);

        ConsentResult result = enrollmentService.createConsentSession(userId, request, clientIp);
        return ApiResponse.ok("CONSENT_ACCEPTED", "Tiếp nhận cam kết thành công. Vui lòng đến trạm Kiosk để quét mặt.", result);
    }

    /**
     * Rút lại thỏa thuận Informed Consent (POST /api/v1/employee/consent/withdraw - API-BE-041).
     *
     * @param servletRequest đối tượng request để trích xuất IP client
     * @param principal      thông tin người dùng hiện tại
     * @param headerUserId   mã định danh nhân viên dự phòng từ header
     * @return kết quả rút cam kết gồm mốc thời gian và hạn tiêu hủy dữ liệu sinh trắc kèm HTTP 200 OK
     */
    @PostMapping("/withdraw")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<ConsentWithdrawalResponse> withdrawConsent(
            HttpServletRequest servletRequest,
            Principal principal,
            @RequestHeader(name = "X-User-Id", required = false) Long headerUserId) {

        Long userId = resolveCallerUserId(principal, headerUserId);
        String clientIp = resolveClientIp(servletRequest);

        ConsentWithdrawalResponse result = consentWithdrawalService.withdrawConsent(userId, clientIp);
        return ApiResponse.ok("CONSENT_WITHDRAWN", "Rút cam kết Informed Consent thành công", result);
    }

    private Long resolveCallerUserId(Principal principal, Long headerUserId) {
        if (headerUserId != null) {
            return headerUserId;
        }

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
                    .map(u -> u.getId())
                    .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND, "Không tìm thấy thông tin tài khoản người dùng"));
        }

        throw new ApiException(ApiErrorCode.ACCESS_DENIED, "Người dùng chưa đăng nhập");
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            return forwarded.split(",")[0].trim();
        }
        String remoteAddr = request.getRemoteAddr();
        return StringUtils.hasText(remoteAddr) ? remoteAddr : "127.0.0.1";
    }
}
