package com.cta.creditrack.controllers;

import com.cta.creditrack.dtos.EmailWhitelistingResult;
import com.cta.creditrack.dtos.WhiteListingSearch;
import com.cta.creditrack.dtos.EmailWhitelistingRequest;
import com.cta.creditrack.model.EmailWhitelisting;
import com.cta.creditrack.repository.EmailWhitelistingRepository;
import com.cta.creditrack.services.EmailWhitelistingService;
import com.cta.creditrack.utils.exception.ErrorResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/email-whitelisting")
@RequiredArgsConstructor
public class EmailWhitelistingController {

    private final EmailWhitelistingService emailWhitelistingService;
    private final EmailWhitelistingRepository emailWhitelistingRepository;
    private final ErrorResponse errorResponse;

    // private final ErrorResponse errorResponse;
    @PostMapping("/search")
    public ResponseEntity<?> searchWhitelisting(
            @RequestBody WhiteListingSearch request,
            Pageable pageable,
            @RequestParam(defaultValue = "10") int pageSize) {

        List<String> sortField = request.sortField();
        List<String> sortDirection = request.sortDirection();

        Sort sort = Sort.unsorted();
        if (request == null) {
            return ResponseEntity.badRequest().body(errorResponse.createErrorResponse("Request body cannot be null"));
        }
        if (sortField != null && sortDirection != null && sortField.size() == sortDirection.size()) {
            List<Sort.Order> orders = new ArrayList<>();

            for (int i = 0; i < sortField.size(); i++) {
                orders.add(new Sort.Order(Sort.Direction.fromString(sortDirection.get(i)), sortField.get(i)));
            }

            sort = Sort.by(orders);
        }
        Pageable pageableWithSort = PageRequest.of(pageable.getPageNumber(), pageSize, sort);

        Page<EmailWhitelistingResult> results = emailWhitelistingService.searchWhitelisting(
                request, pageableWithSort);

        return ResponseEntity.ok(results);
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<?> updateWhitelistingStatus(
            @PathVariable Long id) {
        try {

            EmailWhitelistingResult result = emailWhitelistingService.updateWhitelistingStatus(id);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Email not found: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update status: " + e.getMessage());
        }
    }

    @PostMapping("/save")
    public ResponseEntity<?> saveOrUpdateEmail(@RequestBody EmailWhitelistingRequest request) {
        try {
            if (request.email() == null || request.email().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }

            // Check if email already exists
            Optional<EmailWhitelisting> existing = emailWhitelistingRepository.findByEmailIgnoreCase(request.email());

            EmailWhitelistingResult result;
            if (existing.isPresent()) {
                // Update existing email
                EmailWhitelisting whitelisting = existing.get();
                whitelisting.setUpdatedAt(LocalDateTime.now());
                EmailWhitelisting updated = emailWhitelistingRepository.save(whitelisting);
                result = convertToResult(updated);
            } else {
                // Create new email
                EmailWhitelisting whitelisting = EmailWhitelisting.builder()
                        .email(request.email())
                        .status(true)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                EmailWhitelisting saved = emailWhitelistingRepository.save(whitelisting);
                result = convertToResult(saved);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to save email: " + e.getMessage());
        }
    }

    // Helper method to convert entity to DTO
    private EmailWhitelistingResult convertToResult(EmailWhitelisting whitelisting) {
        return EmailWhitelistingResult.builder()
                .id(whitelisting.getId())
                .email(whitelisting.getEmail())
                .status(whitelisting.getStatus())
                .createdAt(whitelisting.getCreatedAt())
                .updatedAt(whitelisting.getUpdatedAt())
                .build();
    }
}