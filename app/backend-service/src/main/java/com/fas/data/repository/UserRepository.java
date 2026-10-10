package com.fas.data.repository;

import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository cho thực thể User (DATA-BE-001 - users).
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmployeeCode(String employeeCode);

    boolean existsByEmail(String email);

    boolean existsByEmployeeCode(String employeeCode);

    Page<User> findByStatus(EmployeeStatus status, Pageable pageable);

    Page<User> findByDepartment(String department, Pageable pageable);

    Page<User> findByFullNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase(
            String fullName, String employeeCode, Pageable pageable);

    /**
     * Tìm kiếm nhân sự đã thôi việc quá thời hạn phục vụ quy tắc tiêu hủy sinh trắc học 20 ngày.
     */
    List<User> findByStatusAndTerminatedDateLessThanEqual(EmployeeStatus status, LocalDate terminatedDate);

    Page<User> findByStatusOrderByTerminatedDateDesc(EmployeeStatus status, Pageable pageable);
}
