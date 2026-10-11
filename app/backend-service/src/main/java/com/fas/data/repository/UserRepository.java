package com.fas.data.repository;

import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository cho thực thể User (DATA-BE-001 - users).
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

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

    /**
     * Đếm số lượng tài khoản theo vai trò và trạng thái công tác (DD-BE-026, FR-BE-023).
     */
    long countByRoleAndStatus(Role role, EmployeeStatus status);

    /**
     * Khóa bi quan danh sách người dùng theo vai trò và trạng thái (chống race condition hạ cấp ADMIN cuối).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.status = :status")
    List<User> findByRoleAndStatusForUpdate(@Param("role") Role role, @Param("status") EmployeeStatus status);
}
