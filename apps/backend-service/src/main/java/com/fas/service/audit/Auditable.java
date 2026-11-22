package com.fas.service.audit;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation đánh dấu phương thức nghiệp vụ cần ghi vết kiểm toán bất biến (Immutable Audit Log)
 * thông qua Spring AOP Interceptor (SOL-BE-007, DD-BE-002, ARC-006, FR-BE-008, NFR-BE-005).
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Auditable {

    /**
     * Tên hành vi kiểm toán (ví dụ: "UPDATE_ATTENDANCE", "UPDATE_EMPLOYEE", "CHANGE_ROLE", "APPROVE_EXCUSE_REQUEST").
     */
    String action();

    /**
     * Loại thực thể bị tác động (ví dụ: "ATTENDANCE_LOG", "USER", "EXCUSE_REQUEST").
     */
    String entityType();

    /**
     * Biểu thức SpEL tùy chọn để trích xuất entityId từ tham số phương thức hoặc kết quả trả về (#result).
     * Ví dụ: "#id", "#logId", "#request.employeeId", "#result.recordId".
     * Nếu để trống, Aspect sẽ tự động tìm tham số có tên hoặc kiểu phù hợp, hoặc lấy từ {@link AuditContextHolder}.
     */
    String entityId() default "";

    /**
     * Biểu thức SpEL tùy chọn để trích xuất beforeState trước khi thực thi phương thức.
     * Nếu để trống, Aspect sẽ lấy từ {@link AuditContextHolder#getBeforeState()}.
     */
    String beforeState() default "";

    /**
     * Có tuần tự hóa trạng thái trước/sau (beforeState / afterState) sang JSON hay không.
     */
    boolean includeState() default true;
}
