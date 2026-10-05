package com.fas.api.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Ràng buộc kiểm tra vector ArcFace 512D đã được chuẩn hóa L2 (độ dài Euclid = 1.0 ± 1e-4)
 * theo hợp đồng {@code POST /api/v1/kiosk/enroll-face} (APD-BE-001).
 * Giá trị {@code null} hoặc rỗng được bỏ qua, để các ràng buộc {@code @NotNull}/{@code @Size} xử lý.
 */
@Documented
@Constraint(validatedBy = L2NormalizedValidator.class)
@Target({ElementType.METHOD, ElementType.FIELD, ElementType.ANNOTATION_TYPE, ElementType.CONSTRUCTOR,
        ElementType.PARAMETER, ElementType.TYPE_USE})
@Retention(RetentionPolicy.RUNTIME)
public @interface L2Normalized {

    String message() default "Vector 512D phải được chuẩn hóa L2 = 1.0 ± 1e-4";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
