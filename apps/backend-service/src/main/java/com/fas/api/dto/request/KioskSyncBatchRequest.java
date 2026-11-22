package com.fas.api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Yêu cầu đồng bộ bù gói bản ghi điểm danh ngoại tuyến khi trạm Kiosk khôi phục mạng
 * ({@code POST /api/v1/kiosk/sync-batch} - APD-BE-001, DD-BE-012).
 *
 * @param records danh sách bản ghi ngoại tuyến cần lưu (tối đa 50 phần tử)
 */
public record KioskSyncBatchRequest(
        @NotEmpty(message = "records không được để trống")
        @Size(max = 50, message = "records chỉ được chứa tối đa 50 phần tử")
        @Valid
        List<OfflinePunchRecord> records) {
}
