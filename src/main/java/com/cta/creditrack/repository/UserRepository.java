package com.cta.creditrack.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.cta.creditrack.model.User;
import java.util.*;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);
    // boolean existsByEmployeeNumber(String employeeNumber);

    boolean existsByEmailIgnoreCase(String email);

    
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    @Query( value = """
            SELECT 
            u.id, u.firstname, u.middlename, u.lastname, u.email, u.is_active, p.name AS program,
            r.role_name AS role, u.created_at, u.updated_at
            FROM cta_user u
            LEFT JOIN cta_users_roles ur ON u.id = ur.user_id
            LEFT JOIN cta_role r  ON ur.role_id = r.id
            LEFT JOIN cta_users_program up ON u.id = up.user_id
            LEFT JOIN cta_program p  ON up.program_id = p.id
            WHERE(
            :searchText IS NULL 
            OR CONCAT_WS(' ', u.firstname, u.middlename, u.lastname) 
               LIKE CONCAT('%', :searchText, '%'))
            AND ( :programId IS NULL 
            OR up.program_id = :programId)
            AND (
            :roleId IS NULL 
            OR ur.role_id = :roleId
            )   """,nativeQuery = true)
    List<Object[]> searchUsers(String searchText, Long programId, Long roleId);

}
