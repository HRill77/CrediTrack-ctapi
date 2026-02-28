package com.cta.creditrack.controllers;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.cta.creditrack.auth.model.CustomUserDetials;
import com.cta.creditrack.dtos.TranscriptEvaluationGroupedResponse;
import com.cta.creditrack.dtos.TranscriptEvaluationSearchRequest;

import com.cta.creditrack.dtos.UpsertTranscriptEvaluationRequest;
import com.cta.creditrack.model.User;
import com.cta.creditrack.repository.UserRepository;
import com.cta.creditrack.services.TranscriptEvaluationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@RestController
@RequestMapping("/api/transcript-evaluation")
@RequiredArgsConstructor
@Slf4j
public class TranscriptEvaluationController {

    private final TranscriptEvaluationService service;
       private final UserRepository userRepository;

    @PostMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam(defaultValue = "50") Integer pageSize,
            @RequestBody TranscriptEvaluationSearchRequest request,
            Pageable pageable,
        Authentication authentication) {

        try {
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


            if (request == null) {
                return ResponseEntity.badRequest()
                        .body(errorResponse("Request body cannot be null"));
            }

            Sort sort = Sort.unsorted();

            if (request.sortField() != null &&
                    request.sortDirection() != null &&
                    request.sortField().size() == request.sortDirection().size()) {

                List<Sort.Order> orders = new ArrayList<>();

                for (int i = 0; i < request.sortField().size(); i++) {
                    orders.add(new Sort.Order(
                            Sort.Direction.fromString(request.sortDirection().get(i)),
                            request.sortField().get(i)
                    ));
                }

                sort = Sort.by(orders);
            }

            Pageable pageableWithSort =
                    PageRequest.of(pageable.getPageNumber(), pageSize, sort);

            Page<TranscriptEvaluationGroupedResponse> result =
                    service.searchTranscriptEvaluations(request, pageableWithSort, user);

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            log.warn("Bad request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(errorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Internal server error during transcript search", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse("An unexpected error occurred"));
        }
    }

   @PostMapping("/upsert-evaluations")
public ResponseEntity<?> upsertEvaluations(
        @RequestBody UpsertTranscriptEvaluationRequest request,
    Authentication authentication) {

    try {

        if (request == null || request.evaluations() == null) {
            return ResponseEntity.badRequest()
                    .body(errorResponse("Request cannot be null"));
        }
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


        service.upsertTranscriptEvaluations(request, user);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Evaluations saved successfully"
        ));

    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(errorResponse(e.getMessage()));
    } catch (Exception e) {
        log.error("Error saving transcript evaluations", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse("Failed to save evaluations"));
    }
}


    private Map<String, Object> errorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("status", "error");
        error.put("message", message);
        error.put("timestamp", LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return error;
    }
}