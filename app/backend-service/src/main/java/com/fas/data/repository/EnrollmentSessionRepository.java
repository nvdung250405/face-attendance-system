package com.fas.data.repository;

import com.fas.data.entity.EnrollmentSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository cho thực thể EnrollmentSession (DATA-BE-006 - enrollment_sessions).
 */
@Repository
public interface EnrollmentSessionRepository extends JpaRepository<EnrollmentSession, Long>, JpaSpecificationExecutor<EnrollmentSession> {

    Optional<EnrollmentSession> findByOtpHashAndIsUsedFalseAndExpiresAtAfter(String otpHash, Instant now);

    List<EnrollmentSession> findByUserIdAndIsUsedFalse(Long userId);

    List<EnrollmentSession> findByUserIdAndIsUsedFalseAndExpiresAtAfter(Long userId, Instant now);

    List<EnrollmentSession> findByIsUsedFalseAndExpiresAtAfter(Instant now);

    Page<EnrollmentSession> findAllByOrderByConsentSignedAtDesc(Pageable pageable);
}
