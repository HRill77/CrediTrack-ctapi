package com.cta.creditrack.repository;

import org.apache.commons.lang3.text.translate.NumericEntityUnescaper.OPTION;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cta.creditrack.model.TransferDetails;
import java.util.List;
import java.util.Optional;


@Repository
public interface TransferDetailsRepository extends JpaRepository<TransferDetails, Long> {

    boolean existsByStudentId(Long id);
    Optional<TransferDetails> findByStudentId(Long studentId);

}
