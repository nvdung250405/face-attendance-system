package com.fas.api.dto.response;

/**
 * Kết quả thẩm định mã OTP kích hoạt tại trạm Kiosk
 * ({@code POST /api/v1/kiosk/verify-otp} - APD-BE-001).
 *
 * @param sessionToken token tạm thời cho phép Kiosk nạp vector khuôn mặt
 * @param employeeId   mã định danh nhân viên sở hữu phiên đăng ký
 * @param employeeCode mã nhân viên
 * @param fullName     họ tên nhân viên
 * @param department   phòng ban công tác
 */
public record OtpVerificationResult(
        String sessionToken,
        Long employeeId,
        String employeeCode,
        String fullName,
        String department) {
}
