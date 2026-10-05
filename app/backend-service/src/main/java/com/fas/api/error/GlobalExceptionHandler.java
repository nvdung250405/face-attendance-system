package com.fas.api.error;

import com.fas.api.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Bộ xử lý lỗi toàn cục của tầng REST: chuyển mọi lỗi validation, lỗi phân quyền và lỗi hệ thống
 * về cấu trúc RFC 7807 ProblemDetails thống nhất kèm mã lỗi {@code code} và chi tiết trường vi phạm
 * {@code invalidParams} (APD-BE-004, API-BE-016, DD-BE-009).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final String INVALID_PARAMS_DETAIL = "Dữ liệu request không thỏa mãn ràng buộc.";
    private static final String MALFORMED_BODY_DETAIL = "Nội dung request không đọc được (JSON sai định dạng hoặc sai kiểu dữ liệu).";
    private static final String INVALID_PARAM_TYPE_DETAIL = "Tham số request sai kiểu dữ liệu.";
    private static final String MISSING_BINDING_DETAIL = "Thiếu tham số hoặc header bắt buộc của request.";
    private static final String RESOURCE_NOT_FOUND_DETAIL = "Không tìm thấy tài nguyên được yêu cầu.";
    private static final String METHOD_NOT_ALLOWED_DETAIL = "Phương thức HTTP không được hỗ trợ cho tài nguyên này.";
    private static final String UNSUPPORTED_MEDIA_TYPE_DETAIL = "Định dạng nội dung request không được hỗ trợ.";
    private static final String ACCESS_DENIED_DETAIL = "Tài khoản không có quyền thực hiện thao tác này.";
    private static final String INTERNAL_ERROR_DETAIL = "Lỗi hệ thống nội bộ.";

    /**
     * Xử lý vi phạm validation của Request Body ({@code @Valid @RequestBody}).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpServletRequest request) {
        return problemDetail(ApiErrorCode.VALIDATION_FAILED, INVALID_PARAMS_DETAIL,
                extractInvalidParams(ex.getBindingResult().getFieldErrors(), ex.getBindingResult().getGlobalErrors()),
                request);
    }

    /**
     * Xử lý vi phạm ràng buộc khi bind tham số request vào đối tượng model (query parameters).
     */
    @ExceptionHandler(BindException.class)
    public ProblemDetail handleBindException(BindException ex, HttpServletRequest request) {
        return problemDetail(ApiErrorCode.VALIDATION_FAILED, INVALID_PARAMS_DETAIL,
                extractInvalidParams(ex.getBindingResult().getFieldErrors(), ex.getBindingResult().getGlobalErrors()),
                request);
    }

    /**
     * Xử lý vi phạm ràng buộc khai báo trực tiếp trên tham số phương thức controller
     * ({@code @RequestParam}, {@code @PathVariable}).
     */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ProblemDetail handleHandlerMethodValidation(HandlerMethodValidationException ex, HttpServletRequest request) {
        List<InvalidParam> invalidParams = new ArrayList<>();
        ex.getParameterValidationResults().forEach(result -> {
            String parameterName = result.getMethodParameter().getParameterName();
            result.getResolvableErrors().forEach(error ->
                    invalidParams.add(new InvalidParam(parameterName, error.getDefaultMessage())));
        });
        ex.getCrossParameterValidationResults().forEach(error ->
                invalidParams.add(new InvalidParam(ex.getMethod().getName(), error.getDefaultMessage())));

        return problemDetail(ApiErrorCode.VALIDATION_FAILED, INVALID_PARAMS_DETAIL, invalidParams, request);
    }

    /**
     * Xử lý tham số truyền sai kiểu dữ liệu (Ví dụ: {@code page=abc}).
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String reason = "Giá trị '%s' không hợp lệ cho tham số '%s'".formatted(ex.getValue(), ex.getName());
        return problemDetail(ApiErrorCode.VALIDATION_FAILED, INVALID_PARAM_TYPE_DETAIL,
                List.of(new InvalidParam(ex.getName(), reason)), request);
    }

    /**
     * Xử lý Request Body không đọc được (JSON sai định dạng, sai kiểu trường).
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleHttpMessageNotReadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        logger.warn("Nội dung request không đọc được tại {}: {}", request.getRequestURI(), ex.getMessage());
        return problemDetail(ApiErrorCode.VALIDATION_FAILED, MALFORMED_BODY_DETAIL, List.of(), request);
    }

    /**
     * Xử lý thiếu tham số truy vấn hoặc header bắt buộc ({@code X-Kiosk-Id}).
     */
    @ExceptionHandler(ServletRequestBindingException.class)
    public ProblemDetail handleServletRequestBinding(ServletRequestBindingException ex, HttpServletRequest request) {
        List<InvalidParam> invalidParams = new ArrayList<>();
        if (ex instanceof MissingServletRequestParameterException missingParameter) {
            invalidParams.add(new InvalidParam(missingParameter.getParameterName(),
                    "Thiếu tham số bắt buộc '%s'".formatted(missingParameter.getParameterName())));
        } else if (ex instanceof MissingRequestHeaderException missingHeader) {
            invalidParams.add(new InvalidParam(missingHeader.getHeaderName(),
                    "Thiếu header bắt buộc '%s'".formatted(missingHeader.getHeaderName())));
        }

        return problemDetail(ApiErrorCode.VALIDATION_FAILED, MISSING_BINDING_DETAIL, invalidParams, request);
    }

    /**
     * Xử lý tài nguyên không tồn tại: giữ đúng HTTP 404 thay vì bị lưới an toàn chuyển thành lỗi 500.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ProblemDetail handleNoResourceFound(NoResourceFoundException ex, HttpServletRequest request) {
        logger.warn("Không tìm thấy tài nguyên {}: {}", request.getRequestURI(), ex.getMessage());
        return problemDetail(ApiErrorCode.RESOURCE_NOT_FOUND, RESOURCE_NOT_FOUND_DETAIL, List.of(), request);
    }

    /**
     * Xử lý phương thức HTTP không được hỗ trợ cho tài nguyên.
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ProblemDetail handleMethodNotSupported(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        logger.warn("Phương thức {} không được hỗ trợ tại {}", ex.getMethod(), request.getRequestURI());
        return problemDetail(ApiErrorCode.METHOD_NOT_ALLOWED, METHOD_NOT_ALLOWED_DETAIL, List.of(), request);
    }

    /**
     * Xử lý định dạng nội dung request không được hỗ trợ.
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ProblemDetail handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        logger.warn("Định dạng nội dung không được hỗ trợ tại {}: {}", request.getRequestURI(), ex.getMessage());
        return problemDetail(ApiErrorCode.UNSUPPORTED_MEDIA_TYPE, UNSUPPORTED_MEDIA_TYPE_DETAIL, List.of(), request);
    }

    /**
     * Xử lý truy cập vượt quá quyền hạn của tài khoản (Role Guard).
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        logger.warn("Từ chối truy cập {}: {}", request.getRequestURI(), ex.getMessage());
        return problemDetail(ApiErrorCode.ACCESS_DENIED, ACCESS_DENIED_DETAIL, List.of(), request);
    }

    /**
     * Lưới an toàn cuối cùng: không để lộ chi tiết kỹ thuật của lỗi hệ thống ra ngoài.
     */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpectedException(Exception ex, HttpServletRequest request) {
        logger.error("Lỗi hệ thống ngoài dự kiến tại {}", request.getRequestURI(), ex);
        return problemDetail(ApiErrorCode.INTERNAL_SERVER_ERROR, INTERNAL_ERROR_DETAIL, List.of(), request);
    }

    private List<InvalidParam> extractInvalidParams(List<FieldError> fieldErrors, List<ObjectError> globalErrors) {
        List<InvalidParam> invalidParams = new ArrayList<>();
        fieldErrors.forEach(fieldError ->
                invalidParams.add(new InvalidParam(fieldError.getField(), fieldError.getDefaultMessage())));
        globalErrors.forEach(objectError ->
                invalidParams.add(new InvalidParam(objectError.getObjectName(), objectError.getDefaultMessage())));
        return invalidParams;
    }

    private ProblemDetail problemDetail(ApiErrorCode code, String detail, List<InvalidParam> invalidParams,
                                        HttpServletRequest request) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(code.status(), detail);
        problemDetail.setType(URI.create(code.problemType()));
        problemDetail.setTitle(code.title());
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        problemDetail.setProperty("code", code.name());
        // Trường `message` giữ tương thích với máy khách Kiosk hiện hành (đọc message/code khi gặp lỗi).
        problemDetail.setProperty("message", detail);
        problemDetail.setProperty("timestamp", OffsetDateTime.now(ApiResponse.VIETNAM_ZONE));

        List<InvalidParam> distinctInvalidParams = invalidParams.stream().distinct().toList();
        if (!distinctInvalidParams.isEmpty()) {
            problemDetail.setProperty("invalidParams", distinctInvalidParams);
        }

        return problemDetail;
    }
}
