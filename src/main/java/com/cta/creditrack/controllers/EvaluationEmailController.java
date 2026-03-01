package com.cta.creditrack.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.cta.creditrack.auth.model.CustomUserDetials;
import com.cta.creditrack.dtos.SendEvaluationEmailRequest;
import com.cta.creditrack.model.User;
import com.cta.creditrack.repository.UserRepository;
import com.cta.creditrack.services.EmailService;
import java.util.Map;

@RestController
@RequestMapping("/api/evaluation-email")
@RequiredArgsConstructor
@Slf4j
public class EvaluationEmailController {

    private final EmailService emailService;
    private final UserRepository userRepository;

    @PostMapping("/send")
    public ResponseEntity<?> sendEmail(
            @RequestBody SendEvaluationEmailRequest request,
            Authentication authentication) {

        try {
            CustomUserDetials userDetails =
                    (CustomUserDetials) authentication.getPrincipal();

            User sender = userRepository.findById(
                    userDetails.getUser().getId()
            ).orElseThrow(() -> new RuntimeException("User not found"));

            log.info("Sending evaluation email for students: {} to: {}", request.studentIds(), request.recipientEmail());
            
            emailService.sendEvaluationEmail(
                    request.studentIds(),
                    request.recipientEmail(),
                    sender
            );

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Email sent successfully"
            ));
        } catch (Exception e) {
            log.error("Error sending evaluation email", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }
}