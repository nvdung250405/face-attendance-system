package com.fas.data.repository;

import com.fas.data.entity.AttendanceLog;

import java.util.List;

/**
 * Interface hỗ trợ native batch insert với chiến lược ON CONFLICT DO NOTHING theo DBL-BE-003.
 */
public interface AttendanceLogBatchRepository {

    /**
     * Ghi lô danh sách bản ghi điểm danh với hiệu năng cao, tự động bỏ qua bản ghi trùng lặp.
     *
     * @param logs Danh sách bản ghi điểm danh cần chèn
     * @return Số lượng bản ghi đã được xử lý
     */
    int batchInsertOfflineLogs(List<AttendanceLog> logs);
}
