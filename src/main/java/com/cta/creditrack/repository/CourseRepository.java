package com.cta.creditrack.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cta.creditrack.model.Course;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByCourseNameIgnoreCaseAndSyllabusVersion(String courseName, Integer syllabusVersion);
    
     Optional<Course> findByCourseNameIgnoreCase(String courseName);

    boolean existsByCourseName(String courseName);

    @Query(value = "SELECT * FROM cta_course WHERE LOWER(course_name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))", nativeQuery = true)
    List<Course> searchCourseByName(@Param("searchTerm") String searchTerm);
}
