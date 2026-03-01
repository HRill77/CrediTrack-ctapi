package com.cta.creditrack.dtos;

import java.util.List;

public record TranscriptEvaluationGroupedResponse(
          Long studentId,
        String firstName,
        String middleName,
        String lastName,
        String suffix,
        String yearLevel,
        String email,
        String fromUniversity,
        String fromProgram,
        String toUniversity,
        String toProgram,
        FileUploadDTO fileUpload, 
        List<EvaluationItem> evaluation,
        ApprovalsDTO approvals
) {

}
