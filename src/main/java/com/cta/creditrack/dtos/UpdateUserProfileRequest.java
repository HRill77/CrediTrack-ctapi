package com.cta.creditrack.dtos;

import jakarta.validation.constraints.NotBlank;

public record UpdateUserProfileRequest(
        @NotBlank(message = "First name cannot be blank")
        String firstName,

        String middleName,

        @NotBlank(message = "Last name cannot be blank")
        String lastName,

        String suffix
) {}
