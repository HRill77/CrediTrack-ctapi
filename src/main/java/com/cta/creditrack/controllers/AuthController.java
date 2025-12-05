package com.cta.creditrack.controllers;

import com.cta.creditrack.dtos.*;
import com.cta.creditrack.model.User;

import com.cta.creditrack.services.AuthService;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import com.cta.creditrack.services.BruteForceProtectionService;
import com.cta.creditrack.utils.AuthUtil;
import com.cta.creditrack.auth.model.CustomUserDetials;

import java.time.Instant;
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

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        User user = authService.registerUser(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            "User registered with email: " + user.getEmail()
        );
    }

   @PostMapping("/login")
public ResponseEntity<LoginResponse> login(
        @Valid @RequestBody LoginRequest req,
        HttpServletRequest httpRequest,
        HttpServletResponse httpResponse) {

    String clientIp = httpRequest.getRemoteAddr();

    if (bruteForceService.isBlocked(req.username(), clientIp)) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
    }

    try {
        Authentication auth = authManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                req.username(), req.password())
        );

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
            context
        );

        String sessionId = newSession.getId();

        CustomUserDetials userDetails =  (CustomUserDetials) auth.getPrincipal();
        Set<String> roles = userDetails.getAuthorities()
                .stream().map(a -> a.getAuthority()).collect(Collectors.toSet());

        Instant expiresAt = Instant.now().plusSeconds(newSession.getMaxInactiveInterval());
        log.info("User '{}' logged in. Session ID: {}", req.username(), sessionId);
        log.info("User roles: {}", roles);
        log.info("Session expires at: {}", expiresAt);

        // Actually, hindi mo na kailangan ito, Tomcat/Undertow na magse-set ng cookie,
        // pero ok lang kung gusto mong explicit:
        jakarta.servlet.http.Cookie sessionCookie = new jakarta.servlet.http.Cookie("JSESSIONID", sessionId);
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

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication, HttpSession session, HttpServletRequest request) {
        log.info("GET /me - Authentication: {}, Session ID: {}", authentication, session != null ? session.getId() : "null");
        
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetials userDetails)) {
            log.warn("No authentication found or invalid principal type");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                new Object() {
                    public final String error = "Unauthorized";
                    public final String message = "No valid authentication found";
                }
            );
        }
        
        log.info("User authenticated: {}", userDetails.getUsername());
        return ResponseEntity.ok(
            new Object() {
                public final String username = userDetails.getUsername();
                public final String email = userDetails.getEmail();
                public final String sessionId = session != null ? session.getId() : null;
            }
        );
    }

    @PostMapping("/renew-session")
    public ResponseEntity<?> renewSession(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        req.changeSessionId();
        return ResponseEntity.ok(
            new Object() { public final String newSessionId = req.getSession(false).getId(); }
        );
    }

  @GetMapping("/userInfo")
public ResponseEntity<?> userInfo(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
        return ResponseEntity.status(401).body("Not authenticated");
    }

    return ResponseEntity.ok(Map.of(
            "username", authentication.getName(),
            "authorities", authentication.getAuthorities()
    ));
}

}
