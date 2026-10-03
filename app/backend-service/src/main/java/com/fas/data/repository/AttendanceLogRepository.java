package com.fas.data.repository;

import com.fas.data.entity.AttendanceLog;
import com.fas.data.enums.PunchType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;

/**
 * Spring Data JPA Repository cho thực thể AttendanceLog (DATA-BE-004 - attendance_logs).
 */
@Repository
public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, Long>, AttendanceLogBatchRepository {

    Page<AttendanceLog> findByUserId(Long userId, Pageable pageable);

    Page<AttendanceLog> findByUserIdAndPunchTimestampBetween(
            Long userId, Instant start, Instant end, Pageable pageable);

    Page<AttendanceLog> findByKioskIdAndPunchTimestampBetween(
            String kioskId, Instant start, Instant end, Pageable pageable);

    Page<AttendanceLog> findByPunchTimestampBetween(
            Instant start, Instant end, Pageable pageable);

    boolean existsByUserIdAndPunchTimestampAndPunchType(
            Long userId, Instant punchTimestamp, PunchType punchType);
}
