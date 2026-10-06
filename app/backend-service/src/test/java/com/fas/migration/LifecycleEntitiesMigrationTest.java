package com.fas.migration;

import com.fas.data.entity.ConsentWithdrawal;
import com.fas.data.entity.DataSubjectRequest;
import com.fas.data.entity.Notification;
import com.fas.data.entity.PayrollPeriod;
import com.fas.data.entity.RefreshToken;
import com.fas.data.entity.User;
import com.fas.data.enums.DataSubjectRequestStatus;
import com.fas.data.enums.DataSubjectRequestType;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.NotificationEventType;
import com.fas.data.enums.PayrollPeriodStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.ConsentWithdrawalRepository;
import com.fas.data.repository.DataSubjectRequestRepository;
import com.fas.data.repository.NotificationRepository;
import com.fas.data.repository.PayrollPeriodRepository;
import com.fas.data.repository.RefreshTokenRepository;
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
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * TST-BE-032: Kiểm thử Migration V4 & Thực thể Vòng đời.
 * Covers: DATA-BE-021, DATA-BE-022, DATA-BE-023, DATA-BE-024.
 * Realizes: DTD-BE-012, DTD-BE-013, DTD-BE-014, DTD-BE-015.
 *
 * <p>Các ca kiểm thử lược đồ chạy Flyway trực tiếp trên CSDL H2 riêng để chứng minh chính kịch bản
 * {@code V4__add_lifecycle_entities.sql}.
 */
@SpringBootTest
@ActiveProfiles("test")
class LifecycleEntitiesMigrationTest {

    private static final String MIGRATION_LOCATION = "classpath:db/migration";
    private static final List<String> EXPECTED_TABLES = List.of(
            "payroll_periods", "refresh_tokens", "notifications", "consent_withdrawals", "data_subject_requests");
    private static final List<String> EXPECTED_INDEXES = List.of(
            "idx_payroll_period_status",
            "idx_refresh_tokens_user",
            "idx_notifications_user_read",
            "idx_consent_withdrawals_user",
            "idx_data_requests_user_status");

    @Autowired
    private Flyway flyway;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PayrollPeriodRepository payrollPeriodRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ConsentWithdrawalRepository consentWithdrawalRepository;

    @Autowired
    private DataSubjectRequestRepository dataSubjectRequestRepository;

    @Test
    @DisplayName("TST-BE-032: Flyway áp dụng V4 trong profile kiểm thử")
    void v4MigrationIsApplied() {
        assertThat(flyway.info().current()).isNotNull();
        assertThat(flyway.info().current().getVersion())
                .isGreaterThanOrEqualTo(MigrationVersion.fromVersion("4"));
    }

