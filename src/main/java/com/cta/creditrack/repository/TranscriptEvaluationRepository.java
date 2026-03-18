package com.cta.creditrack.repository;

import com.cta.creditrack.model.TranscriptEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TranscriptEvaluationRepository extends JpaRepository<TranscriptEvaluation, Long> {

        List<TranscriptEvaluation> findByTranscriptStudentId(Long studentId);

        boolean existsByTranscriptId(Long transcriptId);

        @Query(value = """
                        SELECT
                            te.id,
                            te.confidence_score,
                            te.evaluation_status,
                            te.decision_type,
                            te.final_approved,
                            te.remarks,
                            te.created_at,
                            te.updated_at,

                            t.id,
                            t.year,
                            t.subject_code,
                            t.course_name,
                            t.grade,
                            t.credits,
                            t.created_at,
                            t.updated_at,

                            c.id,
                            c.program_title,
                            c.program_code,
                            c.year,
                            c.semester,
                            c.course_code,
                            c.course_title,
                            c.pre_requisite,
                            c.lec,
                            c.lab,
                            c.units,

                            s.id,
                            s.firstname,
                            s.middlename,
                            s.lastname,
                            s.suffix,
                            s.year_level,
                            s.email,

                            td.from_university,
                            td.from_program,
                            td.to_university,
                            td.to_program,
                            td.to_college,

                            fu.id,
                            fu.tor_filename,
                            fu.tor_file_type,
                            fu.tor_file_size,
                            fu.cd_filename,
                            fu.cd_file_type,
                            fu.cd_file_size,
                            fu.upload_date

                        FROM cta_transcript_evaluation te
                        LEFT JOIN cta_transcript t ON te.transcript_id = t.id
                        LEFT JOIN cta_curricula c ON te.curriculum_subject_id = c.id
                        LEFT JOIN cta_student s ON t.student_id = s.id
                        LEFT JOIN cta_transfer_details td ON td.student_id = s.id
                        LEFT JOIN cta_file_upload fu ON fu.student_id = s.id

                        WHERE (?1 IS NULL OR LOWER(CONCAT(
                                COALESCE(s.firstname,''),' ',
                                COALESCE(s.middlename,''),' ',
                                COALESCE(s.lastname,'')
                        )) LIKE LOWER(CONCAT('%', ?1, '%')))
                        AND (?2 IS NULL OR td.from_program LIKE CONCAT('%', ?2, '%'))
                        AND (?3 IS NULL OR td.from_university LIKE CONCAT('%', ?3, '%'))
                        AND (?4 IS NULL OR td.to_program LIKE CONCAT('%', ?4, '%'))
                        """, nativeQuery = true)
        List<Object[]> searchTranscriptEvaluations(
                        String studentName,
                        String fromProgram,
                        String fromUniversity,
                        String toProgram);
}