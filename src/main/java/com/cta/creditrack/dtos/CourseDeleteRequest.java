package com.cta.creditrack.dtos;

import java.util.List;
import jakarta.validation.constraints.NotEmpty;

public record CourseDeleteRequest(
    @NotEmpty(message = "IDs list cannot be empty")
    List<Long> ids
) {}
