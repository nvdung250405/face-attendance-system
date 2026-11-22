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

    public static <T> PageResponse<T> from(org.springframework.data.domain.Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    public static <S, T> PageResponse<T> map(org.springframework.data.domain.Page<S> page, java.util.function.Function<S, T> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }
}
