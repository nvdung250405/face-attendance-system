package com.fas.api.dto.response;

/**
 * Kết quả thẩm định mã PIN dự phòng thành công tại trạm Kiosk
 * ({@code POST /api/v1/kiosk/verify-pin} - APD-BE-012, API-BE-022).
 *
 * @param employeeId   mã định danh duy nhất của nhân viên
 * @param employeeCode mã nhân viên
 * @param fullName     họ và tên đầy đủ
 * @param department   phòng ban làm việc
 */
public record PinVerificationResult(
        Long employeeId,
        String employeeCode,
        String fullName,
        String department) {
}
