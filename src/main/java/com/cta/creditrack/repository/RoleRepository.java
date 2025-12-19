package com.cta.creditrack.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cta.creditrack.enums.RoleName;
import com.cta.creditrack.model.Role;
import java.util.List;


public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByRoleName(RoleName roleName);

    Optional<Role> findById(Long id);
}
