package com.fas.api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.List;

/**
 * Bộ thẩm định ràng buộc {@link L2Normalized}: tính độ dài Euclid của vector và so khớp
 * với sai số cho phép 1e-4 theo đặc tả enroll-face (APD-BE-001).
 */
public class L2NormalizedValidator implements ConstraintValidator<L2Normalized, List<Float>> {

    private static final double EXPECTED_NORM = 1.0;
    private static final double TOLERANCE = 1e-4;

    @Override
    public boolean isValid(List<Float> vector, ConstraintValidatorContext context) {
        if (vector == null || vector.isEmpty()) {
            return true;
        }

        double sumOfSquares = 0.0;
        for (Float value : vector) {
            if (value == null || !Float.isFinite(value)) {
                return false;
            }
            sumOfSquares += (double) value * value;
        }

        double norm = Math.sqrt(sumOfSquares);
        return Math.abs(norm - EXPECTED_NORM) <= TOLERANCE;
    }
}
