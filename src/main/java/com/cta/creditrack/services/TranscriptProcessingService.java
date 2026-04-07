package com.cta.creditrack.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.cta.creditrack.dtos.*;
import com.cta.creditrack.enums.*;
import com.cta.creditrack.model.*;
import com.cta.creditrack.repository.*;
import com.cta.creditrack.utils.GeminiUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

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
    private final GeminiUtils geminiUtils;
    private final ManualCreditRepository manualCreditRepository;

    public List<TranscriptEvaluationResponse> processTranscriptEvaluation(
        BulkTranscriptRequest request,
        String program) {

    List<TranscriptEvaluation> evaluations = new java.util.ArrayList<>();

    Student student = studentRepository.findById(request.studentId())
            .orElseThrow(() -> new RuntimeException("Student not found"));

    deleteStudentTranscriptData(request.studentId());

    List<Curricula> curriculaList = curriculaRepository.findByProgramTitle(program);

    // ==========================
    // 1. SAVE ALL TRANSCRIPTS FIRST
    // ==========================
    List<Transcript> savedTranscripts = new java.util.ArrayList<>();

    for (TranscriptRequest dto : request.transcripts()) {
        Transcript transcript = new Transcript();
        transcript.setYear(dto.year());
        transcript.setSubjectCode(dto.subjectCode());
        transcript.setCourseName(dto.courseName());
        transcript.setGrade(dto.grade());
        transcript.setCredits(dto.credits());
        transcript.setStudent(student);

        transcriptRepository.save(transcript);
        savedTranscripts.add(transcript);
    }

    // ==========================
    // 2. PREPARE BATCH INPUT
    // ==========================
    String transcriptsJson = savedTranscripts.stream()
            .map(t -> String.format(
                    "{\"transcriptCourse\":\"%s\",\"units\":%d}",
                    t.getCourseName(), t.getCredits()))
            .collect(Collectors.joining(",", "[", "]"));

    String curriculumJson = curriculaList.stream()
            .map(c -> String.format(
                    "{\"courseTitle\":\"%s\",\"units\":%d}",
                    c.getCourseTitle(), c.getUnits()))
            .collect(Collectors.joining(",", "[", "]"));

    // ==========================
    // 3. CALL GEMINI ONCE
    // ==========================
    String geminiResponse = geminiUtils.getBatchMatch(
            transcriptsJson,
            program,
            curriculumJson
    );

    Map<String, String> batchMatches = parseBatchResponse(geminiResponse);

    // ==========================
    // 4. PROCESS EACH TRANSCRIPT
    // ==========================
    for (int i = 0; i < savedTranscripts.size(); i++) {

        Transcript transcript = savedTranscripts.get(i);
        TranscriptRequest dto = request.transcripts().get(i);

        try {

            Curricula bestMatch = null;
            double highestScore = 0;

            // ==========================
            // 1. MANUAL CREDIT FIRST
            // ==========================
            Optional<ManualCredit> manualOpt =
                    manualCreditRepository
                            .findByTranscriptSubjectCodeAndTranscriptCourseNameAndTranscriptUnitsAndProgram(
                                    dto.subjectCode(),
                                    dto.courseName(),
                                    dto.credits(),
                                    program
                            );

            if (manualOpt.isPresent()) {
                ManualCredit manual = manualOpt.get();

                bestMatch = curriculaList.stream()
                        .filter(c -> normalize(c.getCourseTitle())
                                .equals(normalize(manual.getCurriculumCourseName())))
                        .findFirst()
                        .orElse(null);

                if (bestMatch != null) {
                    highestScore = 100;
                }
            }

            // ==========================
            // 2. BATCH GEMINI FALLBACK
            // ==========================
            if (bestMatch == null) {

                String matchedCourse =
                        batchMatches.get(normalize(dto.courseName()));

                log.info("Batch Gemini match for '{}' → '{}'",
                        dto.courseName(), matchedCourse);

                if (matchedCourse != null &&
                        !"NONE".equalsIgnoreCase(matchedCourse)) {

                    bestMatch = curriculaList.stream()
                            .filter(c -> normalize(c.getCourseTitle())
                                    .equals(normalize(matchedCourse)))
                            .findFirst()
                            .orElse(null);

                    if (bestMatch != null) {
                        highestScore = 90;
                    } else {
                        log.warn("Matched course not found in DB: {}", matchedCourse);
                    }
                }
            }

            // ==========================
            // SAVE EVALUATION
            // ==========================
            TranscriptEvaluation evaluation = new TranscriptEvaluation();
            evaluation.setTranscript(transcript);
            evaluation.setCurricula(bestMatch);
            evaluation.setConfidenceScore(highestScore);
            evaluation.setEvaluationStatus(mapStatus(highestScore));
            evaluation.setDecisionType(
                    highestScore >= 85 ? DecisionType.AUTO : DecisionType.MANUAL);
            evaluation.setFinalApproved(highestScore >= 85);

            String remarks = generateRemarks(highestScore);

            if (bestMatch == null) {
                remarks = "No equivalent course found";
            } else {
                // Check for failed grade
                String grade = dto.grade();
                boolean isFailedGrade = false;
                
                if ("INC".equalsIgnoreCase(grade)) {
                    isFailedGrade = true;
                } else {
                    try {
                        double gradeValue = Double.parseDouble(grade);
                        // Failed if below 75 (percentage) or below 3.0 (4-point scale)
                        if ((gradeValue < 75 && gradeValue > 5) || (gradeValue >= 3.0 && gradeValue < 5)) {
                            // This is a percentage system (0-100) and less than 75, OR 4-point scale (0-4) and 3.0+
                            isFailedGrade = gradeValue < 3.0;
                        } else if (gradeValue > 5) {
                            // Percentage system
                            isFailedGrade = gradeValue < 75;
                        }
                    } catch (NumberFormatException e) {
                        // Grade is not a number, skip grade check
                    }
                }
                
                if (isFailedGrade) {
                    remarks = "Failed grade";
                } else if (transcript.getCredits() != null &&
                        bestMatch.getUnits() != null &&
                        transcript.getCredits() < bestMatch.getUnits()) {
                    remarks = "Insufficient units";
                }
            }

            evaluation.setRemarks(remarks);

            evaluationRepository.save(evaluation);
            evaluations.add(evaluation);

        } catch (Exception e) {
            log.error("Error processing transcript: " + dto.courseName(), e);
        }
    }

    return evaluations.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
}

