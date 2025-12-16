package com.cta.creditrack.dtos;

public record UserSearchResult(
     Long id,
            String fullName,
            String email,
            Boolean isActive,
            String program,
            String role,
            String createdAt,
            String updatedAt
) {

}
