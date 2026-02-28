package com.cta.creditrack.dtos;

import java.util.List;

public record SendEvaluationEmailRequest(
        List<Long> studentIds,
        String recipientEmail
) {}