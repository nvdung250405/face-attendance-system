package com.fas.data.repository;

import com.fas.data.entity.Kiosk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository cho thực thể Kiosk (DATA-BE-007 - kiosks).
 */
@Repository
public interface KioskRepository extends JpaRepository<Kiosk, String> {

    Optional<Kiosk> findByIdAndIsActiveTrue(String id);

    List<Kiosk> findByIsActiveTrue();
}
