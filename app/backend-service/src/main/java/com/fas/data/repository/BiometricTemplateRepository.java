package com.fas.data.repository;

import com.fas.data.entity.BiometricTemplate;
import com.fas.data.enums.PoseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository cho thực thể BiometricTemplate (DATA-BE-005 - biometric_templates).
 */
@Repository
public interface BiometricTemplateRepository extends JpaRepository<BiometricTemplate, Long> {

    List<BiometricTemplate> findByUserIdAndIsActiveTrue(Long userId);

    Optional<BiometricTemplate> findFirstByUserIdAndIsActiveTrue(Long userId);

    Optional<BiometricTemplate> findByUserIdAndPoseTypeAndIsActiveTrue(Long userId, PoseType poseType);

    boolean existsByUserIdAndIsActiveTrue(Long userId);

    List<BiometricTemplate> findByIsActiveTrue();

    List<BiometricTemplate> findByUserId(Long userId);

    @Modifying
    @Query("UPDATE BiometricTemplate bt SET bt.isActive = false WHERE bt.user.id = :userId AND bt.isActive = true")
    int deactivateAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM BiometricTemplate bt WHERE bt.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM BiometricTemplate bt WHERE bt.user.id IN :userIds")
    void deleteByUserIdIn(@Param("userIds") Collection<Long> userIds);
}
