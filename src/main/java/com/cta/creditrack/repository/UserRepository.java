package com.cta.creditrack.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.cta.creditrack.model.User;
import java.util.*;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);
    // boolean existsByEmployeeNumber(String employeeNumber);

    // Optional<User> findByEmployeeNumber(String employeeNumber);
    Optional<User> findByEmail(String email);
}
