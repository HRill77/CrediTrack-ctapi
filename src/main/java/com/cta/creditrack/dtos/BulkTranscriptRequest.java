package com.cta.creditrack.dtos;

import java.util.List;

public record BulkTranscriptRequest(
        Long studentId,
        List<TranscriptRequest> transcripts
) {}
