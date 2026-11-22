package com.fas.data.repository;

import com.fas.data.entity.DataSubjectRequest;
import com.fas.data.enums.DataSubjectRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository cho thực thể DataSubjectRequest (DATA-BE-024 - data_subject_requests).
 */
@Repository
public interface DataSubjectRequestRepository extends JpaRepository<DataSubjectRequest, Long> {

    Page<DataSubjectRequest> findByUserId(Long userId, Pageable pageable);

    Page<DataSubjectRequest> findByStatus(DataSubjectRequestStatus status, Pageable pageable);
}
