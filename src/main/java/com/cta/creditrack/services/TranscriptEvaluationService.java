package com.cta.creditrack.services;

import java.sql.Timestamp;
import java.util.*;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.cta.creditrack.dtos.CurriculaDTO;
import com.cta.creditrack.dtos.EvaluationItem;
import com.cta.creditrack.dtos.FileUploadDTO;
import com.cta.creditrack.dtos.TranscriptDTO2;
import com.cta.creditrack.dtos.TranscriptEvaluationGroupedResponse;
import com.cta.creditrack.dtos.TranscriptEvaluationSearchRequest;

import com.cta.creditrack.dtos.UpsertTranscriptEvaluationRequest;
import com.cta.creditrack.model.Curricula;
import com.cta.creditrack.model.Student;
import com.cta.creditrack.model.Transcript;
import com.cta.creditrack.model.TranscriptEvaluation;
import com.cta.creditrack.repository.CurriculaRepository;
import com.cta.creditrack.repository.StudentRepository;
import com.cta.creditrack.repository.TranscriptEvaluationRepository;
import com.cta.creditrack.repository.TranscriptRepository;

import jakarta.transaction.Transactional;


@Service
@RequiredArgsConstructor
@Slf4j
public class TranscriptEvaluationService {

    private final TranscriptEvaluationRepository repository;
    private final CurriculaRepository curriculaRepository;
    private final StudentRepository studentRepository;
    private final TranscriptRepository transcriptRepository;

    public Page<TranscriptEvaluationGroupedResponse> searchTranscriptEvaluations(
            TranscriptEvaluationSearchRequest request,
            Pageable pageable) {

        if (request == null) {
            throw new IllegalArgumentException("Request body cannot be null");
        }

        try {

            if (request.studentName() != null &&
                    request.studentName().length() > 255) {
                throw new IllegalArgumentException("Student name too long");
            }

            List<Object[]> rows = repository.searchTranscriptEvaluations(
                    request.studentName(),
                    request.fromProgram(),
                    request.fromUniversity(),
                    request.toProgram()
            );

            if (rows == null || rows.isEmpty()) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }

            Map<Long, TranscriptEvaluationGroupedResponse> grouped =
                    new LinkedHashMap<>();

            for (Object[] row : rows) {

                if (row == null) continue;

                Long studentId = (Long) row[27];

                if (studentId == null) continue;

                 FileUploadDTO fileUpload = null;

            if (row[35] != null) {
                fileUpload = new FileUploadDTO(
                        (Long) row[35],
                        (String) row[36],
                        (String) row[37],
                        row[38] != null ? ((Number) row[38]).longValue() : null,
                        (String) row[39],
                        (String) row[40],
                        row[41] != null ? ((Number) row[41]).longValue() : null,
                        row[42] != null ? ((Timestamp) row[42]).toLocalDateTime() : null
                );
            }

                grouped.putIfAbsent(studentId,
                        new TranscriptEvaluationGroupedResponse(
                                studentId,
                                (String) row[28],
                                (String) row[29],
                                (String) row[30],
                                (String) row[31],
                                (String) row[32],
                                (String) row[33],
                                (String) row[34],
                                fileUpload,
                                new ArrayList<>()
                        )
                );

                TranscriptDTO2 transcript = new TranscriptDTO2(
                        (Long) row[8],
                        (String) row[9],
                        (String) row[10],
                        (String) row[11],
                        (String) row[12],
                        row[13] != null ? ((Number) row[13]).intValue() : null,
                        row[14] != null ? ((Timestamp) row[14]).toLocalDateTime() : null,
                        row[15] != null ? ((Timestamp) row[15]).toLocalDateTime() : null
                );

                CurriculaDTO curricula = new CurriculaDTO(
                        (Long) row[16],
                        (String) row[17],
                        (String) row[18],
                        (String) row[19],
                        (String) row[20],
                        (String) row[21],
                        (String) row[22],
                        (String) row[23],
                        row[24] != null ? ((Number) row[24]).intValue() : null,
                        row[25] != null ? ((Number) row[25]).intValue() : null,
                        row[26] != null ? ((Number) row[26]).intValue() : null
                );

                EvaluationItem evaluation = new EvaluationItem(
                        (Long) row[0],
                        transcript,
                        curricula,
                        row[1] != null ? ((Number) row[1]).doubleValue() : null,
                        (String) row[2],
                        (String) row[3],
                        (Boolean) row[4],
                        (String) row[5],
                        row[6] != null ? ((Timestamp) row[6]).toLocalDateTime() : null,
                        row[7] != null ? ((Timestamp) row[7]).toLocalDateTime() : null
                );

                grouped.get(studentId).evaluation().add(evaluation);
            }

            List<TranscriptEvaluationGroupedResponse> result =
                    new ArrayList<>(grouped.values());

            int start = (int) pageable.getOffset();
            int total = result.size();
            int end = Math.min(start + pageable.getPageSize(), total);

            if (start >= total) {
                return new PageImpl<>(Collections.emptyList(), pageable, total);
            }

            return new PageImpl<>(result.subList(start, end), pageable, total);

        } catch (IllegalArgumentException e) {
            log.warn("Validation error in transcript search: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while searching transcript evaluations", e);
            throw new RuntimeException("Failed to search transcript evaluations");
        }
    }

   @Transactional
public void upsertTranscriptEvaluations(
        UpsertTranscriptEvaluationRequest request) {

    Student student = studentRepository.findById(request.studentId())
            .orElseThrow(() -> new IllegalArgumentException("Student not found"));

    for (UpsertTranscriptEvaluationRequest.EvaluationItem item : request.evaluations()) {

        // ===============================
        // HANDLE DELETE
        // ===============================
        if (Boolean.TRUE.equals(item.deleted())) {

             if (item.evaluationId() != null) {

                repository.findById(item.evaluationId())
                        .ifPresent(evaluation -> {

                            Transcript transcript = evaluation.getTranscript();

                            repository.delete(evaluation);

                            if (transcript != null) {
                                transcriptRepository.delete(transcript);
                            }
                        });
            }

            continue; // skip further processing
        }

        // ===============================
        //  TRANSCRIPT (CREATE OR UPDATE)
        // ===============================
        Transcript transcript;

        if (item.transcriptId() != null) {
            transcript = transcriptRepository.findById(item.transcriptId())
                    .orElseThrow(() -> new IllegalArgumentException("Transcript not found"));
        } else {
            transcript = new Transcript();
            transcript.setStudent(student);
        }

        transcript.setCourseName(item.courseName());
        transcript.setSubjectCode(item.subjectCode());
        transcript.setCredits(item.units());
        transcript.setGrade(item.grade());

        transcriptRepository.save(transcript);

        // ===============================
        // EVALUATION (CREATE OR UPDATE)
        // ===============================
        TranscriptEvaluation evaluation;

        if (item.evaluationId() != null) {
            evaluation = repository.findById(item.evaluationId())
                    .orElseThrow(() -> new IllegalArgumentException("Evaluation not found"));
        } else {
            evaluation = new TranscriptEvaluation();
            evaluation.setTranscript(transcript);
        }

        if (item.curriculaId() != null) {
            Curricula curricula = curriculaRepository.findById(item.curriculaId())
                    .orElseThrow(() -> new IllegalArgumentException("Curricula not found"));
            evaluation.setCurricula(curricula);
        }

        evaluation.setRemarks(item.remarks());
        evaluation.setConfidenceScore(item.confidenceScore());
        evaluation.setFinalApproved(item.finalApproved());

        repository.save(evaluation);
    }
}

}
