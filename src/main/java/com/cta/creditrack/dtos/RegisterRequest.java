package com.cta.creditrack.dtos;

import org.springframework.lang.Nullable;

import com.cta.creditrack.enums.RoleName;

import jakarta.validation.constraints.*;

public record RegisterRequest(

    @NotBlank @Email
    String email,

    // @NotBlank @Size(min = 8, max = 100)
    // String password,
    
    @Nullable String firstname,
    @Nullable String middlename,
    @Nullable String lastname,
    @Nullable String suffix,
    
    @Nullable
    Long roleId,

    @Nullable
    Long programId
) {}
