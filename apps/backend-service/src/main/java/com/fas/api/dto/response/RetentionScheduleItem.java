package com.fas.api.dto.response;

import java.time.Instant;

/**
 * Bản ghi lịch trình lưu trữ và tiêu hủy dữ liệu sinh trắc học phục vụ DPO (API-BE-031, FR-BE-016).
 *
 * @param sourceId               định danh nguồn (userId hoặc withdrawalId)
 * @param employeeCode           mã nhân viên
 * @param fullName               họ tên nhân sự
 * @param email                  email nhân sự
 * @param triggerDate            mốc kích hoạt (ngày thôi việc hoặc thời điểm rút consent)
 * @param scheduledDisposalDate  mốc tiêu hủy dự kiến
 * @param isDisposed             dữ liệu sinh trắc học đã tiêu hủy vĩnh viễn hay chưa
 * @param processedAt            thời điểm thực tế tiêu hủy (nếu có)
 * @param retentionType          loại tiêu hủy (EMPLOYEE_TERMINATION: 20 ngày, CONSENT_WITHDRAWAL: 7 ngày)
 */
public record RetentionScheduleItem(
        Long sourceId,
        String employeeCode,
        String fullName,
        String email,
        String triggerDate,
        String scheduledDisposalDate,
        boolean isDisposed,
        Instant processedAt,
        String retentionType
) {
}
