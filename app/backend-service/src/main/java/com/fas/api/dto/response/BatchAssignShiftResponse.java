package com.fas.api.dto.response;

import java.util.List;

/**
 * DTO kết quả phân công ca làm việc hàng loạt
 * ({@code POST /api/v1/admin/employee-shifts/batch} - API-BE-037, TASK-BE-042).
 *
 * @param total                 tổng số nhân sự yêu cầu phân ca
 * @param successCount          số lượng phân ca thành công
 * @param failedCount           số lượng phân ca thất bại (do trùng ca, không tìm thấy,...)
 * @param successfulAssignments danh sách các bản ghi phân ca thành công
 * @param failures              danh sách chi tiết các nhân sự bị lỗi/trùng ca
 */
public record BatchAssignShiftResponse(
        int total,
        int successCount,
        int failedCount,
        List<EmployeeShiftResponse> successfulAssignments,
        List<BatchAssignmentFailure> failures) {

    /**
     * Chi tiết lỗi của một nhân sự trong quá trình phân ca hàng loạt.
     *
     * @param userId       mã định danh nhân viên
     * @param employeeCode mã nhân viên
     * @param fullName     họ tên nhân viên
     * @param reason       nguyên nhân thất bại (trùng ca, không hoạt động,...)
     */
    public record BatchAssignmentFailure(
            Long userId,
            String employeeCode,
            String fullName,
            String reason) {
    }
}
