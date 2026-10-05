package com.fas.api.dto.request;

import com.fas.api.validation.L2Normalized;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Yêu cầu nạp vector ArcFace 512D mới trích xuất từ camera Kiosk
 * ({@code POST /api/v1/kiosk/enroll-face} - APD-BE-001).
 *
 * @param otp          mã OTP kích hoạt đã dùng ở bước verify-otp
 * @param sessionToken token tạm thời được cấp từ {@code verify-otp}
 * @param vector512    mảng số thực 512 chiều đã chuẩn hóa L2
 * @param kioskId      mã trạm Kiosk thực hiện thu mẫu
 */
public record KioskEnrollFaceRequest(
        @NotBlank(message = "Mã OTP không được để trống")
        @Pattern(regexp = "\\d{6}", message = "Mã OTP phải gồm đúng 6 chữ số")
        String otp,

        @NotBlank(message = "sessionToken không được để trống")
        String sessionToken,

        @NotNull(message = "vector512 không được để trống")
        @Size(min = 512, max = 512, message = "vector512 phải có đúng 512 phần tử")
        @L2Normalized
        List<Float> vector512,

        @NotBlank(message = "kioskId không được để trống")
        @Size(max = 64, message = "kioskId không được vượt quá 64 ký tự")
        String kioskId) {
}
