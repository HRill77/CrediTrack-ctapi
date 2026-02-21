package com.cta.creditrack.controllers;

import com.cta.creditrack.dtos.CurriculaCreateRequest;
import com.cta.creditrack.dtos.CurriculaDeleteRequest;
import com.cta.creditrack.dtos.CurriculaSearchRequest;
import com.cta.creditrack.dtos.CurriculaSearchResult;
import com.cta.creditrack.dtos.CurriculaUpdateRequest;
import com.cta.creditrack.model.Curricula;
import com.cta.creditrack.services.CurriculaService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/curricula")
@RequiredArgsConstructor
public class CurriculaController {

    private final CurriculaService curriculaService;

    @PostMapping("/search")
    public ResponseEntity<?> searchCurricula(
            @RequestParam(defaultValue = "50") Integer pageSize,
            @Valid @RequestBody CurriculaSearchRequest request,
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

            Page<CurriculaSearchResult> curriculaResults = curriculaService.searchCurricula(
                    request, pageableWithSort);

            log.info("Successfully retrieved {} curricula search results", curriculaResults.getSize());
            return ResponseEntity.ok(new PageImpl<>(curriculaResults.getContent(), pageableWithSort, curriculaResults.getTotalElements()));

        } catch (IllegalArgumentException e) {
            log.warn("Bad request in curricula search: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error searching curricula", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while searching curricula: " + e.getMessage()));
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", "error");
        errorResponse.put("message", message);
        errorResponse.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return errorResponse;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createCurricula(@Valid @RequestBody CurriculaCreateRequest request) {
        try {
            log.info("Creating new curricula - programCode: {}, courseCode: {}", 
                    request.programCode(), request.courseCode());

            Curricula curricula = curriculaService.createCurricula(request);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Curricula created successfully");
            response.put("data", curricula);
            response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            log.info("Successfully created curricula with ID: {}", curricula.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.warn("Bad request in curricula creation: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating curricula", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while creating curricula: " + e.getMessage()));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateCurricula(@Valid @RequestBody CurriculaUpdateRequest request) {
        try {
            log.info("Updating curricula with ID: {}", request.id());

            Curricula curricula = curriculaService.updateCurricula(request);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Curricula updated successfully");
            response.put("data", curricula);
            response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            log.info("Successfully updated curricula with ID: {}", curricula.getId());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Bad request in curricula update: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            log.warn("Curricula not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating curricula", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while updating curricula: " + e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteCurricula(@PathVariable Long id) {
        try {
            log.info("Deleting curricula with ID: {}", id);

            curriculaService.deleteCurriculaById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Curricula deleted successfully");
            response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            log.info("Successfully deleted curricula with ID: {}", id);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.warn("Curricula not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting curricula", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while deleting curricula: " + e.getMessage()));
        }
    }

    @DeleteMapping("/delete-multiple")
    public ResponseEntity<?> deleteMultipleCurricula(@Valid @RequestBody CurriculaDeleteRequest request) {
        try {
            log.info("Deleting {} curricula records", request.ids().size());

            Map<String, Object> deleteResult = curriculaService.deleteMultipleCurricula(request.ids());

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Curricula deletion completed");
            response.put("data", deleteResult);
            response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Bad request in curricula deletion: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting multiple curricula", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while deleting curricula: " + e.getMessage()));
        }
    }
    
}