package com.fas.service.audit;

/**
 * Ngữ cảnh ThreadLocal hỗ trợ truyền tải trạng thái kiểm toán giữa Service và {@link AuditAspect}
 * (SOL-BE-007, DD-BE-002).
 *
 * <p>Cho phép các phương thức Service chủ động chụp trước {@code beforeState}
 * hoặc chỉ định {@code entityId} / {@code afterState} mà không cần thay đổi chữ ký phương thức.</p>
 */
public final class AuditContextHolder {

    private static final ThreadLocal<Object> BEFORE_STATE = new ThreadLocal<>();
    private static final ThreadLocal<Object> AFTER_STATE = new ThreadLocal<>();
    private static final ThreadLocal<String> ENTITY_ID = new ThreadLocal<>();

    private AuditContextHolder() {
    }

    /**
     * Thiết lập trạng thái thực thể trước khi thực hiện chỉnh sửa.
     */
    public static void setBeforeState(Object state) {
        BEFORE_STATE.set(state);
    }

    /**
     * Lấy trạng thái trước chỉnh sửa.
     */
    public static Object getBeforeState() {
        return BEFORE_STATE.get();
    }

    /**
     * Thiết lập trạng thái thực thể sau khi chỉnh sửa (nếu muốn ghi đè giá trị trả về của phương thức).
     */
    public static void setAfterState(Object state) {
        AFTER_STATE.set(state);
    }

    /**
     * Lấy trạng thái sau chỉnh sửa.
     */
    public static Object getAfterState() {
        return AFTER_STATE.get();
    }

    /**
     * Thiết lập định danh thực thể thủ công trong ngữ cảnh luồng.
     */
    public static void setEntityId(String entityId) {
        ENTITY_ID.set(entityId);
    }

    /**
     * Lấy định danh thực thể đã thiết lập thủ công.
     */
    public static String getEntityId() {
        return ENTITY_ID.get();
    }

    /**
     * Dọn dẹp toàn bộ ThreadLocal sau khi Aspect hoàn thành để chống rò rỉ bộ nhớ luồng.
     */
    public static void clear() {
        BEFORE_STATE.remove();
        AFTER_STATE.remove();
        ENTITY_ID.remove();
    }
}
