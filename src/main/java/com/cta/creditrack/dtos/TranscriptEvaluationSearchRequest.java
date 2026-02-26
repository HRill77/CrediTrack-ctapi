package com.cta.creditrack.dtos;

import java.util.List;

public record TranscriptEvaluationSearchRequest(
        String studentName,
        String fromProgram,
        String fromUniversity,
        String toProgram,
        List<String> sortField,
        List<String> sortDirection
) {}