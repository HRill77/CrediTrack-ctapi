package com.cta.creditrack.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cta.creditrack.model.Transcript;

public interface TranscriptRepository extends JpaRepository<Transcript, Long> {

    @Query(value = """
            SELECT t FROM Transcript t
            JOIN t.student s
            WHERE (?1 IS NULL or s.email = ?1)
            """, nativeQuery = true)
    Optional<Transcript> findTranscriptByStudentEmail(
        @Param("email") String email
    );

    List<Transcript> findByStudentId(Long studentId);
}
