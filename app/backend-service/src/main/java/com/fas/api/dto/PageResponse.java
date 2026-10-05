package com.fas.api.dto;

import java.util.List;

/**
 * Cấu trúc dữ liệu phân trang dùng chung cho các API tra cứu của Web Portal (APD-BE-002).
 *
 * @param content       danh sách bản ghi của trang hiện tại
 * @param page          chỉ số trang (bắt đầu từ 0)
 * @param size          số lượng bản ghi trên một trang
 * @param totalElements tổng số bản ghi thỏa mãn điều kiện lọc
 * @param totalPages    tổng số trang
 * @param first         trang hiện tại có phải trang đầu tiên
 * @param last          trang hiện tại có phải trang cuối cùng
 * @param <T>           kiểu dữ liệu phần tử
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last) {
}
