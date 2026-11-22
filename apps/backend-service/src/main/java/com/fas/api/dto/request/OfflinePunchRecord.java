package com.fas.api.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Một bản ghi điểm danh ngoại tuyến nằm trong gói đồng bộ bù của trạm Kiosk
 * ({@code POST /api/v1/kiosk/sync-batch} - APD-BE-001).
 *
 * @param localQueueId       ID bản ghi trong SQLite WAL cục bộ của Kiosk
 * @param employeeId         mã định danh số của nhân viên
 * @param punchTimestamp     mốc thời gian quét ngoại tuyến theo ISO-8601 kèm múi giờ
 * @param verificationMethod phương thức xác thực đã dùng tại Kiosk
 * @param confidenceScore    điểm tương đồng Cosine (tùy chọn)
 */
public record OfflinePunchRecord(
        @NotNull(message = "localQueueId không được để trống")
        @Positive(message = "localQueueId phải là số nguyên dương")
        Long localQueueId,

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
        BigDecimal confidenceScore) {
}
