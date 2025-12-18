package com.cta.creditrack.services;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cta.creditrack.auth.model.CustomUserDetials;
import com.cta.creditrack.dtos.RegisterRequest;
import com.cta.creditrack.enums.RoleName;
import com.cta.creditrack.model.Program;
import com.cta.creditrack.model.Role;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.model.User;
import com.cta.creditrack.repository.ProgramRepository;
import com.cta.creditrack.repository.RoleRepository;
import com.cta.creditrack.repository.UserRepository;
import com.cta.creditrack.utils.PasswordGenerator;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final ProgramRepository programRepo;
    private final TransactionService transactionService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

     @Transactional
    public User registerUser(RegisterRequest req) {
        if (userRepo.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email already in use");
        }

        Long roleId = req.roleId();
        Long programId = req.programId();

        Role defaultRole = roleRepo.findById(roleId)
                .orElseThrow(() -> new IllegalStateException("Default role not found"));
       
        String tempPassword = PasswordGenerator.generatePassword(8);
        User user = User.builder()
                .email(req.email())
                .firstname(req.firstname())
                .middlename(req.middlename())
                .lastname(req.lastname())
                .suffix(req.suffix())
                .password(passwordEncoder.encode(tempPassword))
                .mustChangePassword(true)
                .isActive(true)
                .build();
        user.getRoles().add(defaultRole);

        // Only add program if programId is not null
        if (programId != null) {
            Program program = programRepo.findById(programId)
                    .orElseThrow(() -> new IllegalStateException("Program not found"));
            user.getPrograms().add(program);
        }

        User savedUser = userRepo.save(user);

        emailService.sendTemporaryPasswordEmail(
            savedUser.getEmail(), 
            tempPassword
        );
        

        // Post transaction for user registration
        try {
              Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Long currentUserId = null;
            
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof CustomUserDetials) {
                CustomUserDetials userDetails = (CustomUserDetials) auth.getPrincipal();
                currentUserId = userDetails.getUser().getId();
            }

            Transaction transaction = new Transaction();
            transaction.setActionDetails("User registered - Email: " + savedUser.getEmail() + 
                                       ", Name: " + savedUser.getFirstname() + " " + savedUser.getLastname() +
                                       ", Role ID: " + roleId + ", Program ID: " + programId);
            transaction.setActionType("USER_REGISTRATION");
            transactionService.postTransaction(transaction, currentUserId);
        } catch (Exception e) {
            // Log transaction error but don't fail the registration
            throw new RuntimeException("User registered but failed to log transaction: " + e.getMessage(), e);
        }

        return savedUser;
    }
}
