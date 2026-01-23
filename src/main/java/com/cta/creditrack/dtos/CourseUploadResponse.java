package com.cta.creditrack.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CourseUploadResponse(
    @JsonProperty("success")
    Boolean success,
    @JsonProperty("message")
    String message,

    @JsonProperty("errors")
    java.util.List<String> errors
) {}
