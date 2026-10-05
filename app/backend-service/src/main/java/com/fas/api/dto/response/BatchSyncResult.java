package com.fas.api.dto.response;

import java.util.List;

/**
 * Kết quả đồng bộ bù gói bản ghi điểm danh ngoại tuyến
 * ({@code POST /api/v1/kiosk/sync-batch} - APD-BE-001).
 *
 * @param syncedCount    số bản ghi lưu thành công
 * @param syncedLocalIds danh sách {@code localQueueId} đã lưu thành công
 * @param failedLocalIds danh sách {@code localQueueId} bị bỏ qua
 */
public record BatchSyncResult(
        int syncedCount,
        List<Long> syncedLocalIds,
        List<Long> failedLocalIds) {
}
