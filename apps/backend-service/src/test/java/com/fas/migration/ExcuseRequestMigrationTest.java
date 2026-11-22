package com.fas.migration;

import com.fas.data.entity.AttendanceLog;
import com.fas.data.entity.ExcuseRequest;
import com.fas.data.entity.Kiosk;
import com.fas.data.entity.User;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.ExcuseRequestStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.Role;
import com.fas.data.enums.VerificationMethod;
import com.fas.data.repository.AttendanceLogRepository;
import com.fas.data.repository.ExcuseRequestRepository;
import com.fas.data.repository.KioskRepository;
import com.fas.data.repository.UserRepository;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * TST-BE-024: Kiểm thử Migration V3 & Chỉ mục Tra cứu.
 * Covers: DATA-BE-017, DATA-BE-018, DATA-BE-019, DATA-BE-020.
 * Realizes: DTD-BE-008, DTD-BE-009, DTD-BE-010, DTD-BE-011.
 *
 * <p>Các ca kiểm thử lược đồ chạy Flyway trực tiếp trên CSDL H2 riêng để chứng minh chính kịch bản
 * {@code V3__add_excuse_requests_and_kiosk_lifecycle.sql}.
 */
@SpringBootTest
@ActiveProfiles("test")
class ExcuseRequestMigrationTest {

    private static final String MIGRATION_LOCATION = "classpath:db/migration";
    private static final List<String> EXPECTED_INDEXES = List.of(
            "idx_excuse_user_status",
            "idx_excuse_status_created",
            "idx_audit_actor",
            "idx_audit_action",
            "idx_enrollment_consent",
            "idx_kiosks_active_ping"
    );

    @Autowired
    private Flyway flyway;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private KioskRepository kioskRepository;

    @Autowired
    private AttendanceLogRepository attendanceLogRepository;

    @Autowired
    private ExcuseRequestRepository excuseRequestRepository;

    @Test
    @DisplayName("TST-BE-024: Flyway áp dụng V3 trong profile kiểm thử")
    void v3MigrationIsApplied() {
        assertThat(flyway.info().current()).isNotNull();
        assertThat(flyway.info().current().getVersion())
                .isGreaterThanOrEqualTo(MigrationVersion.fromVersion("3"));
    }

    @Test
    @DisplayName("TST-BE-024: Bảng excuse_requests có đủ cột theo DTD-BE-009")
    void excuseRequestTableHasExpectedColumns() throws SQLException {
        String url = newDatabase("fas_v3_columns");
        migrateTo(url, null);

        List<String> columns = queryStrings(url,
                "SELECT column_name FROM information_schema.columns WHERE lower(table_name) = 'excuse_requests'");

        assertThat(columns).contains(
                "id", "user_id", "attendance_log_id", "reason", "requested_punch_timestamp", "status",
                "decided_by", "decided_at", "rejection_reason", "created_at", "updated_at");
    }

    @Test
    @DisplayName("TST-BE-024: Sáu chỉ mục tra cứu mới tồn tại sau migration")
    void lookupIndexesExist() throws SQLException {
        String url = newDatabase("fas_v3_indexes");
        migrateTo(url, null);

        List<String> indexes = queryStrings(url,
                "SELECT index_name FROM information_schema.indexes WHERE index_name IS NOT NULL");

        assertThat(indexes).containsAll(EXPECTED_INDEXES);
    }

    @Test
    @DisplayName("TST-BE-024: Bảng kiosks không lưu Secret Token dạng văn bản rõ")
    void kioskTableStoresOnlyHashedSecret() throws SQLException {
        String url = newDatabase("fas_v3_kiosk");
        migrateTo(url, null);

        List<String> columns = queryStrings(url,
                "SELECT column_name FROM information_schema.columns WHERE lower(table_name) = 'kiosks'");

        assertThat(columns).contains("secret_token_hash", "is_active", "last_ping_at");
        assertThat(columns).doesNotContain("secret_token", "token", "secret_token_plain");
    }

