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
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TST-BE-022: Kiểm thử Migration V2 & Trạng thái Xác thực.
 * TST-BE-039: Kiểm thử Migration V5 Gỡ bỏ Cờ Buộc đổi Mật khẩu.
 * Covers: DATA-BE-016, DATA-BE-012. Realizes: DTD-BE-007, DATA-SYS-016.
 *
 * <p>Các ca kiểm thử lược đồ chạy Flyway trực tiếp trên CSDL H2 riêng để chứng minh chính các kịch bản
 * migration, thay vì dựa vào lược đồ do Hibernate sinh ra.
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
    @DisplayName("TST-BE-022: Chuỗi migration đã áp dụng V2 và V5 trong profile kiểm thử")
    void credentialMigrationsAreApplied() {
        List<String> applied = Arrays.stream(flyway.info().applied())
                .map(info -> info.getVersion().getVersion())
                .toList();

        assertThat(applied).contains("1", "2", "5");
        assertThat(flyway.info().current()).isNotNull();
        assertThat(flyway.info().current().getVersion()).isGreaterThanOrEqualTo(MigrationVersion.fromVersion("5"));
    }

    @Test
    @DisplayName("TST-BE-039: Migration V5 gỡ cột must_change_password và bảo toàn bản ghi cũ")
    void v5RemovesForcedPasswordChangeColumn() throws SQLException {
        String url = newDatabase("fas_v5_drop");
        migrateTo(url, "4");
        execute(url, "INSERT INTO users (id, employee_code, full_name, email, password_hash, pin_hash) "
                + "VALUES (30, 'EMP-V5-30', 'Nhân sự V5', 'v5@fas.local', 'hash-mat-khau', 'hash-pin')");

        assertThat(userColumns(url))
                .as("Trước V5, cột cờ buộc đổi mật khẩu vẫn tồn tại do V2 tạo")
                .contains("must_change_password");

        migrateTo(url, null);

        assertThat(userColumns(url))
                .as("Lược đồ sau cùng không còn cờ buộc đổi mật khẩu")
                .doesNotContain("must_change_password");
        assertThat(queryLong(url, "SELECT COUNT(*) FROM users")).isEqualTo(1L);
        assertThat(queryString(url, "SELECT password_hash FROM users WHERE employee_code = 'EMP-V5-30'"))
                .isEqualTo("hash-mat-khau");
        assertThat(queryString(url, "SELECT pin_hash FROM users WHERE employee_code = 'EMP-V5-30'"))
                .isEqualTo("hash-pin");
    }

    @Test
    @DisplayName("TST-BE-022: Bản ghi cũ được bảo toàn khi nâng cấp từ V1 lên lược đồ hiện hành")
    void legacyRowsSurviveFullUpgrade() throws SQLException {
        String url = newDatabase("fas_credential_upgrade");
        migrateTo(url, "1");
        execute(url, "INSERT INTO users (id, employee_code, full_name, email, password_hash, pin_hash) "
                + "VALUES (31, 'EMP-CU-31', 'Nhân sự cũ', 'cu@fas.local', 'hash-cu', 'pin-cu')");

        migrateTo(url, null);

        assertThat(queryLong(url, "SELECT COUNT(*) FROM users")).isEqualTo(1L);
        assertThat(queryString(url, "SELECT password_hash FROM users WHERE employee_code = 'EMP-CU-31'"))
                .isEqualTo("hash-cu");
        assertThat(queryString(url, "SELECT email FROM users WHERE employee_code = 'EMP-CU-31'"))
                .isEqualTo("cu@fas.local");
    }

    @Test
    @Transactional
    @DisplayName("TST-BE-022: Thực thể User lưu mật khẩu băm, PIN băm và mốc khóa PIN")
    void entityPersistsCredentialState() {
        Instant lockedUntil = Instant.now().plus(15, ChronoUnit.MINUTES);

        User created = userRepository.saveAndFlush(User.builder()
                .employeeCode("EMP-CRED-01")
                .fullName("Nhân sự xác thực")
                .email("credential@fas.local")
                .passwordHash("$2a$12$matkhau")
                .pinHash("$2a$12$pin")
                .pinLockedUntil(lockedUntil)
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build());

        assertThat(userRepository.findById(created.getId()))
                .get()
                .satisfies(stored -> {
                    assertThat(stored.getPasswordHash()).isEqualTo("$2a$12$matkhau");
                    assertThat(stored.getPinHash()).isEqualTo("$2a$12$pin");
                    assertThat(stored.getPinLockedUntil()).isEqualTo(lockedUntil);
                });
    }

    private List<String> userColumns(String url) throws SQLException {
        return queryStrings(url,
                "SELECT column_name FROM information_schema.columns WHERE lower(table_name) = 'users'");
    }

    private static String newDatabase(String name) {
        return "jdbc:h2:mem:" + name + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
    }

    private void migrateTo(String url, String targetVersion) {
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

    private long queryLong(String url, String sql) throws SQLException {
        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            assertThat(resultSet.next()).isTrue();
            return resultSet.getLong(1);
        }
    }

    private String queryString(String url, String sql) throws SQLException {
        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            assertThat(resultSet.next()).isTrue();
            return resultSet.getString(1);
        }
    }

    private List<String> queryStrings(String url, String sql) throws SQLException {
        List<String> values = new ArrayList<>();
        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            while (resultSet.next()) {
                values.add(resultSet.getString(1).toLowerCase());
            }
        }
        return values;
    }
}
