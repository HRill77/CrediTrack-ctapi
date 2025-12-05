package com.cta.creditrack.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cta.creditrack.model.Role;
import com.cta.creditrack.repository.RoleRepository;

import java.util.*;

@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    public void insertPredefinedRoles() {

        List<Role> predefinedRoles = getPredefinedRoles();
        for (Role role : predefinedRoles) {
            if (!roleRepository.findByRoleName(role.getRoleName()).isPresent()) {
                roleRepository.save(role);
            }
        }
    }

    private List<Role> getPredefinedRoles() {
        // Implementation for getting predefined roles
        return Arrays.asList(new Role(null, "ROLE_PROGRAM_HEAD"),
        new Role(null, "ROLE_SUPER_ADMIN"),
        new Role(null, "ROLE_ADMIN"),
        new Role(null, "ROLE_USER"));
    }

}
