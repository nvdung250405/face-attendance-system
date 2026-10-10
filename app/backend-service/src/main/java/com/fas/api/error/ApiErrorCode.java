package com.fas.api.error;

import org.springframework.http.HttpStatus;

import java.util.Locale;

/**
 * Từ điển mã lỗi toàn hệ thống theo Mục 6 của api-design.md (APD-BE-004, API-BE-016, DD-BE-009).
 * Mỗi mã lỗi gắn liền với HTTP Status, tiêu đề hiển thị và URI định danh loại lỗi RFC 7807.
 */
public enum ApiErrorCode {

    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Đăng nhập thất bại"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "Token hết hạn"),
    KIOSK_UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Trạm Kiosk chưa cấp phép"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "Không đủ quyền"),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ"),
    DATA_INTEGRITY_VIOLATION(HttpStatus.BAD_REQUEST, "Lỗi toàn vẹn dữ liệu"),
    INVALID_VECTOR_DIMENSION(HttpStatus.BAD_REQUEST, "Sai kích thước vector"),
    OTP_INVALID(HttpStatus.BAD_REQUEST, "Mã OTP không đúng"),
    OTP_EXPIRED(HttpStatus.BAD_REQUEST, "Mã OTP đã hết hạn"),
    COOLDOWN_ACTIVE(HttpStatus.CONFLICT, "Chống quẹt trùng lặp"),
    OTP_ALREADY_USED(HttpStatus.CONFLICT, "Mã OTP đã sử dụng"),
    EMPLOYEE_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy nhân sự"),
    EMPLOYEE_ALREADY_EXISTS(HttpStatus.CONFLICT, "Mã nhân viên hoặc email đã tồn tại"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy tài nguyên"),
    PIN_INVALID(HttpStatus.UNAUTHORIZED, "Mã PIN không đúng"),
    PIN_LOCKED(HttpStatus.LOCKED, "Mã PIN đang bị khóa"),
    SHIFT_OVERLAPPING(HttpStatus.CONFLICT, "Khoảng thời gian phân ca bị chồng lấn"),
    SHIFT_IN_USE(HttpStatus.CONFLICT, "Ca làm việc đang được phân công"),
    EXCUSE_ALREADY_PENDING(HttpStatus.CONFLICT, "Lượt điểm danh đã có đơn giải trình đang chờ xử lý"),
    EXCUSE_ALREADY_PROCESSED(HttpStatus.CONFLICT, "Đơn giải trình đã được xử lý"),
    EXCUSE_WINDOW_EXPIRED(HttpStatus.BAD_REQUEST, "Đã quá thời hạn 30 ngày để nộp đơn giải trình"),
    PERIOD_LOCKED(HttpStatus.CONFLICT, "Kỳ công đã chốt"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "Phương thức không được hỗ trợ"),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Định dạng nội dung không được hỗ trợ"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống nội bộ");

    private static final String PROBLEM_TYPE_BASE = "https://fas.company.com/errors/";

    private final HttpStatus status;
    private final String title;

    ApiErrorCode(HttpStatus status, String title) {
        this.status = status;
        this.title = title;
    }

    /**
     * HTTP Status tương ứng của mã lỗi.
     */
    public HttpStatus status() {
        return status;
    }

    /**
     * Tiêu đề lỗi thân thiện hiển thị cho client.
     */
    public String title() {
        return title;
    }

    /**
     * URI định danh loại lỗi theo RFC 7807 (Ví dụ: {@code https://fas.company.com/errors/otp-invalid}).
     */
    public String problemType() {
        return PROBLEM_TYPE_BASE + name().toLowerCase(Locale.ROOT).replace('_', '-');
    }
}
