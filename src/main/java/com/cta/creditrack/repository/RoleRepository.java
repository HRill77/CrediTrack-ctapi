package com.cta.creditrack.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cta.creditrack.enums.RoleName;
import com.cta.creditrack.model.Role;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByRoleName(RoleName roleName);
}
