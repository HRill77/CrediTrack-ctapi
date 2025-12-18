package com.cta.creditrack.dtos;

public record EmailRequest(
    String to,
    String subject,
    String body
) {

}
