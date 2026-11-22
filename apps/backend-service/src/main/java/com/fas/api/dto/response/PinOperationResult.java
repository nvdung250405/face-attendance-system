package com.fas.api.dto.response;

/**
 * Kết quả thao tác thiết lập, đổi hoặc đặt lại mã PIN dự phòng
 * ({@code POST /api/v1/employee/pin} - APD-BE-011, API-BE-021).
 *
 * @param hasPin  trạng thái tài khoản đã có mã PIN hay chưa
 * @param message thông điệp phản hồi
 */
public record PinOperationResult(
        boolean hasPin,
        String message) {
}
