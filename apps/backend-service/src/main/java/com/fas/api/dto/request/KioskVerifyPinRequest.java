package com.fas.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Yêu cầu thẩm định mã PIN dự phòng từ trạm Kiosk
 * ({@code POST /api/v1/kiosk/verify-pin} - APD-BE-012, API-BE-022).
 *
 * @param employeeCode mã nhân viên cần thẩm định mã PIN
 * @param pin          mã PIN 6 chữ số do nhân viên nhập tại bàn phím ảo
 */
public record KioskVerifyPinRequest(
        @NotBlank(message = "Mã nhân viên không được để trống")
        String employeeCode,

        @NotBlank(message = "Mã PIN không được để trống")
        @Pattern(regexp = "\\d{6}", message = "Mã PIN phải gồm đúng 6 chữ số")
        String pin) {
}
