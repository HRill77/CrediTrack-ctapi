package com.cta.creditrack.repository;

import com.cta.creditrack.model.ManualCredit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ManualCreditRepository extends JpaRepository<ManualCredit, Long> {

    List<ManualCredit> findByProgram(String program);

    Optional<ManualCredit> findByTranscriptCourseNameAndCurriculumCourseNameAndProgram(
            String transcriptCourseName,
            String curriculumCourseName,
            String program);
}