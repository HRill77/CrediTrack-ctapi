package com.cta.creditrack.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CurriculaCreateRequest(
    @NotBlank(message = "Program title cannot be blank")
    String programTitle,
    
    @NotBlank(message = "Program code cannot be blank")
    String programCode,
    
    @NotBlank(message = "Year cannot be blank")
    String year,
    
    @NotBlank(message = "Semester cannot be blank")
    String semester,
    
    @NotBlank(message = "Course code cannot be blank")
    String courseCode,
    
    @NotBlank(message = "Course title cannot be blank")
    String courseTitle,
    
    String preRequisite,
    
    @NotNull(message = "Lecture hours cannot be null")
    Integer lec,
    
    @NotNull(message = "Lab hours cannot be null")
    Integer lab,
    
    @NotNull(message = "Units cannot be null")
    Integer units
) {}
