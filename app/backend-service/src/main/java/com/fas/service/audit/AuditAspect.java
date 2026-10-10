package com.fas.service.audit;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.DefaultParameterNameDiscoverer;
import org.springframework.core.ParameterNameDiscoverer;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.lang.reflect.Method;

/**
 * Spring AOP Aspect tự động bắt các sự kiện thay đổi dữ liệu bảng nhạy cảm và ghi vào audit_logs
 * (TASK-BE-017, BLD-BE-015, SOL-BE-007, DD-BE-002, ARC-006, FR-BE-008, NFR-BE-005).
 *
 * <p>Cơ chế hoạt động:
 * <ol>
 *   <li>Đánh chặn các phương thức được đánh dấu bởi {@link Auditable}.</li>
 *   <li>Thu thập trạng thái trước khi thực thi (qua {@link AuditContextHolder} hoặc SpEL {@code beforeState}).</li>
 *   <li>Thực thi phương thức nghiệp vụ.</li>
 *   <li>Thu thập trạng thái sau khi thực thi (từ kết quả trả về hoặc {@link AuditContextHolder#getAfterState()}).</li>
 *   <li>Trích xuất định danh thực thể (từ SpEL {@code entityId}, {@link AuditContextHolder}, hoặc tự động suy luận).</li>
 *   <li>Trích xuất ngữ cảnh tác nhân (từ Spring Security Context) và IP (từ RequestContextHolder).</li>
 *   <li>Lưu bản ghi {@link com.fas.data.entity.AuditLog} bất biến vào cơ sở dữ liệu.</li>
 *   <li>Dọn dẹp {@link AuditContextHolder} trong khối {@code finally}.</li>
 * </ol>
 */
@Slf4j
@Aspect
@Component
public class AuditAspect {

    private final AuditService auditService;
    private final ExpressionParser expressionParser = new SpelExpressionParser();
    private final ParameterNameDiscoverer parameterNameDiscoverer = new DefaultParameterNameDiscoverer();

    public AuditAspect(AuditService auditService) {
        this.auditService = auditService;
    }

    @Around("@annotation(auditable)")
    public Object auditMethod(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            Object[] args = joinPoint.getArgs();
            Object target = joinPoint.getTarget();

            // 1. Thu thập beforeState trước khi method thực thi
            Object beforeState = null;
            if (StringUtils.hasText(auditable.beforeState())) {
                beforeState = evaluateSpel(auditable.beforeState(), method, args, target, null);
            }
            if (beforeState == null) {
                beforeState = AuditContextHolder.getBeforeState();
            }

            // 2. Thực thi phương thức nghiệp vụ
            Object result = joinPoint.proceed();

            try {
                // 3. Xác định entityId
                String entityId = resolveEntityId(auditable.entityId(), method, args, target, result);

                // 4. Xác định beforeState cuối cùng (ưu tiên context holder nếu đã được cập nhật bên trong method)
                if (AuditContextHolder.getBeforeState() != null) {
                    beforeState = AuditContextHolder.getBeforeState();
                }

                // 5. Xác định afterState
                Object afterState = AuditContextHolder.getAfterState();
                if (afterState == null && auditable.includeState()) {
                    afterState = result;
                }

                // 6. Ghi nhật ký kiểm toán bất biến
                auditService.logAudit(
                        auditable.action(),
                        auditable.entityType(),
                        entityId,
                        beforeState,
                        afterState
                );
            } catch (Exception e) {
                log.error("Lỗi khi ghi vết kiểm toán cho hành động '{}' trên thực thể '{}': {}",
                        auditable.action(), auditable.entityType(), e.getMessage(), e);
            }

            return result;
        } finally {
            // 7. Giải phóng ThreadLocal chống rò rỉ bộ nhớ dù thành công hay ném ngoại lệ
            AuditContextHolder.clear();
        }
    }

    /**
     * Phân giải định danh thực thể entityId.
     */
    private String resolveEntityId(String spelExpression, Method method, Object[] args, Object target, Object result) {
        // Ưu tiên 1: Giá trị được đặt tường minh trong AuditContextHolder
        String contextEntityId = AuditContextHolder.getEntityId();
        if (StringUtils.hasText(contextEntityId)) {
            return contextEntityId;
        }

        // Ưu tiên 2: Biểu thức SpEL do annotation chỉ định
        if (StringUtils.hasText(spelExpression)) {
            Object evaluated = evaluateSpel(spelExpression, method, args, target, result);
            if (evaluated != null) {
                return String.valueOf(evaluated);
            }
        }

        // Ưu tiên 3: Tự động trích xuất từ tham số phương thức có tên 'id' hoặc kiểu Long/String đầu tiên
        String[] paramNames = parameterNameDiscoverer.getParameterNames(method);
        if (paramNames != null && args != null) {
            for (int i = 0; i < paramNames.length; i++) {
                String name = paramNames[i].toLowerCase();
                if ((name.endsWith("id") || name.equals("id")) && args[i] != null) {
                    return String.valueOf(args[i]);
                }
            }
            if (args.length > 0 && (args[0] instanceof Long || args[0] instanceof Integer || args[0] instanceof String)) {
                return String.valueOf(args[0]);
            }
        }

        // Ưu tiên 4: Trích xuất từ kết quả trả về nếu có thuộc tính recordId hoặc id
        if (result != null) {
            try {
                Method idMethod = result.getClass().getMethod("recordId");
                Object idVal = idMethod.invoke(result);
                if (idVal != null) {
                    return String.valueOf(idVal);
                }
            } catch (Exception ignored) {
            }
            try {
                Method idMethod = result.getClass().getMethod("getId");
                Object idVal = idMethod.invoke(result);
                if (idVal != null) {
                    return String.valueOf(idVal);
                }
            } catch (Exception ignored) {
            }
        }

        return "N/A";
    }

    /**
     * Đánh giá biểu thức SpEL trên ngữ cảnh phương thức.
     */
    private Object evaluateSpel(String expressionStr, Method method, Object[] args, Object target, Object result) {
        try {
            EvaluationContext context = new StandardEvaluationContext();
            String[] paramNames = parameterNameDiscoverer.getParameterNames(method);
            if (paramNames != null && args != null) {
                for (int i = 0; i < paramNames.length; i++) {
                    context.setVariable(paramNames[i], args[i]);
                }
            }
            context.setVariable("result", result);
            context.setVariable("args", args);
            ((StandardEvaluationContext) context).setRootObject(target);

            return expressionParser.parseExpression(expressionStr).getValue(context);
        } catch (Exception e) {
            log.debug("Không thể đánh giá biểu thức SpEL '{}': {}", expressionStr, e.getMessage());
            return null;
        }
    }
}
