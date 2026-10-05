package com.fas.api.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu ký thỏa thuận Informed Consent của nhân viên trên Web Portal
 * ({@code POST /api/v1/employee/consent} - APD-BE-002).
 *
 * @param agreed         xác nhận đồng thuận xử lý dữ liệu khuôn mặt
 * @param consentVersion phiên bản văn bản cam kết đang hiệu lực
 */
public record ConsentRequest(
        @NotNull(message = "agreed không được để trống")
        @AssertTrue(message = "Cần đồng ý với thỏa thuận Informed Consent để tiếp tục")
        Boolean agreed,

        @NotBlank(message = "consentVersion không được để trống")
        @Size(max = 32, message = "consentVersion không được vượt quá 32 ký tự")
        String consentVersion) {
}
