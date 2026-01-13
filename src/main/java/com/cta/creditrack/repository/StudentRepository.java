package com.cta.creditrack.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cta.creditrack.model.Student;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

}
