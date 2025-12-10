package com.cta.creditrack.dtos;

public record UserSearchRequest(
    String searchText,
    Long programId,
    Long roleId) {
}