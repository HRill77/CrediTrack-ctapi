package com.cta.creditrack.dtos;

import java.time.LocalDateTime;

public record ApprovalsDTO(
        Long id,
        LocalDateTime approvedDate,
        Long studentId,
        Long userId
) {

}
