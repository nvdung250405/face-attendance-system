package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.CreateShiftRequest;
import com.fas.api.dto.request.UpdateShiftRequest;
import com.fas.api.dto.response.ShiftResponse;
import com.fas.service.ShiftManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller Quản lý Danh mục Ca làm việc
 * (APD-BE-013, API-BE-023, FR-BE-013, BLD-BE-027, TASK-BE-032).
 *
 * <p>Yêu cầu quyền: {@code HR_MANAGER} hoặc {@code ADMIN}.
 */
@RestController
@RequestMapping("/api/v1/admin/shifts")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class ShiftController {

    private final ShiftManagementService shiftManagementService;

    public ShiftController(ShiftManagementService shiftManagementService) {
        this.shiftManagementService = shiftManagementService;
    }

    /**
     * Khởi tạo ca làm việc mới trong danh mục (POST /api/v1/admin/shifts - API-BE-023).
     *
     * @param request dữ liệu khởi tạo ca
     * @return kết quả khởi tạo ca làm việc kèm mã 201 Created
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ShiftResponse> createShift(@Valid @RequestBody CreateShiftRequest request) {
        ShiftResponse response = shiftManagementService.createShift(request);
        return ApiResponse.ok("SHIFT_CREATED", "Khởi tạo ca làm việc thành công", response);
    }

    /**
     * Cập nhật thông tin ca làm việc hiện có (PATCH /api/v1/admin/shifts/{id} - API-BE-023).
     *
     * @param id      mã định danh ca làm việc
     * @param request dữ liệu cập nhật ca
     * @return kết quả cập nhật ca kèm mã 200 OK
     */
    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<ShiftResponse> updateShift(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateShiftRequest request) {
        ShiftResponse response = shiftManagementService.updateShift(id, request);
        return ApiResponse.ok("SHIFT_UPDATED", "Cập nhật ca làm việc thành công", response);
    }

    /**
     * Tra cứu danh sách toàn bộ ca làm việc (GET /api/v1/admin/shifts).
     *
     * @param activeOnly cờ chỉ lấy ca đang hoạt động (tùy chọn)
     * @return danh sách ca làm việc kèm mã 200 OK
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<ShiftResponse>> getAllShifts(
            @RequestParam(name = "activeOnly", required = false) Boolean activeOnly) {
        List<ShiftResponse> response = shiftManagementService.getAllShifts(activeOnly);
        return ApiResponse.ok("SHIFT_LIST_FETCHED", "Lấy danh sách ca làm việc thành công", response);
    }

    /**
     * Tra cứu chi tiết một ca làm việc theo ID (GET /api/v1/admin/shifts/{id}).
     *
     * @param id mã định danh ca làm việc
     * @return thông tin chi tiết ca kèm mã 200 OK
     */
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<ShiftResponse> getShiftById(@PathVariable("id") Long id) {
        ShiftResponse response = shiftManagementService.getShift(id);
        return ApiResponse.ok("SHIFT_FETCHED", "Lấy chi tiết ca làm việc thành công", response);
    }

    /**
     * Vô hiệu hóa một ca làm việc (POST /api/v1/admin/shifts/{id}/deactivate).
     *
     * @param id mã định danh ca làm việc
     * @return kết quả sau khi vô hiệu hóa kèm mã 200 OK
     */
    @PostMapping("/{id}/deactivate")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<ShiftResponse> deactivateShift(@PathVariable("id") Long id) {
        ShiftResponse response = shiftManagementService.deactivateShift(id);
        return ApiResponse.ok("SHIFT_DEACTIVATED", "Vô hiệu hóa ca làm việc thành công", response);
    }

    /**
     * Kích hoạt lại ca làm việc đã bị vô hiệu hóa (POST /api/v1/admin/shifts/{id}/activate).
     *
     * @param id mã định danh ca làm việc
     * @return kết quả sau khi kích hoạt lại kèm mã 200 OK
     */
    @PostMapping("/{id}/activate")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<ShiftResponse> activateShift(@PathVariable("id") Long id) {
        ShiftResponse response = shiftManagementService.activateShift(id);
        return ApiResponse.ok("SHIFT_ACTIVATED", "Kích hoạt ca làm việc thành công", response);
    }
}
