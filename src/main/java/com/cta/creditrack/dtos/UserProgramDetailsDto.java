package com.cta.creditrack.dtos;

public record UserProgramDetailsDto(
    Long programId,
    Long userId,
    String code,
    String name
) {

}
