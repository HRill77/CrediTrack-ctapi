package com.cta.creditrack.dtos;

import java.time.LocalDateTime;

public record TranscriptDTO2(
     Long id,
        String year,
        String subjectCode,
        String courseName,
        String grade,
        Integer credits,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

}
