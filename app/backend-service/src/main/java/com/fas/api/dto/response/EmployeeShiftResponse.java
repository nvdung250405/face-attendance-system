package com.fas.api.dto.response;

import java.time.LocalDate;

/**
 * DTO phản hồi thông tin phân công ca làm việc của nhân viên
 * ({@code /api/v1/admin/employee-shifts} - APD-BE-014, API-BE-025).
 *
 * @param id            định danh bản ghi phân ca
 * @param userId        mã định danh nhân viên
 * @param employeeCode  mã nhân viên
 * @param fullName      họ tên nhân viên
 * @param shiftId       mã định danh ca làm việc
 * @param shiftCode     mã ca làm việc
 * @param shiftName     tên ca làm việc
 * @param effectiveFrom ngày bắt đầu hiệu lực
 * @param effectiveTo   ngày kết thúc hiệu lực
 */
public record EmployeeShiftResponse(
        Long id,
        Long userId,
        String employeeCode,
        String fullName,
        Long shiftId,
        String shiftCode,
        String shiftName,
        LocalDate effectiveFrom,
        LocalDate effectiveTo) {
}
