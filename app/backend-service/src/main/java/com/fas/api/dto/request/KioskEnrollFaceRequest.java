package com.fas.api.dto.request;

import com.fas.api.validation.L2Normalized;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Yêu cầu nạp vector ArcFace 512D mới trích xuất từ camera Kiosk
 * ({@code POST /api/v1/kiosk/enroll-face} - APD-BE-001, FEAT-ENROLL-001 Task 3).
 *
 * @param otp          mã OTP kích hoạt đã dùng ở bước verify-otp
 * @param sessionToken token tạm thời được cấp từ {@code verify-otp}
 * @param templates    danh sách 3 mẫu khuôn mặt theo 3 tư thế chuẩn (FRONTAL, LEFT_TILT, RIGHT_TILT)
 * @param vector512    mảng số thực 512 chiều (fallback tương thích ngược cho trạm Kiosk phiên bản cũ)
 * @param kioskId      mã trạm Kiosk thực hiện thu mẫu
 */
public record KioskEnrollFaceRequest(
        @NotBlank(message = "Mã OTP không được để trống")
        @Pattern(regexp = "\\d{6}", message = "Mã OTP phải gồm đúng 6 chữ số")
        String otp,

        @NotBlank(message = "sessionToken không được để trống")
        String sessionToken,

        List<@Valid PoseTemplateDto> templates,

        @Size(min = 512, max = 512, message = "vector512 phải có đúng 512 phần tử")
        @L2Normalized
        List<Float> vector512,

        @NotBlank(message = "kioskId không được để trống")
        @Size(max = 64, message = "kioskId không được vượt quá 64 ký tự")
        String kioskId) {

    /**
     * Constructor tương thích ngược cho máy khách/kiểm thử chỉ truyền vector đơn (APD-BE-001).
     */
    public KioskEnrollFaceRequest(String otp, String sessionToken, List<Float> vector512, String kioskId) {
        this(otp, sessionToken, null, vector512, kioskId);
    }

    /**
     * Constructor tiện ích cho máy khách/kiểm thử truyền danh sách templates đa tư thế.
     */
    public KioskEnrollFaceRequest(String otp, String sessionToken, String kioskId, List<PoseTemplateDto> templates) {
        this(otp, sessionToken, templates, null, kioskId);
    }
}
