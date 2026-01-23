package com.cta.creditrack.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cta.creditrack.model.TransferDetails;
import java.util.List;


@Repository
public interface TransferDetailsRepository extends JpaRepository<TransferDetails, Long> {

    boolean existsByStudentId(Long id);

}
