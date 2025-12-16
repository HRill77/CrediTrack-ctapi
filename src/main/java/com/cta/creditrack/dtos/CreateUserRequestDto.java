package com.cta.creditrack.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequestDto(

    @NotBlank
    String firstName,

    String middleName,

    @NotBlank
    String lastName,

    String suffix,

    @Email
    @NotBlank
    String email,

    @Size(min = 10, max = 10)
    String phone,

    @NotNull
    Long roleId,

    @NotNull
    Long programId

) {}