package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.response.PinOperationResult;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.User;
import com.fas.data.repository.UserRepository;
import com.fas.service.PinService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

/**
 * REST Controller Quản lý Mã PIN Dự phòng Nhân sự
 * (APD-BE-011, API-BE-021, FR-BE-012, BLD-BE-022, TASK-BE-027).
 */
@RestController
@RequestMapping("/api/v1/employee")
public class EmployeePinController {

    private final PinService pinService;
    private final UserRepository userRepository;

    public EmployeePinController(PinService pinService, UserRepository userRepository) {
        this.pinService = pinService;
        this.userRepository = userRepository;
    }

    /**
     * Tra cứu trạng thái mã PIN dự phòng của nhân viên đang đăng nhập.
     *
     * @param principal thông tin người dùng đang đăng nhập
     * @return trạng thái hasPin của tài khoản
     */
    @GetMapping("/pin")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PinOperationResult> getPinStatus(Principal principal) {
        Long userId = resolveCurrentUserId(principal);
        boolean hasPin = pinService.hasPin(userId);
        String message = hasPin ? "Tài khoản đã thiết lập mã PIN dự phòng" : "Tài khoản chưa thiết lập mã PIN dự phòng";
        return ApiResponse.ok("PIN_STATUS", message, new PinOperationResult(hasPin, message));
    }

    /**
     * Thiết lập hoặc đổi mã PIN dự phòng 6 số cho nhân viên
     * (POST /api/v1/employee/pin - APD-BE-011, API-BE-021).
     *
     * <p>Nếu request chứa {@code currentPin}: thực hiện luồng đổi mã PIN.</p>
     * <p>Nếu request không chứa {@code currentPin}: thực hiện luồng thiết lập mã PIN lần đầu.</p>
     *
     * @param body      dữ liệu yêu cầu gồm pin/newPin, confirmPin và currentPin (nếu đổi)
     * @param principal thông tin người dùng đang đăng nhập
     * @return kết quả thao tác trả về cờ hasPin = true
     */
    @PostMapping("/pin")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PinOperationResult> managePin(
            @RequestBody Map<String, String> body,
            Principal principal
    ) {
        Long userId = resolveCurrentUserId(principal);

        String currentPin = body != null ? body.get("currentPin") : null;
        String pin = body != null ? body.get("pin") : null;
        String newPin = body != null ? body.get("newPin") : null;
        String confirmPin = body != null ? body.get("confirmPin") : null;

        PinOperationResult result;
        if (StringUtils.hasText(currentPin)) {
            // Luồng đổi mã PIN dự phòng
            String targetNewPin = StringUtils.hasText(newPin) ? newPin : pin;
            result = pinService.changePin(userId, currentPin, targetNewPin, confirmPin);
        } else {
            // Luồng thiết lập mã PIN dự phòng lần đầu
            String targetPin = StringUtils.hasText(pin) ? pin : newPin;
            result = pinService.setupPin(userId, targetPin, confirmPin);
        }

        return ApiResponse.ok("PIN_SUCCESS", result.message(), result);
    }

    private Long resolveCurrentUserId(Principal principal) {
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
