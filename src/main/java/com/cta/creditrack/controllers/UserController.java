package com.cta.creditrack.controllers;

import com.cta.creditrack.dtos.UserSearchRequest;
import com.cta.creditrack.dtos.UserSearchResult;
import com.cta.creditrack.auth.model.CustomUserDetials;
import com.cta.creditrack.dtos.UpdatePasswordRequest;
import com.cta.creditrack.dtos.UpdateUserProfileRequest;
import com.cta.creditrack.model.Program;
import com.cta.creditrack.model.Role;
import com.cta.creditrack.model.User;
import com.cta.creditrack.repository.UserRepository;
import com.cta.creditrack.services.ProgramService;
import com.cta.creditrack.services.RoleService;
import com.cta.creditrack.services.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.method.P;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final RoleService roleService;
    private final ProgramService programService;
    private final UserRepository userRepository;

    @PostMapping("/search")
    public ResponseEntity<?> searchUsers(
        @RequestParam(defaultValue = "50") Integer pageSize,
        @Valid @RequestBody UserSearchRequest request,
    Pageable pageable) {
        try {
                List<String> sortField = request.sortField();
        List<String> sortDirection = request.sortDirection();

        Sort sort = Sort.unsorted();
            if (request == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Request body cannot be null"));
            }
             if (sortField != null && sortDirection != null && sortField.size() == sortDirection.size()) {
            List<Sort.Order> orders = new ArrayList<>();

            for (int i = 0; i < sortField.size(); i++) {
                orders.add(new Sort.Order(Sort.Direction.fromString(sortDirection.get(i)), sortField.get(i)));
            }

            sort = Sort.by(orders);
        }
        
         Pageable pageableWithSort = PageRequest.of(pageable.getPageNumber(), pageSize, sort);
            
            Page<UserSearchResult> userResults = userService.searchUsers(
                    request, pageableWithSort);
            
            log.info("Successfully retrieved {} user search results", userResults.getSize());
            return ResponseEntity.ok(new PageImpl<>(userResults.getContent(), pageableWithSort, userResults.getTotalElements()));
            
        } catch (IllegalArgumentException e) {
            log.warn("Bad request in user search: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error searching users", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while searching users: " + e.getMessage()));
        }
    }


    @GetMapping("/role-list")
    public ResponseEntity<?> getRoleList() {
        try {
            return ResponseEntity.ok(roleService.getAllRoles());
        } catch (Exception e) {
            log.error("Error retrieving role list", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse("An error occurred while retrieving role list: " + e.getMessage()));
        }
    }

    @GetMapping("program-list")
    public ResponseEntity<?> getProgramList() {
        try {
            return ResponseEntity.ok(programService.getAllPrograms());
        } catch (Exception e) {
            log.error("Error retrieving program list", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse("An error occurred while retrieving program list: " + e.getMessage()));
        }
    }
    
     @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmailExists(
            @RequestParam String email) {

        boolean exists = userService
                .existsByEmailIgnoreCase(email);

        return ResponseEntity.ok(exists);
    }

    @PutMapping("/{userId}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> requestBody) {
        try {
            Boolean isActive = requestBody.get("isActive");
            
            if (isActive == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("isActive field is required"));
            }
            
            userService.updateUserStatus(userId, isActive);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User status updated successfully");
            response.put("userId", userId);
            response.put("isActive", isActive);
            
            log.info("User status updated for user ID: {} to isActive: {}", userId, isActive);
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for user status update: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating user status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while updating user status: " + e.getMessage()));
        }
    }

    @PostMapping("/update-profile")
    public ResponseEntity<?> updateProfile(
            Authentication authentication,
            @RequestPart(value = "profile") @Valid UpdateUserProfileRequest profileRequest,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        try {
             Object principal = authentication.getPrincipal();

        if (!(principal instanceof CustomUserDetials userDetails)) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Invalid principal");
        }
        User user = userRepository
        .findById(userDetails.getUser().getId())
        .orElseThrow(() -> new RuntimeException("User not found"));

            String email = user.getEmail();
            log.info("Attempting to update profile for user: {}", email);

            userService.updateUserProfile(email, profileRequest, imageFile);

            log.info("Profile updated successfully for user: {}", email);
            return ResponseEntity.ok(Map.of(
                    "message", "Profile updated successfully",
                    "email", email,
                    "timestamp", Instant.now()
            ));

        } catch (IllegalArgumentException e) {
            log.warn("Failed to update profile: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", e.getMessage(),
                    "timestamp", Instant.now()
            ));

        } catch (Exception e) {
            log.error("Unexpected error while updating profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "An unexpected error occurred",
                    "timestamp", Instant.now()
            ));
        }
    }
    
    @PostMapping("/update-password")
    public ResponseEntity<?> updatePassword(@Valid @RequestBody UpdatePasswordRequest req) {
        try {
            log.info("Attempting to update password for email: {}", req.email());
            
            userService.updatePassword(req.email(), req.currentPassword(), req.newPassword());
            
            log.info("Password updated successfully for email: {}", req.email());
            return ResponseEntity.ok(Map.of(
                    "message", "Password updated successfully",
                    "email", req.email(),
                    "timestamp", Instant.now()
            ));
            
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update password: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", e.getMessage(),
                    "timestamp", Instant.now()
            ));
            
        } catch (Exception e) {
            log.error("Unexpected error while updating password", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "An unexpected error occurred",
                    "timestamp", Instant.now()
            ));
        }
    }
    
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", "error");
        errorResponse.put("message", message);
        errorResponse.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return errorResponse;
    }

}
