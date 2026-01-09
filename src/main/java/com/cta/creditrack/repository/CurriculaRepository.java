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
            SELECT *
            FROM cta_curricula
            WHERE (:programCodes IS NULL OR program_code IN (:programCodes))
              AND (:years IS NULL OR year IN (:years))
              AND (:semesters IS NULL OR semester IN (:semesters))
              AND (:courseCodes IS NULL OR course_code IN (:courseCodes))
              AND (
                   :search IS NULL
                   OR course_title LIKE %:search%
                   OR course_code LIKE %:search%
              )
            """, nativeQuery = true)
    List<Object[]> searchCurricula(
            @Param("programCodes") List<String> programCodes,
            @Param("years") List<String> years,
            @Param("semesters") List<String> semesters,
            @Param("courseCodes") List<String> courseCodes,
            @Param("search") String search);

}
