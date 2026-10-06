package com.fas.data.repository;

import com.fas.data.entity.PayrollPeriod;
import com.fas.data.enums.PayrollPeriodStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository cho thực thể PayrollPeriod (DATA-BE-021 - payroll_periods).
 */
@Repository
public interface PayrollPeriodRepository extends JpaRepository<PayrollPeriod, Long> {

    Optional<PayrollPeriod> findByPeriodYearAndPeriodMonth(Integer periodYear, Integer periodMonth);

    Page<PayrollPeriod> findByPeriodYear(Integer periodYear, Pageable pageable);

    Page<PayrollPeriod> findByStatus(PayrollPeriodStatus status, Pageable pageable);
}
