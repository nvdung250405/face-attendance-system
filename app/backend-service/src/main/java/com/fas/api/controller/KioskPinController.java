package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.KioskVerifyPinRequest;
import com.fas.api.dto.response.PinVerificationResult;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.repository.KioskRepository;
import com.fas.service.PinService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller Thẩm định Mã PIN Dự phòng Trạm Kiosk
 * (APD-BE-012, API-BE-022, FR-BE-012, BLD-BE-022, TASK-BE-027).
 */
@RestController
@RequestMapping("/api/v1/kiosk")
public class KioskPinController {

    private final PinService pinService;
    private final KioskRepository kioskRepository;

    public KioskPinController(PinService pinService, KioskRepository kioskRepository) {
        this.pinService = pinService;
        this.kioskRepository = kioskRepository;
    }

    /**
     * Thẩm định mã PIN dự phòng của nhân viên tại trạm Kiosk trước khi ghi nhận điểm danh
     * (POST /api/v1/kiosk/verify-pin - APD-BE-012, API-BE-022).
     *
     * @param kioskId mã định danh trạm Kiosk gửi trong header {@code X-Kiosk-Id}
     * @param request dữ liệu gồm mã nhân viên và mã PIN 6 số
     * @return kết quả thẩm định kèm thông tin nhân sự với mã HTTP 200 OK
     */
    @PostMapping("/verify-pin")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PinVerificationResult> verifyPin(
            @RequestHeader("X-Kiosk-Id") String kioskId,
            @Valid @RequestBody KioskVerifyPinRequest request
    ) {
        // 1. Thẩm định tính hợp lệ của trạm Kiosk
        kioskRepository.findByIdAndIsActiveTrue(kioskId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                        "Trạm Kiosk không tồn tại hoặc đã bị vô hiệu hóa: " + kioskId));

        // 2. Thẩm định mã PIN nhân viên qua PinService
        PinVerificationResult result = pinService.verifyPin(request);

        // 3. Phản hồi kết quả thành công
        return ApiResponse.ok("PIN_VERIFIED", "Mã PIN chính xác", result);
    }
}
