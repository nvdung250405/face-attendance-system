package com.fas.api.dto.request;

import com.fas.data.enums.AttendanceStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Điều kiện tra cứu, lọc và phân trang lịch sử điểm danh toàn công ty của HR/Quản trị
 * ({@code GET /api/v1/admin/attendance} - APD-BE-002).
 * Các trường {@code null} nghĩa là không áp dụng bộ lọc tương ứng.
 *
 * @param page       chỉ số trang (bắt đầu từ 0)
 * @param size       số lượng bản ghi trên một trang (tối đa 100)
 * @param fromDate   ngày bắt đầu lọc
 * @param toDate     ngày kết thúc lọc
 * @param department tên phòng ban cần lọc
 * @param status     trạng thái chấm công cần lọc
 * @param keyword    từ khóa tìm kiếm theo tên hoặc mã nhân viên
 */
public record AttendanceSearchCriteria(
        @Min(value = 0, message = "page phải lớn hơn hoặc bằng 0")
        Integer page,

        @Min(value = 1, message = "size phải nằm trong khoảng 1 đến 100")
        @Max(value = 100, message = "size phải nằm trong khoảng 1 đến 100")
        Integer size,

        LocalDate fromDate,

        LocalDate toDate,

        @Size(max = 64, message = "department không được vượt quá 64 ký tự")
        String department,

        AttendanceStatus status,

        @Size(max = 128, message = "keyword không được vượt quá 128 ký tự")
        String keyword) {
}
