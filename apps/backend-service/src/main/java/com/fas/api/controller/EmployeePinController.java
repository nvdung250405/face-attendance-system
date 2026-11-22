package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.response.PinOperationResult;
import com.fas.common.error.ApiErrorCode;
import com.fas.common.error.ApiException;
import com.fas.security.CurrentUserService;
import com.fas.service.PinService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import com.fas.api.dto.request.PinManagementRequest;
import jakarta.validation.Valid;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * REST Controller Quản lý Mã PIN Dự phòng Nhân sự
 * (APD-BE-011, API-BE-021, FR-BE-012, BLD-BE-022, TASK-BE-027).
 */
@RestController
@RequestMapping("/api/v1/employee")
public class EmployeePinController {

    private final PinService pinService;
    private final CurrentUserService currentUserService;

    public EmployeePinController(PinService pinService, CurrentUserService currentUserService) {
        this.pinService = pinService;
        this.currentUserService = currentUserService;
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
        Long userId = currentUserService.getCurrentUserId(principal);
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
            @Valid @RequestBody PinManagementRequest request,
            Principal principal
    ) {
        Long userId = currentUserService.getCurrentUserId(principal);

        String currentPin = request != null ? request.currentPin() : null;
        String pin = request != null ? request.pin() : null;
        String newPin = request != null ? request.newPin() : null;
        String confirmPin = request != null ? request.confirmPin() : null;

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

}
