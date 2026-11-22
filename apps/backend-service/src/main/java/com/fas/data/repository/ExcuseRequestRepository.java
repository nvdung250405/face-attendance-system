package com.fas.data.repository;

import com.fas.data.entity.ExcuseRequest;
import com.fas.data.enums.ExcuseRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository cho thực thể ExcuseRequest (DATA-BE-018 - excuse_requests).
 */
@Repository
public interface ExcuseRequestRepository extends JpaRepository<ExcuseRequest, Long> {

    /** Đơn của chính một nhân viên (FR-BE-014), mới nhất trước. */
    Page<ExcuseRequest> findByUserId(Long userId, Pageable pageable);

    /** Danh sách đơn theo trạng thái xử lý (FR-BE-015). */
    Page<ExcuseRequest> findByStatus(ExcuseRequestStatus status, Pageable pageable);

    /** Danh sách đơn của một nhân viên lọc theo trạng thái xử lý. */
    Page<ExcuseRequest> findByUserIdAndStatus(Long userId, ExcuseRequestStatus status, Pageable pageable);

    /** Kiểm tra một lượt chấm đã có đơn đang chờ xử lý hay chưa (tránh nộp trùng). */
    Optional<ExcuseRequest> findByAttendanceLogIdAndStatus(Long attendanceLogId, ExcuseRequestStatus status);

    /** Kiểm tra tồn tại đơn theo lượt chấm và trạng thái. */
    boolean existsByAttendanceLogIdAndStatus(Long attendanceLogId, ExcuseRequestStatus status);
}
