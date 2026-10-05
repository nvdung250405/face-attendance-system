package com.fas.api.dto;

import java.time.OffsetDateTime;
import java.time.ZoneId;

/**
 * Cấu trúc bao bọc phản hồi chuẩn của toàn bộ REST API (APD-BE-004).
 *
 * @param success   trạng thái xử lý thành công
 * @param code      mã kết quả nghiệp vụ dạng STRING_ENUM_CODE (Ví dụ: {@code PUNCH_RECORDED})
 * @param message   thông điệp mô tả kết quả thân thiện
 * @param data      dữ liệu nghiệp vụ của phản hồi
 * @param timestamp mốc thời gian phản hồi theo ISO-8601 kèm múi giờ (+07:00)
 * @param <T>       kiểu dữ liệu nghiệp vụ
 */
public record ApiResponse<T>(
        boolean success,
        String code,
        String message,
        T data,
        OffsetDateTime timestamp) {

    /**
     * Múi giờ chuẩn của hợp đồng API: ISO-8601 kèm offset +07:00.
     */
    public static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * Khởi tạo phản hồi thành công kèm mốc thời gian hiện tại theo múi giờ hợp đồng.
     */
    public static <T> ApiResponse<T> ok(String code, String message, T data) {
        return new ApiResponse<>(true, code, message, data, OffsetDateTime.now(VIETNAM_ZONE));
    }
}
