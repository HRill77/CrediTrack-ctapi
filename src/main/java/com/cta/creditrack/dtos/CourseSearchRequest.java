package com.cta.creditrack.dtos;

import java.util.List;

public record CourseSearchRequest(
        String courseName,
        List<String> sortField,
        List<String> sortDirection
) {
}
