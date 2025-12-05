package com.cta.creditrack.dtos;

public record ApiErrorResponse(
    int status,
    String error,
    String message,
    String path
) {}