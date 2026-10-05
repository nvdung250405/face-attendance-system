package com.fas.api.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Yêu cầu ghi nhận một lượt điểm danh trực tiếp từ trạm Kiosk
 * ({@code POST /api/v1/kiosk/punch} - APD-BE-001).
 *
 * @param employeeId         mã định danh số của nhân viên trong CSDL
 * @param punchTimestamp     mốc thời gian quét thực tế theo ISO-8601 kèm múi giờ
 * @param verificationMethod phương thức xác thực đã dùng tại Kiosk
 * @param confidenceScore    điểm tương đồng Cosine Similarity (tùy chọn)
 * @param kioskId            mã trạm điểm danh, phải khớp header {@code X-Kiosk-Id}
 */
public record KioskPunchRequest(
        @NotNull(message = "employeeId không được để trống")
        @Positive(message = "employeeId phải là số nguyên dương")
        Long employeeId,

        @NotNull(message = "punchTimestamp không được để trống")
        OffsetDateTime punchTimestamp,

        @NotBlank(message = "verificationMethod không được để trống")
        @Pattern(
                regexp = "VERIFICATION_FACE|VERIFICATION_PIN",
                message = "verificationMethod chỉ chấp nhận giá trị VERIFICATION_FACE hoặc VERIFICATION_PIN")
        String verificationMethod,

        @DecimalMin(value = "0.0", message = "confidenceScore phải nằm trong khoảng 0.0 đến 1.0")
        @DecimalMax(value = "1.0", message = "confidenceScore phải nằm trong khoảng 0.0 đến 1.0")
        BigDecimal confidenceScore,

        @NotBlank(message = "kioskId không được để trống")
        @Size(max = 64, message = "kioskId không được vượt quá 64 ký tự")
        String kioskId) {
}
