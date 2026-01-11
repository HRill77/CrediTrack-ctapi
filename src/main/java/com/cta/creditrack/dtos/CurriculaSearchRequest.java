package com.cta.creditrack.dtos;

import java.util.List;

public record CurriculaSearchRequest(
    List<String> programCodes,
    List<String> years,
    List<String> semesters,
    List<String> courseCodes,
    String searchText,
    List<String> sortField,
    List<String> sortDirection
) {}
