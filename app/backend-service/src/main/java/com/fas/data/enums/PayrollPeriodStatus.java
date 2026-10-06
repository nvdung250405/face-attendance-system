package com.fas.data.enums;

/**
 * Trạng thái kỳ công theo tháng (DATA-BE-021, DTD-BE-012).
 *
 * <p>Kỳ {@code LOCKED} từ chối mọi điều chỉnh công và đơn giải trình thuộc kỳ đó (FR-BE-021).
 */
public enum PayrollPeriodStatus {
    OPEN,
    LOCKED
}
