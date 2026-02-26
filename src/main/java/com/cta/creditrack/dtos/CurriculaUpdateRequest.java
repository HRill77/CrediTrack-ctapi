package com.cta.creditrack.dtos;

import jakarta.validation.constraints.NotNull;

public record CurriculaUpdateRequest(
    @NotNull(message = "ID cannot be null")
    Long id,
    
    String programTitle,
    
    String programCode,
    
    String year,
    
    String semester,
    
    String courseCode,
    
    String courseTitle,
    
    String preRequisite,
    
    Integer lec,
    
    Integer lab,
    
    Integer units
) {}
