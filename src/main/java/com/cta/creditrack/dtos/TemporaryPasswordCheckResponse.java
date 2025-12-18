package com.cta.creditrack.dtos;

public record TemporaryPasswordCheckResponse(
        String email,
        boolean isTempPassword,
        String message
) {}
