package com.cta.creditrack.dtos;

import java.util.List;

import org.springframework.lang.Nullable;

public record UserSearchRequest(
    @Nullable String searchText,
    @Nullable Long programId,
    @Nullable Long roleId,
    @Nullable List<String> sortField,
    @Nullable List<String> sortDirection
) {
}