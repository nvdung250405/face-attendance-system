package com.fas.data.repository;

import com.fas.data.entity.EmployeeShift;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository cho thực thể EmployeeShift (DATA-BE-003 - employee_shifts).
 */
@Repository
public interface EmployeeShiftRepository extends JpaRepository<EmployeeShift, Long> {

    @Override
    @EntityGraph(attributePaths = {"user", "shift"})
    List<EmployeeShift> findAll();

    @EntityGraph(attributePaths = {"user", "shift"})
    List<EmployeeShift> findByUserId(Long userId);

    List<EmployeeShift> findByShiftId(Long shiftId);

    boolean existsByShiftId(Long shiftId);

    @Query("SELECT es FROM EmployeeShift es " +
           "WHERE es.user.id = :userId " +
           "AND es.effectiveFrom <= :date " +
           "AND (es.effectiveTo IS NULL OR es.effectiveTo >= :date)")
    Optional<EmployeeShift> findActiveShiftForUser(@Param("userId") Long userId, @Param("date") LocalDate date);

    @EntityGraph(attributePaths = {"user", "shift"})
    @Query("SELECT es FROM EmployeeShift es " +
           "WHERE (:userId IS NULL OR es.user.id = :userId) " +
           "AND (:shiftId IS NULL OR es.shift.id = :shiftId) " +
           "AND (:fromDate IS NULL OR es.effectiveTo IS NULL OR es.effectiveTo >= :fromDate) " +
           "AND (:toDate IS NULL OR es.effectiveFrom <= :toDate) " +
           "ORDER BY es.effectiveFrom DESC")
    List<EmployeeShift> findByCriteria(
            @Param("userId") Long userId,
            @Param("shiftId") Long shiftId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);
}
