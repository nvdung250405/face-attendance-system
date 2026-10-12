package com.fas.api.controller;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.request.KioskEnrollFaceRequest;
import com.fas.api.dto.request.KioskPunchRequest;
import com.fas.api.dto.request.KioskSyncBatchRequest;
import com.fas.api.dto.request.KioskVerifyOtpRequest;
import com.fas.api.dto.response.BatchSyncResult;
import com.fas.api.dto.response.EnrollmentResult;
import com.fas.api.dto.response.GalleryResponse;
import com.fas.api.dto.response.OtpVerificationResult;
import com.fas.api.dto.response.PunchResult;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.repository.KioskRepository;
import com.fas.service.AttendanceService;
import com.fas.service.EnrollmentService;
import com.fas.service.OfflineBatchSyncService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller Tiếp nhận Giao dịch Trạm Kiosk
 * (APD-BE-001, API-BE-003..007, API-BE-045, APD-BE-006, BLD-BE-006, TASK-BE-019, TASK-BE-044).
 *
 * <p>Cung cấp các endpoint phục vụ nghiệp vụ Kiosk:
 * <ul>
 *   <li>{@code GET /api/v1/kiosk/health}: Kiểm tra trạng thái kết nối & sẵn sàng phục vụ của Backend</li>
 *   <li>{@code POST /api/v1/kiosk/punch}: Ghi nhận lượt điểm danh trực tiếp</li>
 *   <li>{@code POST /api/v1/kiosk/sync-batch}: Đồng bộ bù các lượt quẹt ngoại tuyến</li>
 *   <li>{@code GET /api/v1/kiosk/gallery}: Tải toàn bộ danh mục vector ArcFace 512D nạp RAM</li>
 *   <li>{@code POST /api/v1/kiosk/verify-otp}: Thẩm định mã OTP kích hoạt đăng ký mặt mới</li>
 *   <li>{@code POST /api/v1/kiosk/enroll-face}: Nạp mẫu vector 512D mới và kích hoạt nhân sự</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/kiosk")
public class KioskAttendanceController {

    private final AttendanceService attendanceService;
    private final OfflineBatchSyncService offlineBatchSyncService;
    private final EnrollmentService enrollmentService;
    private final KioskRepository kioskRepository;

    public KioskAttendanceController(
            AttendanceService attendanceService,
            OfflineBatchSyncService offlineBatchSyncService,
            EnrollmentService enrollmentService,
            KioskRepository kioskRepository) {
        this.attendanceService = attendanceService;
        this.offlineBatchSyncService = offlineBatchSyncService;
        this.enrollmentService = enrollmentService;
        this.kioskRepository = kioskRepository;
    }

    /**
     * Kiểm tra trạng thái hoạt động của Backend cho trạm Kiosk
     * (GET /api/v1/kiosk/health - APD-BE-001, API-BE-045, TASK-BE-044).
     *
     * @return trạng thái hoạt động với mã HTTP 200 OK
     */
    @GetMapping("/health")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Map<String, String>> checkHealth() {
        return ApiResponse.ok("HEALTHY", "Kiosk attendance service is operational", Map.of("status", "UP"));
    }

    /**
     * Ghi nhận lượt điểm danh trực tiếp từ trạm Kiosk
     * (POST /api/v1/kiosk/punch - APD-BE-001, API-BE-003).
     *
     * @param kioskId mã định danh trạm Kiosk trong header {@code X-Kiosk-Id}
     * @param request dữ liệu lượt quét thẻ/mặt từ Kiosk
     * @return kết quả lượt điểm danh với mã HTTP 200 OK
     */
    @PostMapping("/punch")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PunchResult> recordPunch(
            @RequestHeader("X-Kiosk-Id") String kioskId,
            @Valid @RequestBody KioskPunchRequest request) {
        validateKiosk(kioskId, request.kioskId());
        PunchResult result = attendanceService.recordPunch(request);
        return ApiResponse.ok("PUNCH_RECORDED", "Ghi nhận điểm danh thành công", result);
    }

