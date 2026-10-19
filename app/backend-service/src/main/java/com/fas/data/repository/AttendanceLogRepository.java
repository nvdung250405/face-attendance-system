package com.fas.data.repository;

import com.fas.data.entity.AttendanceLog;
import com.fas.data.enums.PunchType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

/**
 * Spring Data JPA Repository cho thực thể AttendanceLog (DATA-BE-004 - attendance_logs).
 */
@Repository
public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, Long>, AttendanceLogBatchRepository, JpaSpecificationExecutor<AttendanceLog> {

    Page<AttendanceLog> findByUserId(Long userId, Pageable pageable);

    Page<AttendanceLog> findByUserIdAndPunchTimestampBetween(
            Long userId, Instant start, Instant end, Pageable pageable);

    /** Lượt điểm danh mới nhất của nhân viên trong khoảng thời gian (không giới hạn 100 bản ghi). */
    Optional<AttendanceLog> findFirstByUserIdAndPunchTimestampBetweenOrderByPunchTimestampDesc(
            Long userId, Instant start, Instant end);

    Page<AttendanceLog> findByKioskIdAndPunchTimestampBetween(
            String kioskId, Instant start, Instant end, Pageable pageable);

    Page<AttendanceLog> findByPunchTimestampBetween(
            Instant start, Instant end, Pageable pageable);

    boolean existsByUserIdAndPunchTimestampAndPunchType(
            Long userId, Instant punchTimestamp, PunchType punchType);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT a.user.id) FROM AttendanceLog a WHERE a.punchTimestamp >= :start AND a.punchTimestamp < :end")
    long countDistinctUserByPunchTimestampBetween(
            @org.springframework.data.repository.query.Param("start") Instant start,
            @org.springframework.data.repository.query.Param("end") Instant end);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(a) FROM AttendanceLog a WHERE a.punchTimestamp >= :start AND a.punchTimestamp < :end AND a.status = :status")
    long countByPunchTimestampBetweenAndStatus(
            @org.springframework.data.repository.query.Param("start") Instant start,
            @org.springframework.data.repository.query.Param("end") Instant end,
            @org.springframework.data.repository.query.Param("status") com.fas.data.enums.AttendanceStatus status);
}
