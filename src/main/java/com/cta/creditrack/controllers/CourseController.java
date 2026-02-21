package com.cta.creditrack.controllers;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cta.creditrack.dtos.CourseDeleteRequest;
import com.cta.creditrack.dtos.CourseSearchRequest;
import com.cta.creditrack.dtos.CourseSearchResult;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.cta.creditrack.dtos.CourseUploadResponse;
import com.cta.creditrack.services.CourseService;
import com.cta.creditrack.services.TransactionService;

@Slf4j
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

        private final CourseService courseService;
    // private final TransactionService transactionService;
     @PostMapping("/search")
    public ResponseEntity<?> searchCourses(
            @RequestParam(defaultValue = "50") Integer pageSize,
            @Valid @RequestBody CourseSearchRequest request,
            Pageable pageable) {
        try {
            List<String> sortField = request.sortField();
            List<String> sortDirection = request.sortDirection();

            Sort sort = Sort.unsorted();

            if (request == null) {
                return ResponseEntity.badRequest().body(createErrorResponse(false, "Request body cannot be null"));
            }

            if (sortField != null && sortDirection != null && sortField.size() == sortDirection.size()) {
                List<Sort.Order> orders = new ArrayList<>();

                for (int i = 0; i < sortField.size(); i++) {
                    orders.add(new Sort.Order(Sort.Direction.fromString(sortDirection.get(i)), sortField.get(i)));
                }

                sort = Sort.by(orders);
            }

            Pageable pageableWithSort = PageRequest.of(pageable.getPageNumber(), pageSize, sort);

            Page<CourseSearchResult> courseResults = courseService.searchCourses(
                    request, pageableWithSort);

            log.info("Successfully retrieved {} course search results", courseResults.getSize());
            return ResponseEntity.ok(new PageImpl<>(courseResults.getContent(), pageableWithSort, courseResults.getTotalElements()));

        } catch (IllegalArgumentException e) {
            log.warn("Bad request in course search: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(false, e.getMessage()));
        } catch (Exception e) {
            log.error("Error searching courses", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(false, "An error occurred while searching courses: " + e.getMessage()));
        }
    }

     private Map<String, Object> createErrorResponse(Boolean success, String message) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", message);
            return response;
        }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        try {
            log.info("Deleting course with ID: {}", id);

            courseService.deleteCourse(id);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Course deleted successfully");
            response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            log.info("Successfully deleted course with ID: {}", id);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Course not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(false, e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting course", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(false, "An error occurred while deleting course: " + e.getMessage()));
        }
    }

    @DeleteMapping("/delete-multiple")
    public ResponseEntity<?> deleteMultipleCourses(@Valid @RequestBody CourseDeleteRequest request) {
        try {
            log.info("Deleting {} course records", request.ids().size());

            Map<String, Object> deleteResult = courseService.deleteMultipleCourses(request.ids());

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Course deletion completed");
            response.put("data", deleteResult);
            response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Bad request in course deletion: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(false, e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting multiple courses", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(false, "An error occurred while deleting courses: " + e.getMessage()));
        }
    }
}