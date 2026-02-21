package com.cta.creditrack.services;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.cta.creditrack.dtos.BulkTranscriptRequest;
import com.cta.creditrack.dtos.TranscriptRequest;
import com.cta.creditrack.dtos.TranscriptEvaluationResponse;
import com.cta.creditrack.dtos.TranscriptResponse;
import com.cta.creditrack.dtos.CurriculaResponse;
import com.cta.creditrack.enums.DecisionType;
import com.cta.creditrack.enums.EvaluationStatus;
import com.cta.creditrack.model.Curricula;
import com.cta.creditrack.model.Student;
import com.cta.creditrack.model.Transcript;
import com.cta.creditrack.model.TranscriptEvaluation;
import com.cta.creditrack.repository.CurriculaRepository;
import com.cta.creditrack.repository.StudentRepository;
import com.cta.creditrack.repository.TranscriptEvaluationRepository;
import com.cta.creditrack.repository.TranscriptRepository;
import com.cta.creditrack.utils.SubjectSimilarityUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TranscriptProcessingService {

    private final StudentRepository studentRepository;
    private final TranscriptRepository transcriptRepository;
    private final CurriculaRepository curriculaRepository;
    private final TranscriptEvaluationRepository evaluationRepository;


    public List<TranscriptEvaluationResponse> processTranscriptEvaluation(BulkTranscriptRequest request, String program) {
        List<TranscriptEvaluation> evaluations = new java.util.ArrayList<>();
        try {
            log.info("Starting transcript evaluation for program: {} with {} transcripts", program, request.transcripts().size());
            
            Student student = studentRepository.findById(request.studentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));
            log.info("Student found: {}", student.getId());

            // Delete previous transcript and transcript_evaluation data for this student
            deleteStudentTranscriptData(request.studentId());
            log.info("Previous transcript data deleted for student: {}", student.getId());

            List<Curricula> curriculaList =
                    curriculaRepository.findByProgramTitle(program);
            log.info("Found {} curricula for program: {}", curriculaList.size(), program);

            for (TranscriptRequest dto : request.transcripts()) {
                try {
                    log.info("Processing transcript: {} with {} credits", dto.courseName(), dto.credits());
                    
                    //Save Transcript
                    Transcript transcript = new Transcript();
                    transcript.setYear(dto.year());
                    transcript.setSubjectCode(dto.subjectCode());
                    transcript.setCourseName(dto.courseName());
                    transcript.setGrade(dto.grade());
                    transcript.setCredits(dto.credits());
                    transcript.setStudent(student);

                    transcriptRepository.save(transcript);

                    // MATCHING
                    Curricula bestMatch = null;
                    double highestScore = 0;

                    for (Curricula curricula : curriculaList) {

                        double score = SubjectSimilarityUtil.computeScore(
                                transcript.getCourseName(),
                                curricula.getCourseTitle(),
                                transcript.getCredits(),
                                curricula.getUnits()
                        );

                        if (score > highestScore) {
                            highestScore = score;
                            bestMatch = curricula;
                        }
                    }
                    
                    log.info("Best match found {} with score: {}", bestMatch != null ? bestMatch.getCourseTitle() : "NONE", highestScore);

                    // SAVE EVALUATION
                    TranscriptEvaluation evaluation = new TranscriptEvaluation();
                    evaluation.setTranscript(transcript);
                    evaluation.setCurricula(bestMatch);
                    evaluation.setConfidenceScore(highestScore);
                    evaluation.setEvaluationStatus(mapStatus(highestScore));
                    evaluation.setDecisionType(
                            highestScore >= 85 ? DecisionType.AUTO : DecisionType.MANUAL
                    );
                    evaluation.setFinalApproved(highestScore >= 85);
                    
                    // Determine remarks based on grade and units
                    String remarks = generateRemarks(highestScore);
                    
                    // Check if grade is below 75 or 3.0
                    double gradeValue = Double.parseDouble(dto.grade());
                    if (gradeValue < 3.0) {
                        remarks = "Failed grade";
                    }
                    // Check if credits are lower than units
                    else if (bestMatch != null && transcript.getCredits() != null && bestMatch.getUnits() != null 
                            && transcript.getCredits() < bestMatch.getUnits()) {
                        remarks = "Insufficient units";
                    }
                    
                    evaluation.setRemarks(remarks);

                    evaluationRepository.save(evaluation);
                    evaluations.add(evaluation);
                } catch (Exception e) {
                    log.error("Error processing transcript for course: " + dto.courseName(), e);
                }
            }
            log.info("Transcript evaluation completed. Processed {} evaluations", evaluations.size());
        } catch (RuntimeException e) {
            log.error("Error in processTranscriptEvaluation", e);
            throw e;
        }
        // Convert entities to DTOs to avoid Hibernate proxy serialization issues
        return evaluations.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private EvaluationStatus mapStatus(double score) {
        if (score >= 85) return EvaluationStatus.HIGH_CONFIDENCE_MATCH;
        if (score >= 75) return EvaluationStatus.MEDIUM_CONFIDENCE_MATCH;
        if (score >= 60) return EvaluationStatus.LOW_CONFIDENCE_MATCH;
        return EvaluationStatus.NO_MATCH;
    }

    private String generateRemarks(double score) {
        if (score >= 85) return "Equivalent course found";
        if (score >= 75) return "Needs review";
        if (score >= 60) return "Low similarity";
        return "Course mismatch";
    }

    /**
     * Deletes all transcript and transcript_evaluation records for a given student.
     * This is called before processing new transcript data to ensure clean data.
     * 
     * @param studentId the ID of the student whose transcript data should be deleted
     */
    private void deleteStudentTranscriptData(Long studentId) {
        try {
            // Delete all transcript_evaluation records first
            List<TranscriptEvaluation> evaluations = evaluationRepository.findByTranscriptStudentId(studentId);
            if (!evaluations.isEmpty()) {
                evaluationRepository.deleteAll(evaluations);
                log.info("Deleted {} transcript evaluation records for student: {}", evaluations.size(), studentId);
            }
            
            // Delete all transcript records
            List<Transcript> transcripts = transcriptRepository.findByStudentId(studentId);
            if (!transcripts.isEmpty()) {
                transcriptRepository.deleteAll(transcripts);
                log.info("Deleted {} transcript records for student: {}", transcripts.size(), studentId);
            }
        } catch (Exception e) {
            log.error("Error deleting previous transcript data for student: " + studentId, e);
            throw new RuntimeException("Failed to delete previous transcript data", e);
        }
    }

    /**
     * Converts a TranscriptEvaluation entity to a TranscriptEvaluationResponse DTO.
     * This avoids Hibernate proxy serialization issues.
     * 
     * @param evaluation the TranscriptEvaluation entity to convert
     * @return a TranscriptEvaluationResponse DTO
     */
    private TranscriptEvaluationResponse convertToResponse(TranscriptEvaluation evaluation) {
        TranscriptResponse transcriptResponse = null;
        if (evaluation.getTranscript() != null) {
            Transcript t = evaluation.getTranscript();
            transcriptResponse = new TranscriptResponse(
                    t.getId(),
                    t.getYear(),
                    t.getSubjectCode(),
                    t.getCourseName(),
                    t.getGrade(),
                    t.getCredits(),
                    t.getCreatedAt(),
                    t.getUpdatedAt()
            );
        }

        CurriculaResponse curriculaResponse = null;
        if (evaluation.getCurricula() != null) {
            Curricula c = evaluation.getCurricula();
            curriculaResponse = new CurriculaResponse(
                    c.getId(),
                    c.getProgramTitle(),
                    c.getProgramCode(),
                    c.getYear(),
                    c.getSemester(),
                    c.getCourseCode(),
                    c.getCourseTitle(),
                    c.getPreRequisite(),
                    c.getLec(),
                    c.getLab(),
                    c.getUnits()
            );
        }

        return new TranscriptEvaluationResponse(
                evaluation.getId(),
                transcriptResponse,
                curriculaResponse,
                evaluation.getConfidenceScore(),
                evaluation.getEvaluationStatus(),
                evaluation.getDecisionType(),
                evaluation.getFinalApproved(),
                evaluation.getRemarks(),
                evaluation.getCreatedAt(),
                evaluation.getUpdatedAt()
        );
    }
}
