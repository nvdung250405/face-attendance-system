package com.fas.api.dto.response;

import com.fas.data.entity.ExcuseRequest;
import com.fas.data.enums.ExcuseRequestStatus;

import java.time.Instant;

/**
 * Phản hồi chi tiết đơn giải trình công (FR-BE-014, FR-BE-015, API-BE-027).
 *
 * @param id                        định danh đơn giải trình
 * @param userId                    định danh nhân viên
 * @param employeeCode              mã nhân viên
 * @param fullName                  họ tên nhân viên
 * @param attendanceLogId           định danh bản ghi điểm danh liên quan
 * @param originalPunchTimestamp    thời gian chấm công ban đầu của bản ghi
 * @param requestedPunchTimestamp   thời gian đề xuất điều chỉnh
 * @param reason                    lý do giải trình
 * @param status                    trạng thái đơn (PENDING / APPROVED / REJECTED)
 * @param decidedById               định danh người duyệt/từ chối
 * @param decidedByName             họ tên người duyệt/từ chối
 * @param decidedAt                 thời điểm ra quyết định
 * @param rejectionReason           lý do từ chối (nếu có)
 * @param createdAt                 thời điểm nộp đơn
 * @param updatedAt                 thời điểm cập nhật đơn
 */
public record ExcuseRequestResponse(
        Long id,
        Long userId,
        String employeeCode,
        String fullName,
        Long attendanceLogId,
        Instant originalPunchTimestamp,
        Instant requestedPunchTimestamp,
        String reason,
        ExcuseRequestStatus status,
        Long decidedById,
        String decidedByName,
        Instant decidedAt,
        String rejectionReason,
        Instant createdAt,
        Instant updatedAt
) {

    public static ExcuseRequestResponse fromEntity(ExcuseRequest entity) {
        Long attendanceLogId = entity.getAttendanceLog() != null ? entity.getAttendanceLog().getId() : null;
        Instant originalPunchTime = entity.getAttendanceLog() != null ? entity.getAttendanceLog().getPunchTimestamp() : null;

        Long decidedById = entity.getDecidedBy() != null ? entity.getDecidedBy().getId() : null;
        String decidedByName = entity.getDecidedBy() != null ? entity.getDecidedBy().getFullName() : null;

        return new ExcuseRequestResponse(
                entity.getId(),
                entity.getUser() != null ? entity.getUser().getId() : null,
                entity.getUser() != null ? entity.getUser().getEmployeeCode() : null,
                entity.getUser() != null ? entity.getUser().getFullName() : null,
                attendanceLogId,
                originalPunchTime,
                entity.getRequestedPunchTimestamp(),
                entity.getReason(),
                entity.getStatus(),
                decidedById,
                decidedByName,
                entity.getDecidedAt(),
                entity.getRejectionReason(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
