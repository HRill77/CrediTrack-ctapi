package com.cta.creditrack.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cta.creditrack.model.Curricula;
import java.util.List;
import java.util.Optional;


@Repository
public interface CurriculaRepository extends JpaRepository<Curricula, Long> {

    Optional<Curricula> findByCourseCode(String courseCode);

}