    /**
     * Đồng bộ bù gói lô điểm danh ngoại tuyến khi trạm Kiosk khôi phục mạng
     * (POST /api/v1/kiosk/sync-batch - APD-BE-001, API-BE-004).
     *
     * @param kioskId mã định danh trạm Kiosk trong header {@code X-Kiosk-Id}
     * @param request gói lô tối đa 50 bản ghi quẹt ngoại tuyến
     * @return kết quả số bản ghi đã đồng bộ với mã HTTP 200 OK
     */
    @PostMapping("/sync-batch")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<BatchSyncResult> syncBatch(
            @RequestHeader("X-Kiosk-Id") String kioskId,
            @Valid @RequestBody KioskSyncBatchRequest request) {
        validateKiosk(kioskId, request.kioskId());
        BatchSyncResult result = offlineBatchSyncService.processOfflineBatch(request);
        return ApiResponse.ok("BATCH_SYNCED", "Đồng bộ thành công " + result.syncedCount() + " bản ghi", result);
    }

    /**
     * Lấy toàn bộ danh mục vector ArcFace 512D đã giải mã của nhân viên ACTIVE để Kiosk nạp RAM
     * (GET /api/v1/kiosk/gallery - APD-BE-001, API-BE-005).
     *
     * @param kioskId mã định danh trạm Kiosk trong header {@code X-Kiosk-Id}
     * @return danh mục vector kèm phiên bản với mã HTTP 200 OK
     */
    @GetMapping("/gallery")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<GalleryResponse> getGallery(
            @RequestHeader("X-Kiosk-Id") String kioskId) {
        validateKiosk(kioskId, null);
        GalleryResponse response = enrollmentService.getGallery();
        return ApiResponse.ok("GALLERY_FETCHED", "Lấy danh mục vector thành công", response);
    }

    /**
     * Thẩm định mã OTP 6 số để mở khóa camera quét khuôn mặt tại Kiosk
     * (POST /api/v1/kiosk/verify-otp - APD-BE-001, API-BE-006).
     *
     * @param kioskId mã định danh trạm Kiosk trong header {@code X-Kiosk-Id}
     * @param request mã OTP và kioskId
     * @return token phiên tạm thời và thông tin nhân sự với mã HTTP 200 OK
     */
    @PostMapping("/verify-otp")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<OtpVerificationResult> verifyOtp(
            @RequestHeader("X-Kiosk-Id") String kioskId,
            @Valid @RequestBody KioskVerifyOtpRequest request) {
        validateKiosk(kioskId, request.kioskId());
        OtpVerificationResult result = enrollmentService.verifyOtp(request);
        return ApiResponse.ok("OTP_VERIFIED", "Xác thực mã OTP thành công", result);
    }

    /**
     * Nạp vector ArcFace 512D mới kèm OTP/sessionToken và kích hoạt nhân sự
     * (POST /api/v1/kiosk/enroll-face - APD-BE-001, API-BE-007).
     *
     * @param kioskId mã định danh trạm Kiosk trong header {@code X-Kiosk-Id}
     * @param request dữ liệu vector 512 chiều, OTP, sessionToken và kioskId
     * @return kết quả kích hoạt mẫu sinh trắc học với mã HTTP 200 OK
     */
    @PostMapping("/enroll-face")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<EnrollmentResult> enrollFace(
            @RequestHeader("X-Kiosk-Id") String kioskId,
            @Valid @RequestBody KioskEnrollFaceRequest request) {
        validateKiosk(kioskId, request.kioskId());
        EnrollmentResult result = enrollmentService.enrollFace(request);
        return ApiResponse.ok("FACE_ENROLLED", "Đăng ký khuôn mặt thành công", result);
    }

    /**
     * Kiểm tra tính hợp lệ và trạng thái hoạt động của trạm Kiosk.
     * Đồng thời đối soát tính nhất quán giữa header {@code X-Kiosk-Id} và nội dung request body (nếu có).
     */
    private void validateKiosk(String headerKioskId, String requestKioskId) {
        kioskRepository.findByIdAndIsActiveTrue(headerKioskId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                        "Trạm Kiosk không tồn tại hoặc đã bị vô hiệu hóa: " + headerKioskId));

        if (requestKioskId != null && !requestKioskId.equals(headerKioskId)) {
            throw new ApiException(ApiErrorCode.KIOSK_UNAUTHORIZED,
                    "Header X-Kiosk-Id không khớp với kioskId trong nội dung yêu cầu");
        }
    }
}
