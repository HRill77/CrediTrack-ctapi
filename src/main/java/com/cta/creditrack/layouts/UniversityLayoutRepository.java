package com.cta.creditrack.layouts;



import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UniversityLayoutRepository
        extends JpaRepository<UniversityLayout, Long> {

    Optional<UniversityLayout> findByUniversityCode(String universityCode);
}