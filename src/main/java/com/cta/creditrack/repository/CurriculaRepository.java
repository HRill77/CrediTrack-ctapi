package com.cta.creditrack.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cta.creditrack.model.Curricula;

import java.util.List;
import java.util.Optional;

@Repository
public interface CurriculaRepository extends JpaRepository<Curricula, Long> {

    Optional<Curricula> findByCourseCode(String courseCode);
    Optional<Curricula> findByProgramCodeAndProgramTitleAndCourseCodeAndCourseTitle(
        String programCode,
        String programTitle,
        String courseCode,
        String courseTitle
    );
    
    @Query("SELECT DISTINCT c.programCode FROM Curricula c ORDER BY c.programCode ASC")
    List<String> findDistinctProgramCodes();

    @Query("SELECT DISTINCT c.year FROM Curricula c ORDER BY c.year ASC")
    List<String> findDistinctYears();

    @Query("SELECT DISTINCT c.semester FROM Curricula c ORDER BY c.semester ASC")
    List<String> findDistinctSemesters();

    @Query("SELECT DISTINCT c.courseCode FROM Curricula c ORDER BY c.courseCode ASC")
    List<String> findDistinctCourseCodes();

    // Query by Program
    List<Curricula> findByProgramCode(String programCode);

    List<Curricula> findByProgramTitle(String programTitle);

    // Query by Year and Semester
    List<Curricula> findByYear(String year);

    List<Curricula> findBySemester(String semester);

    List<Curricula> findByYearAndSemester(String year, String semester);

    List<Curricula> findByProgramCodeAndYearAndSemester(String programCode, String year, String semester);

    // Query by Course
    List<Curricula> findByCourseTitle(String courseTitle);

    List<Curricula> findByPreRequisite(String preRequisite);

    // Advanced Search Queries
    @Query("SELECT c FROM Curricula c WHERE c.programTitle LIKE %:searchText% OR c.courseTitle LIKE %:searchText% OR c.courseCode LIKE %:searchText%")
    List<Curricula> searchByText(String searchText);

    @Query("SELECT c FROM Curricula c WHERE c.courseTitle LIKE %:courseTitle% ORDER BY c.courseTitle ASC")
    List<Curricula> searchByCourseTitle(String courseTitle);

    @Query("SELECT c FROM Curricula c WHERE c.year = :year AND c.semester = :semester ORDER BY c.courseCode ASC")
    List<Curricula> findCurriculaByYearAndSemester(String year, String semester);

    @Query("SELECT c FROM Curricula c WHERE c.programCode = :programCode AND c.year = :year ORDER BY c.semester ASC, c.courseCode ASC")
    List<Curricula> findCurriculaByProgramAndYear(String programCode, String year);

    @Query("SELECT c FROM Curricula c WHERE c.programCode = :programCode ORDER BY c.year ASC, c.semester ASC")
    List<Curricula> findAllByProgram(String programCode);

    @Query(value = """
            SELECT cr.id, cr.program_title, cr.program_code, cr.year, cr.semester,
                   cr.course_code, cr.course_title, cr.pre_requisite,
                   cr.lec, cr.lab, cr.units
            FROM cta_curricula cr
            WHERE (COALESCE(?1) IS NULL OR program_code IN (?1))
              AND (COALESCE(?2) IS NULL OR year IN (?2))
              AND (COALESCE(?3) IS NULL OR semester IN (?3))
              AND (COALESCE(?4) IS NULL OR course_code IN (?4))
              AND (
                   ?5  IS NULL
                   OR course_title LIKE CONCAT('%', ?5, '%')
                   OR course_code LIKE CONCAT('%', ?5, '%')
              )
            """, nativeQuery = true)
    List<Object[]> searchCurricula(
            List<String> programCodes,
            List<String> years,
            List<String> semesters,
            List<String> courseCodes,
            String search);

}
