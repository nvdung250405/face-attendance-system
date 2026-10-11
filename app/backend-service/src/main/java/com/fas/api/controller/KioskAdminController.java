package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.PageResponse;
import com.fas.api.dto.request.RegisterKioskRequest;
import com.fas.api.dto.request.UpdateKioskRequest;
import com.fas.api.dto.response.KioskHealthResponse;
import com.fas.api.dto.response.KioskItemResponse;
import com.fas.api.dto.response.RegisterKioskResponse;
import com.fas.api.dto.response.RotateKioskTokenResponse;
import com.fas.service.KioskAdminService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller Quản trị Trạm Kiosk dành cho Quản trị viên
 * (APD-BE-018, API-BE-032, API-BE-033, API-BE-034, FR-BE-017, BLD-BE-029, TASK-BE-034).
 *
 * <p>Yêu cầu vai trò: {@code ADMIN}.</p>
 */
@RestController
@RequestMapping("/api/v1/admin/kiosks")
@PreAuthorize("hasRole('ADMIN')")
public class KioskAdminController {

    private final KioskAdminService kioskAdminService;

    public KioskAdminController(KioskAdminService kioskAdminService) {
        this.kioskAdminService = kioskAdminService;
    }

    /**
     * Đăng ký trạm Kiosk mới kèm Secret Token hiển thị duy nhất một lần
     * (POST /api/v1/admin/kiosks - API-BE-032).
     *
     * @param request dữ liệu đăng ký trạm
     * @return thông tin trạm kèm mã bí mật chưa băm với mã HTTP 201 Created
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RegisterKioskResponse> registerKiosk(@Valid @RequestBody RegisterKioskRequest request) {
        RegisterKioskResponse response = kioskAdminService.registerKiosk(request);
        return ApiResponse.ok("KIOSK_REGISTERED", "Đăng ký trạm Kiosk thành công", response);
    }

    /**
     * Tra cứu danh sách các trạm Kiosk có phân trang
     * (GET /api/v1/admin/kiosks - API-BE-032).
     *
     * @param pageable thông số phân trang và sắp xếp
     * @return danh sách trạm Kiosk phân trang kèm HTTP 200 OK
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PageResponse<KioskItemResponse>> listKiosks(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        PageResponse<KioskItemResponse> response = kioskAdminService.listKiosks(pageable);
        return ApiResponse.ok("KIOSKS_FETCHED", "Lấy danh sách trạm Kiosk thành công", response);
    }

    /**
     * Lấy thông tin chi tiết một trạm Kiosk theo định danh
     * (GET /api/v1/admin/kiosks/{id}).
     *
     * @param id mã định danh trạm Kiosk
     * @return thông tin chi tiết trạm kèm HTTP 200 OK
     */
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<KioskItemResponse> getKioskById(@PathVariable("id") String id) {
        KioskItemResponse response = kioskAdminService.getKioskById(id);
        return ApiResponse.ok("KIOSK_FETCHED", "Lấy thông tin trạm Kiosk thành công", response);
    }

    /**
     * Cập nhật thông tin hoặc vô hiệu hóa trạm Kiosk
     * (PATCH /api/v1/admin/kiosks/{id} - API-BE-033).
     *
     * @param id      mã định danh trạm Kiosk
     * @param request dữ liệu cập nhật
     * @return thông tin trạm sau cập nhật kèm HTTP 200 OK
     */
    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<KioskItemResponse> updateKiosk(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateKioskRequest request
    ) {
        KioskItemResponse response = kioskAdminService.updateKiosk(id, request);
        return ApiResponse.ok("KIOSK_UPDATED", "Cập nhật trạm Kiosk thành công", response);
    }

    /**
     * Đổi Secret Token cho trạm Kiosk (token cũ lập tức bị vô hiệu hóa)
     * (POST /api/v1/admin/kiosks/{id}/rotate-secret - API-BE-033).
     *
     * @param id mã định danh trạm Kiosk
     * @return khóa bí mật mới hiển thị một lần duy nhất kèm HTTP 200 OK
     */
    @PostMapping("/{id}/rotate-secret")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<RotateKioskTokenResponse> rotateSecretToken(@PathVariable("id") String id) {
        RotateKioskTokenResponse response = kioskAdminService.rotateSecretToken(id);
        return ApiResponse.ok("KIOSK_TOKEN_ROTATED", "Đổi Secret Token trạm Kiosk thành công", response);
    }

    /**
     * Lấy trạng thái sức khỏe và kết nối của trạm Kiosk
     * (GET /api/v1/admin/kiosks/{id}/health - API-BE-034).
     *
     * @param id mã định danh trạm Kiosk
     * @return trạng thái sức khỏe kèm HTTP 200 OK
     */
    @GetMapping("/{id}/health")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<KioskHealthResponse> getKioskHealth(@PathVariable("id") String id) {
        KioskHealthResponse response = kioskAdminService.getKioskHealth(id);
        return ApiResponse.ok("KIOSK_HEALTH_FETCHED", "Lấy trạng thái kết nối trạm Kiosk thành công", response);
    }
}
