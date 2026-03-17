package com.cta.creditrack.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cta.creditrack.dtos.UserProgramDetailsDto;
import com.cta.creditrack.model.Program;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProgramRepository extends JpaRepository<Program, Long> {

    Optional<Program> findByName(String name);

    @Query(value=
        """
         SELECT cup.program_id, cup.user_id, cp.code, cp.name FROM cta_users_program cup 
         LEFT JOIN cta_program cp on cup.program_id = cp.id
         WHERE cup.user_id  = :userId;
    """, nativeQuery = true)
    List<Object[]> findProgramsByUserId(@Param("userId") Long userId);

}
