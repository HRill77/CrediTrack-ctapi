package com.cta.creditrack.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cta.creditrack.model.Approvals;

@Repository
public interface ApprovalsRepository extends JpaRepository<Approvals, Long> {

    /**
     * Find all approvals for a specific student
     */
    List<Approvals> findByStudentId(Long studentId);

    /**
     * Find all approvals approved by a specific user
     */
    List<Approvals> findByUserId(Long userId);

    /**
     * Find approval by ID with eager loading to avoid lazy loading issues
     */
    @Query("SELECT a FROM Approvals a LEFT JOIN FETCH a.student LEFT JOIN FETCH a.user WHERE a.id = :id")
    Optional<Approvals> findByIdWithDetails(@Param("id") Long id);

    /**
     * Check if a student has received approval from a specific user
     */
    boolean existsByStudentIdAndUserId(Long studentId, Long userId);

    /**
     * Find approvals for a student approved by a specific user
     */
    List<Approvals> findByStudentIdAndUserId(Long studentId, Long userId);

}
