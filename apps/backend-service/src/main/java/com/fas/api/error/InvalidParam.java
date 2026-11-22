package com.fas.api.error;

/**
 * Chi tiết một trường dữ liệu vi phạm ràng buộc validation, tương ứng phần tử
 * của mảng {@code invalidParams} trong cấu trúc ProblemDetails RFC 7807 (APD-BE-004).
 *
 * @param field  tên trường hoặc tham số vi phạm
 * @param reason diễn giải lý do vi phạm
 */
public record InvalidParam(String field, String reason) {
}
