package com.cta.creditrack.dtos;

import java.time.LocalDateTime;

public record EvaluationItem(
      Long id,
        TranscriptDTO2 transcript,
        CurriculaDTO curricula,
        Double confidenceScore,
        String evaluationStatus,
        String decisionType,
        Boolean finalApproved,
        String remarks,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

}
