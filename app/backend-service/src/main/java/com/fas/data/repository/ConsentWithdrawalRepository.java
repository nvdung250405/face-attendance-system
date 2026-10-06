package com.fas.data.repository;

import com.fas.data.entity.ConsentWithdrawal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository cho thực thể ConsentWithdrawal (DATA-BE-023 - consent_withdrawals).
 */
@Repository
public interface ConsentWithdrawalRepository extends JpaRepository<ConsentWithdrawal, Long> {

    Optional<ConsentWithdrawal> findFirstByUserIdOrderByWithdrawnAtDesc(Long userId);

    /** Các vết rút Consent đã tới hạn tiêu hủy dữ liệu sinh trắc nhưng chưa xử lý (FR-BE-022). */
    List<ConsentWithdrawal> findByProcessedAtIsNullAndBiometricDisposalDueAtLessThanEqual(Instant threshold);
}
