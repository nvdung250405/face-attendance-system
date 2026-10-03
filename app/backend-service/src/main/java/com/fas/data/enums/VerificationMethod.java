package com.fas.data.enums;

/**
 * Phương thức xác thực điểm danh theo DATA-BE-004 và DBL-BE-002.
 */
public enum VerificationMethod {
    VERIFICATION_FACE,
    VERIFICATION_PIN,
    MANUAL_HR,
    FACE_MATCH,
    FALLBACK_PIN,
    HR_OVERRIDE
}
