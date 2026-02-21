package com.cta.creditrack.dtos;

public record TranscriptRequest(
        String year,
        String subjectCode,
        String courseName,
        String grade,
        Integer credits
) {}