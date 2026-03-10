package com.cta.creditrack.dtos;

/**
 * Simple DTO used by {@link com.cta.creditrack.services.EmailService} for
 * generic email sending. The optional {@code html} field allows callers to
 * supply pre-formatted HTML instead of relying on a generated body.
 */
public record EmailRequest(
        String recipientEmail,
        String subject,
        String body,
        String html) {
}