package com.cta.creditrack.repository;

import com.cta.creditrack.model.EmailWhitelisting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.util.List;
import java.util.Optional;

@Repository
public interface EmailWhitelistingRepository extends JpaRepository<EmailWhitelisting, Long> {

    Optional<EmailWhitelisting> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query(value = 
        """
        SELECT * FROM cta_whitelisting WHERE
        (:searchTerm IS NULL OR LOWER(email) LIKE LOWER(CONCAT('%', :searchTerm, '%')))
        """, nativeQuery = true)
    List<EmailWhitelisting> searchByEmail(
        @Param("searchTerm") String searchTerm);
    
    Optional<EmailWhitelisting> findByEmail(String email);
}