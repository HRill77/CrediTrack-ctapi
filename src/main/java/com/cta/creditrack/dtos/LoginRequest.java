package com.cta.creditrack.dtos;
import jakarta.validation.constraints.*;
public record LoginRequest(
    @NotBlank String username,
    @NotBlank String password
) {}
