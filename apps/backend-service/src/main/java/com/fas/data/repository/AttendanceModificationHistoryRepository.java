package com.fas.data.repository;

import com.fas.data.entity.AttendanceModificationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository cho thực thể AttendanceModificationHistory.
 */
@Repository
public interface AttendanceModificationHistoryRepository
        extends JpaRepository<AttendanceModificationHistory, Long> {

    List<AttendanceModificationHistory> findByAttendanceLogIdOrderByCreatedAtDesc(Long attendanceLogId);
}