private Map<String, String> parseBatchResponse(String response) {
    Map<String, String> resultMap = new HashMap<>();

    try {
        JsonNode root = objectMapper.readTree(response);

        String text = root.path("candidates")
                .get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText();

        int start = text.indexOf("[");
        int end = text.lastIndexOf("]");

        if (start == -1 || end == -1) return resultMap;

        String jsonArray = text.substring(start, end + 1);

        JsonNode array = objectMapper.readTree(jsonArray);

        for (JsonNode node : array) {
            String transcriptCourse = node.path("transcriptCourse").asText();
            String matchedCourse = node.path("matchedCourse").asText();

            resultMap.put(normalize(transcriptCourse), matchedCourse);
        }

    } catch (Exception e) {
        log.error("Batch parse error", e);
    }

    return resultMap;
}


    private String normalize(String input) {
        if (input == null)
            return null;
        return input
                .trim()
                .replaceAll("\\s+", " ")
                .toLowerCase();
    }

    // ==========================
    // GEMINI PARSER
    // ==========================
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String extractCourseFromGemini(String response) {
        try {
            if (response == null || response.isBlank())
                return null;

            JsonNode root = objectMapper.readTree(response);

            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                log.warn("Gemini response has no candidates");
                return null;
            }

            JsonNode textNode = candidates.get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text");

            if (textNode.isMissingNode()) {
                log.warn("Gemini response missing text node");
                return null;
            }

            String text = textNode.asText().trim();

            log.debug("Gemini extracted raw text: {}", text);

            // 🔥 Handle case where Gemini adds extra text
            int jsonStart = text.indexOf("{");
            int jsonEnd = text.lastIndexOf("}");

            if (jsonStart == -1 || jsonEnd == -1) {
                log.warn("No JSON object found in Gemini text: {}", text);
                return null;
            }

            String jsonOnly = text.substring(jsonStart, jsonEnd + 1);

            JsonNode inner = objectMapper.readTree(jsonOnly);

            String courseTitle = inner.path("courseTitle").asText(null);

            if (courseTitle == null || courseTitle.isBlank()) {
                log.warn("Gemini returned empty courseTitle");
                return null;
            }

            return courseTitle.trim();

        } catch (Exception e) {
            log.error("Gemini parse error. Raw response: {}", response, e);
            return null;
        }
    }

    private EvaluationStatus mapStatus(double score) {
        if (score >= 85)
            return EvaluationStatus.HIGH_CONFIDENCE_MATCH;
        if (score >= 75)
            return EvaluationStatus.MEDIUM_CONFIDENCE_MATCH;
        if (score >= 60)
            return EvaluationStatus.LOW_CONFIDENCE_MATCH;
        return EvaluationStatus.NO_MATCH;
    }

    private String generateRemarks(double score) {
        if (score >= 85)
            return "Equivalent course found";
        if (score >= 75)
            return "Needs review";
        if (score >= 60)
            return "Low similarity";
        return "Course mismatch";
    }

    private void deleteStudentTranscriptData(Long studentId) {

        List<TranscriptEvaluation> evaluations = evaluationRepository.findByTranscriptStudentId(studentId);

        if (!evaluations.isEmpty()) {
            evaluationRepository.deleteAll(evaluations);
        }

        List<Transcript> transcripts = transcriptRepository.findByStudentId(studentId);

        if (!transcripts.isEmpty()) {
            transcriptRepository.deleteAll(transcripts);
        }
    }

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
                    t.getUpdatedAt());
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
                    c.getUnits());
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
                evaluation.getUpdatedAt());
    }
}