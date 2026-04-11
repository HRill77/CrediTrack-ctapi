package com.cta.creditrack.services;

import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.cta.creditrack.dtos.ApprovalsDTO;
import com.cta.creditrack.dtos.CurriculaDTO;
import com.cta.creditrack.dtos.EvaluationItem;
import com.cta.creditrack.dtos.FileUploadDTO;
import com.cta.creditrack.dtos.TranscriptDTO2;
import com.cta.creditrack.dtos.TranscriptEvaluationGroupedResponse;
import com.cta.creditrack.dtos.TranscriptEvaluationSearchRequest;

import com.cta.creditrack.dtos.UpsertTranscriptEvaluationRequest;
import com.cta.creditrack.dtos.UserProgramDetailsDto;
import com.cta.creditrack.model.Approvals;
import com.cta.creditrack.model.Curricula;
import com.cta.creditrack.model.ManualCredit;
import com.cta.creditrack.model.Program;
import com.cta.creditrack.model.Student;
import com.cta.creditrack.model.Transcript;
import com.cta.creditrack.model.TranscriptEvaluation;
import com.cta.creditrack.model.User;
import com.cta.creditrack.repository.ApprovalsRepository;
import com.cta.creditrack.repository.CurriculaRepository;
import com.cta.creditrack.repository.ManualCreditRepository;
import com.cta.creditrack.repository.ProgramRepository;
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
    private final ApprovalsRepository approvalsRepository;
    private final ProgramRepository programRepository;
    private final ManualCreditRepository manualCreditRepository;

    public Page<TranscriptEvaluationGroupedResponse> searchTranscriptEvaluations(
            TranscriptEvaluationSearchRequest request,
            Pageable pageable,
            User user) {

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
                    request.toProgram());

            log.info("rows {}", rows);

            if (rows == null || rows.isEmpty()) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }

            Map<Long, TranscriptEvaluationGroupedResponse> grouped = new LinkedHashMap<>();

            List<Approvals> allApprovals = approvalsRepository.findByUserId(user.getId());
            Map<Long, ApprovalsDTO> approvalsMap = allApprovals.stream()
                    .collect(Collectors.toMap(
                            a -> a.getStudent().getId(),
                            a -> new ApprovalsDTO(
                                    a.getId(),
                                    a.getApprovedDate(),
                                    a.getStudent().getId(),
                                    a.getUser().getId()),
                            (a, b) -> a));

            // Get user's program codes/names for filtering
            Long ids = user.getId();
            List<Object[]> userProgramDetailsOpt = programRepository.findProgramsByUserId(ids);
            List<UserProgramDetailsDto> userProgramDetails = userProgramDetailsOpt.stream()
                    .map(row -> new UserProgramDetailsDto(
                            ((Number) row[0]).longValue(),
                            ((Number) row[1]).longValue(),
                            (String) row[2],
                            (String) row[3]))
                    .collect(Collectors.toList());

            String userProgramNames;
            if (!userProgramDetails.isEmpty()) {
                userProgramNames = userProgramDetails.get(0).name().toUpperCase();
            } else {
                userProgramNames = "";
            }
            log.info("userProgramNames{}", userProgramNames);
            log.info("User {} has access to programs: {}", user.getEmail(), userProgramNames);
            for (Object[] row : rows) {

                if (row == null)
                    continue;

                Long studentId = (Long) row[27];

                if (studentId == null)
                    continue;

                // Filter based on user's assigned programs
                String studentToProgram = (String) row[37];

                // log.info("Evaluating student {} with program {} against user programs {}",
                // studentId, studentToProgram,
                // userProgramNames);

                if (studentToProgram == null) {
                    continue;
                }

                if (!userProgramNames.contains(studentToProgram.toUpperCase())) {
                    continue;
                }

                FileUploadDTO fileUpload = null;

                if (row[39] != null) {
                    fileUpload = new FileUploadDTO(
                            (Long) row[39],
                            (String) row[40],
                            (String) row[41],
                            row[42] != null ? ((Number) row[42]).longValue() : null,
                            (String) row[43],
                            (String) row[44],
                            row[45] != null ? ((Number) row[45]).longValue() : null,
                            row[46] != null ? ((Timestamp) row[46]).toLocalDateTime() : null);
                }

                ApprovalsDTO approvalsDTO = null;
                approvalsDTO = approvalsMap.get(studentId);
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
                                (String) row[35],
                                (String) row[36],
                                (String) row[37],
                                fileUpload,
                                new ArrayList<>(),
                                approvalsDTO));

                TranscriptDTO2 transcript = new TranscriptDTO2(
                        (Long) row[8],
                        (String) row[9],
                        (String) row[10],
                        (String) row[11],
                        (String) row[12],
                        row[13] != null ? ((Number) row[13]).intValue() : null,
                        row[14] != null ? ((Timestamp) row[14]).toLocalDateTime() : null,
                        row[15] != null ? ((Timestamp) row[15]).toLocalDateTime() : null);

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
                        row[26] != null ? ((Number) row[26]).intValue() : null);

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
                        row[7] != null ? ((Timestamp) row[7]).toLocalDateTime() : null);

                grouped.get(studentId).evaluation().add(evaluation);
            }

            List<TranscriptEvaluationGroupedResponse> result = new ArrayList<>(grouped.values());

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
            UpsertTranscriptEvaluationRequest request, User user) {

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
            // TRANSCRIPT (CREATE OR UPDATE)
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

            if ("Edited".equals(evaluation.getRemarks())) {
                Optional<Curricula> curriculaOpt = curriculaRepository.findById(item.curriculaId());
                curriculaOpt.ifPresent(curricula -> {

                    Optional<ManualCredit> manualCreditOpt = manualCreditRepository
                            .findByTranscriptSubjectCodeAndTranscriptCourseNameAndTranscriptUnitsAndProgram(
                                    item.subjectCode(),
                                    item.courseName(),
                                    item.units(),
                                    curricula.getProgramTitle());
                    if (manualCreditOpt.isEmpty()) {
                        ManualCredit manualCredit = new ManualCredit();
                        manualCredit.setTranscriptCourseName(item.courseName());
                        manualCredit.setTranscriptSubjectCode(item.subjectCode());
                        manualCredit.setTranscriptUnits(item.units());
                        manualCredit.setCurriculumCourseName(curricula.getCourseTitle());
                        manualCredit.setCurriculumSubjectCode(curricula.getCourseCode());
                        manualCredit.setProgram(curricula.getProgramTitle());
                        manualCredit.setCurriculumUnits(curricula.getUnits());
                        manualCreditRepository.save(manualCredit);
                    } else {
                        ManualCredit existing = manualCreditOpt.get();
                        existing.setCurriculumCourseName(curricula.getCourseTitle());
                        existing.setCurriculumSubjectCode(curricula.getCourseCode());
                        existing.setProgram(curricula.getProgramTitle());
                        existing.setCurriculumUnits(curricula.getUnits());
                        manualCreditRepository.save(existing);
                    }
                });

            }

            // Check if approval already exists for student and user
            if (approvalsRepository.existsByStudentIdAndUserId(student.getId(), user.getId())) {
                // Update existing approval
                List<Approvals> existingApprovals = approvalsRepository.findByStudentIdAndUserId(
                        student.getId(), user.getId());
                if (!existingApprovals.isEmpty()) {
                    Approvals approval = existingApprovals.get(0);
                    approvalsRepository.save(approval);
                }
            } else {
                // Create new approval
                Approvals approval = new Approvals();
                approval.setStudent(student);
                approval.setUser(user);
                approvalsRepository.save(approval);
            }

        }
    }

    private ApprovalsDTO getApprovalsDTOByStudentAndUser(Long studentId, Long userId) {
        List<Approvals> approvals = approvalsRepository.findByStudentIdAndUserId(studentId, userId);
        if (!approvals.isEmpty()) {
            Approvals approval = approvals.get(0);
            return new ApprovalsDTO(
                    approval.getId(),
                    approval.getApprovedDate(),
                    approval.getStudent().getId(),
                    approval.getUser().getId());
        }
        return null;
    }

    public TranscriptEvaluationGroupedResponse getEvaluationByStudentId(Long studentId, User user) {

        TranscriptEvaluationSearchRequest req = new TranscriptEvaluationSearchRequest(null, null, null, null, null,
                null);

        Page<TranscriptEvaluationGroupedResponse> page = searchTranscriptEvaluations(req,
                PageRequest.of(0, 100),
                user);

        return page.getContent().stream()
                .filter(r -> r.studentId().equals(studentId))
                .findFirst()
                .orElseThrow();
    }

}