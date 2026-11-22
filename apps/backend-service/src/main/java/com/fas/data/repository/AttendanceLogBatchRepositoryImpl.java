package com.fas.data.repository;

import com.fas.data.entity.AttendanceLog;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

/**
 * Triển khai native batch insert cho AttendanceLog sử dụng JdbcTemplate.
 */
@Repository
public class AttendanceLogBatchRepositoryImpl implements AttendanceLogBatchRepository {

    private final JdbcTemplate jdbcTemplate;

    public AttendanceLogBatchRepositoryImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private Boolean isPostgres;

    private boolean isPostgreSql() {
        if (isPostgres == null) {
            try {
                if (jdbcTemplate.getDataSource() != null) {
                    try (java.sql.Connection conn = jdbcTemplate.getDataSource().getConnection()) {
                        String productName = conn.getMetaData().getDatabaseProductName();
                        isPostgres = productName != null && productName.toLowerCase().contains("postgres");
                    }
                } else {
                    isPostgres = false;
                }
            } catch (Exception e) {
                isPostgres = false;
            }
        }
        return Boolean.TRUE.equals(isPostgres);
    }

    private String getBatchInsertSql() {
        if (isPostgreSql()) {
            return "INSERT INTO attendance_logs (" +
                    "   user_id, punch_timestamp, punch_type, verification_method, " +
                    "   confidence_score, kiosk_id, status, late_minutes, is_offline_sync, created_at" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                    "ON CONFLICT (user_id, punch_timestamp, punch_type) DO NOTHING";
        } else {
            return "MERGE INTO attendance_logs (" +
                    "   user_id, punch_timestamp, punch_type, verification_method, " +
                    "   confidence_score, kiosk_id, status, late_minutes, is_offline_sync, created_at" +
                    ") KEY (user_id, punch_timestamp, punch_type) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        }
    }

    @Override
    public int batchInsertOfflineLogs(List<AttendanceLog> logs) {
        if (logs == null || logs.isEmpty()) {
            return 0;
        }

        int[][] results = jdbcTemplate.batchUpdate(
                getBatchInsertSql(),
                logs,
                logs.size(),
                (PreparedStatement ps, AttendanceLog log) -> {
                    ps.setLong(1, log.getUser().getId());
                    ps.setTimestamp(2, Timestamp.from(log.getPunchTimestamp()));
                    ps.setString(3, log.getPunchType().name());
                    ps.setString(4, log.getVerificationMethod().name());

                    if (log.getConfidenceScore() != null) {
                        ps.setBigDecimal(5, log.getConfidenceScore());
                    } else {
                        ps.setNull(5, java.sql.Types.NUMERIC);
                    }

                    ps.setString(6, log.getKiosk().getId());
                    ps.setString(7, log.getStatus().name());
                    ps.setInt(8, log.getLateMinutes() != null ? log.getLateMinutes() : 0);
                    ps.setBoolean(9, log.getIsOfflineSync() != null ? log.getIsOfflineSync() : false);

                    Instant createdAt = log.getCreatedAt() != null ? log.getCreatedAt() : Instant.now();
                    ps.setTimestamp(10, Timestamp.from(createdAt));
                }
        );

        int totalAffected = 0;
        for (int[] batchResult : results) {
            for (int count : batchResult) {
                if (count > 0) {
                    totalAffected += count;
                }
            }
        }
        return totalAffected;
    }
}
