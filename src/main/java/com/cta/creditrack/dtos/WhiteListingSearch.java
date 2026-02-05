package com.cta.creditrack.dtos;

import java.util.List;

import org.springframework.lang.Nullable;

public record WhiteListingSearch(
@Nullable String searchText,
    @Nullable List<String> sortField,
    @Nullable List<String> sortDirection

) {

}
