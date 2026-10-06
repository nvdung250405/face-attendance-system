package com.fas.migration;

import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.UserRepository;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * TST-BE-022: Kiểm thử Migration V2 & Ràng buộc Trạng thái Xác thực.
 * Covers: DATA-BE-016, DATA-BE-012. Realizes: DTD-BE-007, DATA-SYS-016.
 *
 * <p>Các ca kiểm thử migration chạy Flyway trực tiếp trên CSDL H2 riêng để chứng minh chính kịch bản
 * {@code V2__add_credential_lifecycle.sql} tạo cột, thay vì dựa vào lược đồ do Hibernate sinh ra.
 */
@SpringBootTest
@ActiveProfiles("test")
class CredentialStateMigrationTest {

    private static final String MIGRATION_LOCATION = "classpath:db/migration";

    @Autowired
    private Flyway flyway;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("TST-BE-022: Flyway áp dụng V2 trong profile kiểm thử")
    void v2MigrationIsApplied() {
        assertThat(flyway.info().current()).isNotNull();
        assertThat(flyway.info().current().getVersion())
                .isGreaterThanOrEqualTo(MigrationVersion.fromVersion("2"));
    }

    @Test
    @DisplayName("TST-BE-022: Bản ghi cũ giữ cờ FALSE và giá trị mặc định của cột là FALSE")
    void legacyRowsAndDefaultKeepFlagFalse() throws SQLException {
        String url = "jdbc:h2:mem:fas_v2_legacy;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
        migrateTo(url, "1");

        // Bản ghi tồn tại trước khi nâng cấp lên V2 (không có cột must_change_password).
        execute(url, "INSERT INTO users (employee_code, full_name, email, password_hash) "
                + "VALUES ('EMP-LEGACY-01', 'Nhân sự cũ', 'legacy@fas.local', 'hash')");

        migrateTo(url, null);

        assertThat(queryBoolean(url, "SELECT must_change_password FROM users WHERE employee_code = 'EMP-LEGACY-01'"))
                .as("Bản ghi cũ phải giữ cờ buộc đổi mật khẩu = FALSE sau khi nâng cấp")
                .isFalse();

        // Bản ghi mới chèn không nêu cột cũng nhận giá trị mặc định FALSE.
        execute(url, "INSERT INTO users (employee_code, full_name, email, password_hash) "
                + "VALUES ('EMP-NEW-01', 'Nhân sự mới', 'new@fas.local', 'hash')");
        assertThat(queryBoolean(url, "SELECT must_change_password FROM users WHERE employee_code = 'EMP-NEW-01'"))
                .as("Giá trị mặc định của cột phải là FALSE (DTD-BE-007)")
                .isFalse();
    }

    @Test
    @DisplayName("TST-BE-022: Cột must_change_password là NOT NULL theo kịch bản migration")
    void columnIsNotNull() throws SQLException {
        String url = "jdbc:h2:mem:fas_v2_notnull;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
        migrateTo(url, null);

        assertThatThrownBy(() -> execute(url,
                "INSERT INTO users (employee_code, full_name, email, password_hash, must_change_password) "
                        + "VALUES ('EMP-NULL-01', 'Thiếu cờ', 'null@fas.local', 'hash', NULL)"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("NULL");
    }

    @Test
    @Transactional
    @DisplayName("TST-BE-022: Thực thể User ánh xạ và xoá được cờ buộc đổi mật khẩu")
    void entityPersistsAndClearsTheFlag() {
        User created = userRepository.saveAndFlush(User.builder()
                .employeeCode("EMP-FLAG-01")
                .fullName("Nhân sự cờ")
                .email("flag@fas.local")
                .passwordHash("$2a$12$hash")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.PENDING_CONSENT)
                .mustChangePassword(true)
                .build());

        assertThat(userRepository.findById(created.getId()))
                .get()
                .extracting(User::getMustChangePassword)
                .isEqualTo(true);

        created.setMustChangePassword(false);
        userRepository.saveAndFlush(created);

        assertThat(userRepository.findById(created.getId()))
                .get()
                .extracting(User::getMustChangePassword)
                .isEqualTo(false);
    }

    private void migrateTo(String url, String targetVersion) throws SQLException {
        var configuration = Flyway.configure()
                .dataSource(url, "sa", "")
                .locations(MIGRATION_LOCATION);
        if (targetVersion != null) {
            configuration.target(MigrationVersion.fromVersion(targetVersion));
        }
        configuration.load().migrate();
    }

    private void execute(String url, String sql) throws SQLException {
        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private boolean queryBoolean(String url, String sql) throws SQLException {
        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            assertThat(resultSet.next()).isTrue();
            return resultSet.getBoolean(1);
        }
    }
}