    @Test
    @DisplayName("TST-BE-032: Năm bảng vòng đời và năm chỉ mục mới tồn tại")
    void lifecycleTablesAndIndexesExist() throws SQLException {
        String url = newDatabase("fas_v4_schema");
        migrateTo(url, null);

        List<String> tables = queryStrings(url,
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        assertThat(tables).containsAll(EXPECTED_TABLES);

        List<String> indexes = queryStrings(url,
                "SELECT index_name FROM information_schema.indexes WHERE index_name IS NOT NULL");
        assertThat(indexes).containsAll(EXPECTED_INDEXES);
    }

    @Test
    @DisplayName("TST-BE-032: Kỳ công là duy nhất theo tháng/năm")
    void payrollPeriodIsUniquePerMonth() throws SQLException {
        String url = newDatabase("fas_v4_payroll");
        migrateTo(url, null);

        execute(url, "INSERT INTO payroll_periods (period_year, period_month) VALUES (2026, 9)");
        assertThat(queryLong(url, "SELECT COUNT(*) FROM payroll_periods")).isEqualTo(1L);

        assertThatThrownBy(() -> execute(url, "INSERT INTO payroll_periods (period_year, period_month) VALUES (2026, 9)"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("Unique index or primary key violation")
                .satisfies(ex -> assertThat(((SQLException) ex).getErrorCode()).isEqualTo(23505));
    }

    @Test
    @DisplayName("TST-BE-032: refresh_tokens chỉ lưu băm một chiều")
    void refreshTokenTableStoresOnlyHash() throws SQLException {
        String url = newDatabase("fas_v4_tokens");
        migrateTo(url, null);

        List<String> columns = queryStrings(url,
                "SELECT column_name FROM information_schema.columns WHERE lower(table_name) = 'refresh_tokens'");

        assertThat(columns).contains("token_hash", "expires_at", "revoked_at", "client_ip", "user_agent");
        assertThat(columns).doesNotContain("token", "refresh_token", "plain_token");
    }

    @Test
    @DisplayName("TST-BE-032: Bản ghi cũ được bảo toàn khi nâng cấp lên V4")
    void existingDataSurvivesUpgrade() throws SQLException {
        String url = newDatabase("fas_v4_upgrade");
        migrateTo(url, "3");

        execute(url, "INSERT INTO users (id, employee_code, full_name, email, password_hash) "
                + "VALUES (20, 'EMP-V4-20', 'Nhân sự V4', 'v4@fas.local', 'hash')");
        execute(url, "INSERT INTO kiosks (id, location_name, secret_token_hash) "
                + "VALUES ('KIOSK-V4-01', 'Sảnh V4', 'bcrypt-hash')");
        execute(url, "INSERT INTO attendance_logs (user_id, punch_timestamp, punch_type, verification_method, kiosk_id) "
                + "VALUES (20, CURRENT_TIMESTAMP, 'CHECK_IN', 'VERIFICATION_FACE', 'KIOSK-V4-01')");

        migrateTo(url, null);

        assertThat(queryLong(url, "SELECT COUNT(*) FROM users")).isEqualTo(1L);
        assertThat(queryLong(url, "SELECT COUNT(*) FROM attendance_logs")).isEqualTo(1L);
        for (String table : EXPECTED_TABLES) {
            assertThat(queryLong(url, "SELECT COUNT(*) FROM " + table))
                    .as("Bảng %s phải rỗng sau khi tạo mới", table)
                    .isEqualTo(0L);
        }
    }

    @Test
    @Transactional
    @DisplayName("TST-BE-032: Kỳ công mặc định OPEN và chuyển sang LOCKED kèm người chốt")
    void payrollPeriodLocksWithAuditFields() {
        PayrollPeriod created = payrollPeriodRepository.saveAndFlush(PayrollPeriod.builder()
                .periodYear(2026)
                .periodMonth(9)
                .build());

        assertThat(created.getStatus()).isEqualTo(PayrollPeriodStatus.OPEN);
        assertThat(created.getLockedAt()).isNull();

        User admin = userRepository.saveAndFlush(User.builder()
                .employeeCode("EMP-V4-ADM")
                .fullName("Quản trị V4")
                .email("admin-v4@fas.local")
                .passwordHash("$2a$12$hash")
                .role(Role.ADMIN)
                .status(EmployeeStatus.ACTIVE)
                .build());

        created.setStatus(PayrollPeriodStatus.LOCKED);
        created.setLockedBy(admin);
        created.setLockedAt(Instant.now());
        payrollPeriodRepository.saveAndFlush(created);

        assertThat(payrollPeriodRepository.findByPeriodYearAndPeriodMonth(2026, 9))
                .get()
                .extracting(PayrollPeriod::getStatus)
                .isEqualTo(PayrollPeriodStatus.LOCKED);
        assertThat(payrollPeriodRepository.findByStatus(PayrollPeriodStatus.LOCKED, PageRequest.of(0, 10))
                .getTotalElements()).isEqualTo(1);
    }

    @Test
    @Transactional
    @DisplayName("TST-BE-032: Phiên làm việc thu hồi được theo tài khoản")
    void refreshTokensAreRevocablePerUser() {
        User employee = activeEmployee("EMP-V4-TOK", "token-v4@fas.local");

        RefreshToken first = refreshTokenRepository.saveAndFlush(RefreshToken.builder()
                .user(employee)
                .tokenHash("hash-session-1")
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build());
        refreshTokenRepository.saveAndFlush(RefreshToken.builder()
                .user(employee)
                .tokenHash("hash-session-2")
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build());

        assertThat(refreshTokenRepository.countByUserIdAndRevokedAtIsNull(employee.getId())).isEqualTo(2);
        assertThat(first.isUsable(Instant.now())).isTrue();

        refreshTokenRepository.findByUserIdAndRevokedAtIsNull(employee.getId()).forEach(token -> {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.saveAndFlush(token);
        });

        assertThat(refreshTokenRepository.countByUserIdAndRevokedAtIsNull(employee.getId())).isZero();
        assertThat(refreshTokenRepository.findByTokenHash("hash-session-1"))
                .get()
                .satisfies(token -> assertThat(token.isUsable(Instant.now())).isFalse());
    }

    @Test
    @Transactional
    @DisplayName("TST-BE-032: Thông báo, vết rút Consent và yêu cầu dữ liệu cá nhân lưu đúng trạng thái mặc định")
    void notificationConsentAndDataRequestDefaults() {
        User employee = activeEmployee("EMP-V4-LC", "lifecycle-v4@fas.local");

        Notification notification = notificationRepository.saveAndFlush(Notification.builder()
                .user(employee)
                .eventType(NotificationEventType.ACCOUNT_CREATED)
                .title("Tài khoản đã được tạo")
                .referenceType("USER")
                .referenceId(String.valueOf(employee.getId()))
                .build());
        assertThat(notification.getReadAt()).isNull();
        assertThat(notificationRepository.countByUserIdAndReadAtIsNull(employee.getId())).isEqualTo(1);
        assertThat(notificationRepository.findByUserIdOrderByCreatedAtDesc(employee.getId(), PageRequest.of(0, 10))
                .getTotalElements()).isEqualTo(1);

        ConsentWithdrawal withdrawal = consentWithdrawalRepository.saveAndFlush(ConsentWithdrawal.builder()
                .user(employee)
                .clientIp("10.0.0.9")
                .biometricDisposalDueAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build());
        assertThat(withdrawal.getWithdrawnAt()).isNotNull();
        assertThat(withdrawal.getProcessedAt()).isNull();
        assertThat(consentWithdrawalRepository
                .findByProcessedAtIsNullAndBiometricDisposalDueAtLessThanEqual(Instant.now().plus(8, ChronoUnit.DAYS)))
                .hasSize(1);
        assertThat(consentWithdrawalRepository.findFirstByUserIdOrderByWithdrawnAtDesc(employee.getId())).isPresent();

        DataSubjectRequest request = dataSubjectRequestRepository.saveAndFlush(DataSubjectRequest.builder()
                .user(employee)
                .requestType(DataSubjectRequestType.ACCESS)
                .detail("Đề nghị cung cấp bản sao dữ liệu cá nhân")
                .build());
        assertThat(request.getStatus()).isEqualTo(DataSubjectRequestStatus.RECEIVED);
        assertThat(request.getRespondedAt()).isNull();
        assertThat(dataSubjectRequestRepository.findByStatus(DataSubjectRequestStatus.RECEIVED, PageRequest.of(0, 10))
                .getTotalElements()).isEqualTo(1);
    }

    private User activeEmployee(String employeeCode, String email) {
        return userRepository.saveAndFlush(User.builder()
                .employeeCode(employeeCode)
                .fullName("Nhân sự vòng đời")
                .email(email)
                .passwordHash("$2a$12$hash")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build());
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
