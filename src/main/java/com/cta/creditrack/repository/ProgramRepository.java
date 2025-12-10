package com.cta.creditrack.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cta.creditrack.model.Program;
import java.util.List;
import java.util.Optional;


public interface ProgramRepository extends JpaRepository<Program, Long> {

    Optional<Program> findByName(String name);

}
