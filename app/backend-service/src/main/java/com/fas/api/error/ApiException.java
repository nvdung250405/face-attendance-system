package com.fas.api.error;

import lombok.Getter;

/**
 * Ngoại lệ nghiệp vụ toàn cục của phân hệ Backend.
 *
 * <p>Mang theo {@link ApiErrorCode} và thông điệp lỗi cụ thể để {@link GlobalExceptionHandler}
 * chuyển đổi thành cấu trúc RFC 7807 ProblemDetails với mã lỗi chuẩn hóa.
 */
@Getter
public class ApiException extends RuntimeException {

    private final ApiErrorCode errorCode;

    public ApiException(ApiErrorCode errorCode) {
        super(errorCode.title());
        this.errorCode = errorCode;
    }

    public ApiException(ApiErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public ApiException(ApiErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
}
