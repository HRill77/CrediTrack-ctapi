package com.cta.creditrack.dtos;

public record UserSearchResult(
     Long id,
            String fullName,
            String email,
            Boolean isActive,
            String program,
            String role,
            Object createdAt,
            Object updatedAt
) {

}
