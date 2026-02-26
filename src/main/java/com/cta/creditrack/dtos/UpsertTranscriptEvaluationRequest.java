package com.cta.creditrack.dtos;

import java.util.List;



public record UpsertTranscriptEvaluationRequest(
        Long studentId,
        List<EvaluationItem> evaluations
) {

       public record EvaluationItem(
            Long evaluationId,     // null if new
            Long transcriptId,     // null if new transcript
            String courseName,
            String subjectCode,
            Integer units,
            String grade,
            Long curriculaId,
            String remarks,
            Double confidenceScore,
            Boolean finalApproved,
            Boolean deleted 
    ) {}
}
