package com.cta.creditrack.services;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cta.creditrack.dtos.RegisterRequest;
import com.cta.creditrack.enums.RoleName;
import com.cta.creditrack.model.Role;
import com.cta.creditrack.model.User;
import com.cta.creditrack.repository.RoleRepository;
import com.cta.creditrack.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(RegisterRequest req) {
        if (userRepo.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email already in use");
        }

        RoleName roleName = req.role() != null ? req.role() : RoleName.ROLE_USER;

        Role defaultRole = roleRepo.findByRoleName(roleName)
            .orElseThrow(() -> new IllegalStateException("Default role not found"));

        User user = User.builder()
            .email(req.email())
            .firstname(req.firstname())
            .middlename(req.middlename())
            .lastname(req.lastname())
            .password(passwordEncoder.encode(req.password()))
            .isActive(true)
            .build();
        user.getRoles().add(defaultRole);

        return userRepo.save(user);
    }
}

