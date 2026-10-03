package com.fas.data.repository;

import com.fas.data.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository cho thực thể Shift (DATA-BE-002 - shifts).
 */
@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {

    Optional<Shift> findByShiftCode(String shiftCode);

    boolean existsByShiftCode(String shiftCode);

    List<Shift> findByIsActiveTrue();
}
