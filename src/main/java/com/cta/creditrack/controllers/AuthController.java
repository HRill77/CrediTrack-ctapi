package com.cta.creditrack.controllers;

import com.cta.creditrack.dtos.*;
import com.cta.creditrack.model.User;
import com.cta.creditrack.repository.UserRepository;
import com.cta.creditrack.services.AuthService;
import com.cta.creditrack.services.UserService;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.*;
import com.cta.creditrack.services.BruteForceProtectionService;
import com.cta.creditrack.auth.model.CustomUserDetials;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authManager;
    private final BruteForceProtectionService bruteForceService;
    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
       try {
         User user = authService.registerUser(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                "User registered with email: " + user.getEmail());
       } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            Map.of("error", e.getMessage())
        );
    }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        String clientIp = httpRequest.getRemoteAddr();
        // Check if the user is blocked due to too many failed attempts
        if (bruteForceService.isBlocked(req.username(), clientIp)) {
            long remainingSeconds = bruteForceService.getRemainingBlockTimeSeconds(req.username(), clientIp);//
            long remainingMinutes = (remainingSeconds + 59) / 60; // Round up
            
            ApiErrorResponse error = new ApiErrorResponse(
                429,
                "Too Many Requests",
                String.format("Too many failed login attempts. Please try again in %d minute(s).", remainingMinutes),
                httpRequest.getRequestURI()
            );
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
        }

        try {
            // 0) Authenticate the user
            // This will throw BadCredentialsException if authentication fails
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            req.username(), req.password()));

            // 1) Create SecurityContext + set Authentication
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);

            bruteForceService.loginSucceeded(req.username(), clientIp);

            // 2) Session fixation protection: invalidate old, create new
            HttpSession oldSession = httpRequest.getSession(false);
            if (oldSession != null) {
                oldSession.invalidate();
            }
            HttpSession newSession = httpRequest.getSession(true);

            // 3) SAVE SecurityContext into the HttpSession
            newSession.setAttribute(
                    HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                    context);

            String sessionId = newSession.getId();

            CustomUserDetials userDetails = (CustomUserDetials) auth.getPrincipal();
            Set<String> roles = userDetails.getAuthorities()
                    .stream().map(a -> a.getAuthority()).collect(Collectors.toSet());

            Instant expiresAt = Instant.now().plusSeconds(newSession.getMaxInactiveInterval());
            log.info("User '{}' logged in. Session ID: {}", req.username(), sessionId);
            log.info("User roles: {}", roles);
            log.info("Session expires at: {}", expiresAt);
            
            // 4) Set session ID in HttpOnly cookie
            Cookie sessionCookie = new Cookie("JSESSIONID", sessionId);
            sessionCookie.setPath("/");
            sessionCookie.setHttpOnly(true);
            sessionCookie.setMaxAge(-1); // Session cookie
            httpResponse.addCookie(sessionCookie);

            LoginResponse response = new LoginResponse("Login successful");

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException ex) {
            bruteForceService.loginFailed(req.username(), clientIp);
            throw ex;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session != null) {
            log.info("Logging out session ID: {}", session.getId());
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    // @GetMapping("/me")
    // public ResponseEntity<?> me(Authentication authentication, HttpSession session, HttpServletRequest request) {
    //     log.info("GET /me - Authentication: {}, Session ID: {}", authentication,
    //             session != null ? session.getId() : "null");

    //     if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetials userDetails)) {
    //         log.warn("No authentication found or invalid principal type");
    //         return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
    //                 new Object() {
    //                     public final String error = "Unauthorized";
    //                     public final String message = "No valid authentication found";
    //                 });
    //     }

    //     log.info("User authenticated: {}", userDetails.getUsername());
    //     return ResponseEntity.ok(
    //             new Object() {
    //                 public final String username = userDetails.getUsername();
    //                 public final String email = userDetails.getEmail();
    //                 public final String sessionId = session != null ? session.getId() : null;
    //             });
    // }

    @PostMapping("/renew-session")
    public ResponseEntity<?> renewSession(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        req.changeSessionId();
        return ResponseEntity.ok(
                new Object() {
                    public final String newSessionId = req.getSession(false).getId();
                });
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Not authenticated");
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof CustomUserDetials userDetails)) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Invalid principal");
        }
       User user = userRepository
        .findById(userDetails.getUser().getId())
        .orElseThrow(() -> new RuntimeException("User not found"));

    if (user == null) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("User data not found");
    }

         String middleInitial = (user.getMiddlename() != null && !user.getMiddlename().isBlank())
            ? user.getMiddlename().substring(0, 1).toUpperCase() + "."
            : "";

    String fullName = String.format("%s, %s %s",
            user.getLastname() != null ? user.getLastname() : "",
            user.getFirstname() != null ? user.getFirstname() : "",
            middleInitial).trim();

    return ResponseEntity.ok(Map.of(
            "username", userDetails.getUsername(),
            "fullName", fullName,
            "programs", user.getPrograms() != null 
                ? user.getPrograms().stream()
                    .map(p -> Map.of(
                        "id", p.getId(),
                        "name", p.getName() != null ? p.getName() : "",
                        "code", p.getCode() != null ? p.getCode() : ""
                    ))
                    .toList()
                : List.of(),
            "authorities", userDetails.getAuthorities()
                    .stream()
                    .map(GrantedAuthority::getAuthority)
                    .toList(),
            "filename", user.getFilename() != null ? user.getFilename() : "",
            "fileType", user.getFileType() != null ? user.getFileType() : "",
            "fileData", user.getFileData() != null ? user.getFileData() : new byte[0],
            "fileSize", user.getFileSize() != null ? user.getFileSize() : 0L));

    }


    @PostMapping("/update-temp-password")
    public ResponseEntity<?> updateTemporaryPassword(@Valid @RequestBody UpdatePasswordRequest req) {
        try {
            log.info("Attempting to update temporary password for email: {}", req.email());
            
            userService.checkAndUpdateTemporaryPassword(req.email(), req.currentPassword(), req.newPassword());
            
            log.info("Temporary password updated successfully for email: {}", req.email());
            return ResponseEntity.ok(Map.of(
                    "message", "Password updated successfully",
                    "email", req.email()
            ));
            
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update temporary password: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", e.getMessage(),
                    "timestamp", Instant.now()
            ));
            
        } catch (Exception e) {
            log.error("Unexpected error while updating temporary password", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "An unexpected error occurred",
                    "timestamp", Instant.now()
            ));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> resetPasswordByEmail(@Valid @RequestBody ForgotPasswordRequest req) {
        try {
            log.info("Attempting to send temporary password to email: {}", req.email());
            
            userService.resetPasswordByEmail(req.email());
            
            log.info("Temporary password sent successfully to email: {}", req.email());
            return ResponseEntity.ok(Map.of(
                    "message", "Temporary password has been sent to your email",
                    "email", req.email(),
                    "expiresIn", "24 hours"
            ));
            
        } catch (IllegalArgumentException e) {
            log.warn("Failed to send temporary password: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", e.getMessage(),
                    "timestamp", Instant.now()
            ));
            
        } catch (Exception e) {
            log.error("Unexpected error while sending temporary password", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "An unexpected error occurred",
                    "timestamp", Instant.now()
            ));
        }
    }

    @GetMapping("/check-temp-password")
    public ResponseEntity<?> checkTemporaryPassword(@RequestParam String email,
        @RequestParam String tempPassword
    ) {
        try {
            log.info("Checking temporary password status for email: {}", email);
            
            boolean needsUpdate = userService.hasTemporaryPasswordToUpdate(email, tempPassword);
            
            String message = needsUpdate 
                    ? "User has a temporary password that needs to be updated" 
                    : "User does not have a temporary password or password is already permanent";
            
            TemporaryPasswordCheckResponse response = new TemporaryPasswordCheckResponse(
                    email,
                    needsUpdate,
                    message
            );
            
            log.info("Temporary password check completed for {}: updateTempPassword={}", email, needsUpdate);
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("User not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", e.getMessage(),
                    "timestamp", Instant.now()
            ));
            
        } catch (Exception e) {
            log.error("Unexpected error while checking temporary password", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "An unexpected error occurred",
                    "timestamp", Instant.now()
            ));
        }
    }

    



}