    @Test
    @DisplayName("TST-BE-024: Khoá ngoại tới users được thực thi và bản ghi hợp lệ được chấp nhận")
    void foreignKeyIsEnforcedAndValidRowsAccepted() throws SQLException {
        String url = newDatabase("fas_v3_constraints");
        migrateTo(url, null);
        execute(url, "INSERT INTO users (id, employee_code, full_name, email, password_hash) "
                + "VALUES (1, 'EMP-C-01', 'Nhân sự C', 'c@fas.local', 'hash')");

        // Khoá ngoại tới users được thực thi.
        assertThatThrownBy(() -> execute(url, "INSERT INTO excuse_requests (user_id, reason) "
                + "VALUES (999, 'Lý do')"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("Referential integrity constraint violation");

        // Bản ghi hợp lệ được chấp nhận, kể cả khi không nêu tường minh trạng thái (nhận DEFAULT).
        execute(url, "INSERT INTO excuse_requests (user_id, reason) VALUES (1, 'Quên chấm công')");
        execute(url, "INSERT INTO excuse_requests (user_id, reason, status) "
                + "VALUES (1, 'Đi muộn do kẹt xe', 'APPROVED')");
        assertThat(queryLong(url, "SELECT COUNT(*) FROM excuse_requests")).isEqualTo(2L);

        // Giá trị mặc định 'PENDING' được khai báo trong DDL cho mọi môi trường.
        assertThat(queryString(url, "SELECT column_default FROM information_schema.columns "
                + "WHERE lower(table_name) = 'excuse_requests' AND lower(column_name) = 'status'"))
                .containsIgnoringCase("PENDING");
    }

    @Test
    @DisplayName("TST-BE-024: Bản ghi cũ được bảo toàn khi nâng cấp lên V3")
    void existingDataSurvivesUpgrade() throws SQLException {
        String url = newDatabase("fas_v3_upgrade");
        migrateTo(url, "2");

        execute(url, "INSERT INTO users (id, employee_code, full_name, email, password_hash) "
                + "VALUES (10, 'EMP-UP-10', 'Nhân sự nâng cấp', 'upgrade@fas.local', 'hash')");
        execute(url, "INSERT INTO kiosks (id, location_name, secret_token_hash) "
                + "VALUES ('KIOSK-UP-01', 'Sảnh A', 'bcrypt-hash')");
        execute(url, "INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, kiosk_id) "
                + "VALUES (10, CURRENT_TIMESTAMP, 'CHECK_IN', 'VERIFICATION_FACE', 'KIOSK-UP-01')");

        migrateTo(url, null);

        assertThat(queryLong(url, "SELECT COUNT(*) FROM users")).isEqualTo(1L);
        assertThat(queryLong(url, "SELECT COUNT(*) FROM attendance_logs")).isEqualTo(1L);
        assertThat(queryLong(url, "SELECT COUNT(*) FROM excuse_requests")).isEqualTo(0L);
    }

    @Test
    @Transactional
    @DisplayName("TST-BE-024: Thực thể ExcuseRequest lưu, mặc định PENDING và tra cứu được")
    void entityRoundTripDefaultsToPending() {
        User employee = userRepository.saveAndFlush(User.builder()
                .employeeCode("EMP-EXC-01")
                .fullName("Nhân sự đơn")
                .email("excuse@fas.local")
                .passwordHash("$2a$12$hash")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build());

        Kiosk kiosk = kioskRepository.saveAndFlush(Kiosk.builder()
                .id("KIOSK-T3-01")
                .locationName("Sảnh kiểm thử")
                .secretTokenHash("bcrypt-hash")
                .build());

        AttendanceLog log = attendanceLogRepository.saveAndFlush(AttendanceLog.builder()
                .user(employee)
                .punchTimestamp(Instant.now())
                .punchType(PunchType.CHECK_IN)
                .verificationMethod(VerificationMethod.VERIFICATION_FACE)
                .kiosk(kiosk)
                .status(AttendanceStatus.ON_TIME)
                .build());

        ExcuseRequest saved = excuseRequestRepository.saveAndFlush(ExcuseRequest.builder()
                .user(employee)
                .attendanceLog(log)
                .reason("Máy quét lỗi, đã chấm nhưng không ghi nhận")
                .requestedPunchTimestamp(Timestamp.from(Instant.now()).toInstant())
                .build());

        assertThat(saved.getStatus()).isEqualTo(ExcuseRequestStatus.PENDING);
        assertThat(saved.getDecidedAt()).isNull();
        assertThat(saved.getCreatedAt()).isNotNull();

        assertThat(excuseRequestRepository.findByUserId(employee.getId(), PageRequest.of(0, 10)).getTotalElements())
                .isEqualTo(1);
        assertThat(excuseRequestRepository.findByStatus(ExcuseRequestStatus.PENDING, PageRequest.of(0, 10))
                .getTotalElements()).isEqualTo(1);
        assertThat(excuseRequestRepository
                .findByAttendanceLogIdAndStatus(log.getId(), ExcuseRequestStatus.PENDING)).isPresent();
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

    private List<String> queryStrings(String url, String sql) throws SQLException {        List<String> values = new ArrayList<>();
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
