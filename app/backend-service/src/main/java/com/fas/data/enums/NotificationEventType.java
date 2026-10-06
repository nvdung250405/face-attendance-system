package com.fas.data.enums;

/**
 * Loại sự kiện vòng đời sinh thông báo trong ứng dụng (DATA-BE-023, FR-BE-024, DD-SYS-025).
 */
public enum NotificationEventType {
    ACCOUNT_CREATED,
    SESSION_REVOKED,
    PIN_LOCKED,
    EXCUSE_REQUEST_DECIDED,
    CONSENT_WITHDRAWN,
    PAYROLL_PERIOD_LOCKED,
    DATA_REQUEST_UPDATED
}
