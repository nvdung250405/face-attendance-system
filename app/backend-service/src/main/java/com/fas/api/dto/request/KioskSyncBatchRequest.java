package com.fas.api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Yêu cầu đồng bộ bù gói bản ghi điểm danh ngoại tuyến khi trạm Kiosk khôi phục mạng
 * ({@code POST /api/v1/kiosk/sync-batch} - APD-BE-001, DD-BE-012).
 *
 * @param kioskId   mã trạm Kiosk gửi gói đồng bộ
 * @param batchSize số lượng bản ghi trong lô đồng bộ
 * @param records   danh sách bản ghi ngoại tuyến cần lưu
 */
public record KioskSyncBatchRequest(
        @NotBlank(message = "kioskId không được để trống")
        @Size(max = 64, message = "kioskId không được vượt quá 64 ký tự")
        String kioskId,

        @NotNull(message = "batchSize không được để trống")
        @Min(value = 1, message = "batchSize phải nằm trong khoảng 1 đến 50")
        @Max(value = 50, message = "batchSize phải nằm trong khoảng 1 đến 50")
        Integer batchSize,

        @NotEmpty(message = "records không được để trống")
        @Size(max = 50, message = "records chỉ được chứa tối đa 50 phần tử")
        @Valid
        List<OfflinePunchRecord> records) {
}
