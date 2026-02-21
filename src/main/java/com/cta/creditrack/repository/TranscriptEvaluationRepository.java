package com.cta.creditrack.repository;

import com.cta.creditrack.model.TranscriptEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TranscriptEvaluationRepository extends JpaRepository<TranscriptEvaluation, Long> {

    List<TranscriptEvaluation> findByTranscriptStudentId(Long studentId);

    boolean existsByTranscriptId(Long transcriptId);
}
