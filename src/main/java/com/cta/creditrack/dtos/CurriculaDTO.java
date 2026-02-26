package com.cta.creditrack.dtos;

public record CurriculaDTO(
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
) {

}
