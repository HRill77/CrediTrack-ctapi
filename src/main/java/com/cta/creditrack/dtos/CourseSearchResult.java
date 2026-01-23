package com.cta.creditrack.dtos;

import java.time.LocalDateTime;

public record CourseSearchResult(
        Long id,
        String courseName,
        String units,
        String prerequisite,
        String description,
        String courseOutline,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
