package com.cta.creditrack.dtos;

import java.util.List;
import jakarta.validation.constraints.NotEmpty;

public record CurriculaDeleteRequest(
    @NotEmpty(message = "IDs list cannot be empty")
    List<Long> ids
) {}
