package com.cta.creditrack.dtos;

import java.util.List;

public record PaginatedResponse<T>(
        List<T> content,
        int currentPage,
        int pageSize,
        long totalElements,
        int totalPages,
        boolean hasNextPage,
        boolean hasPreviousPage
) {}
