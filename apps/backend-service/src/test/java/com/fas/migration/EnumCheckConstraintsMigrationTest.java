package com.fas.migration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * TST-BE-DAT-010: Kiểm thử Kịch bản Flyway Migration V10.
 * Đảm bảo các ràng buộc CHECK CONSTRAINT chặn đứng các giá trị enum không hợp lệ tại tầng CSDL.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EnumCheckConstraintsMigrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("V10: Ràng buộc chk_users_status phải chặn giá trị status không hợp lệ")
    void shouldRejectInvalidUserStatus() {
        assertThatThrownBy(() -> jdbcTemplate.execute(
                "INSERT INTO users (employee_code, full_name, email, password_hash, role, status) " +
                "VALUES ('TEST-ERR-1', 'Test Error', 'tester1@fas.com', 'pwd', 'EMPLOYEE', 'CONSENT_WITHDRAWN')"
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("V10: Ràng buộc chk_attendance_verification_method phải chặn giá trị verification_method không hợp lệ")
    void shouldRejectInvalidVerificationMethod() {
        assertThatThrownBy(() -> jdbcTemplate.execute(
                "INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, kiosk_id, status) " +
                "VALUES (1, CURRENT_TIMESTAMP, 'CHECK_IN', 'FACE', 'KIOSK-01', 'ON_TIME')"
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("V10: Ràng buộc chk_users_role phải chặn giá trị role không hợp lệ")
    void shouldRejectInvalidUserRole() {
        assertThatThrownBy(() -> jdbcTemplate.execute(
                "INSERT INTO users (employee_code, full_name, email, password_hash, role, status) " +
                "VALUES ('TEST-ERR-2', 'Test Error 2', 'tester2@fas.com', 'pwd', 'INVALID_ROLE', 'ACTIVE')"
        )).isInstanceOf(DataIntegrityViolationException.class);
    }
}
