package com.cta.creditrack.dtos;

import java.util.List;

/**
 * DTO for sending evaluation emails with optional HTML override.
 */
public record SendEvaluationEmailRequest(
                List<Long> studentIds,
                String recipientEmail,
                Long programHeadId,
                String html // <– new, may be null
) {
}