package com.fas.migration;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TST-BE-DAT-001: Kiểm thử Kịch bản Flyway Migration V1.
 * Đảm bảo Flyway tự động migrate thành công và tạo đủ 8 bảng CSDL theo DTD-BE-001 / DBL-BE-001.
 */
@SpringBootTest
@ActiveProfiles("test")
class FlywayMigrationTest {

    @Autowired(required = false)
    private Flyway flyway;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final List<String> EXPECTED_TABLES = List.of(
            "users",
            "shifts",
            "employee_shifts",
            "kiosks",
            "biometric_templates",
            "attendance_logs",
            "enrollment_sessions",
            "audit_logs"
    );

    @Test
    @DisplayName("TST-BE-DAT-001: Flyway bean được cấu hình và migration V1 thành công")
    void flywayMigrationShouldSucceed() {
        assertThat(flyway).isNotNull();

        MigrationInfo current = flyway.info().current();
        assertThat(current).isNotNull();
        assertThat(current.getState().isApplied()).isTrue();

        // Phiên bản hiện tại phải là migration mới nhất có trên classpath (V1, V2, ... khi bổ sung).
        MigrationInfo[] all = flyway.info().all();
        assertThat(all).isNotEmpty();
        assertThat(current.getVersion()).isEqualTo(all[all.length - 1].getVersion());
        assertThat(current.getVersion()).isGreaterThanOrEqualTo(MigrationVersion.fromVersion("2"));
    }

    @Test
    @DisplayName("TST-BE-DAT-001: 8 bảng CSDL theo đặc tả DTD-BE-001 tồn tại đầy đủ")
    void allEightTablesShouldExist() throws Exception {
        Set<String> existingTables = new HashSet<>();

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            try (ResultSet rs = metaData.getTables(null, null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    existingTables.add(rs.getString("TABLE_NAME").toLowerCase());
                }
            }
        }

        for (String expectedTable : EXPECTED_TABLES) {
            assertThat(existingTables)
                    .as("Bảng %s phải được tạo bởi Flyway V1", expectedTable)
                    .contains(expectedTable);
        }
    }

    @Test
    @DisplayName("TST-BE-DAT-001: Có thể truy vấn schema của tất cả các bảng")
    void shouldBeAbleToQueryAllTables() {
        for (String table : EXPECTED_TABLES) {
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
            assertThat(count).isNotNull().isEqualTo(0);
        }
    }
}
