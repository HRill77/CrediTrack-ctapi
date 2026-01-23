package com.cta.creditrack.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cta.creditrack.model.FileUpload;
import java.util.List;
import java.util.Optional;

@Repository
public interface FileUploadRepository extends JpaRepository<FileUpload, Long> {

    List<FileUpload> findByStudentId(Long studentId);

    Optional<FileUpload> findByIdAndStudentId(Long id, Long studentId);
}
