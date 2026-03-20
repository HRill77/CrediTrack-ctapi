package com.cta.creditrack.controllers;

import java.io.IOException;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cta.creditrack.dtos.CourseSearchRequest;
import com.cta.creditrack.dtos.CourseSearchResult;
import com.cta.creditrack.dtos.CourseUploadResponse;
import com.cta.creditrack.model.Course;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.services.CourseService;
import com.cta.creditrack.services.DataIngestionService;
import com.cta.creditrack.services.TransactionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/ingest")
@RequiredArgsConstructor
public class DataIngestionController {

    private final DataIngestionService dataIngestionService;
    private final CourseService courseService;
    private final TransactionService transactionService;

    @PostMapping("/curricula")
    public ResponseEntity<?> ingestCurriculaData(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "File is empty");
                return ResponseEntity.badRequest().body(response);
            }

            if (!dataIngestionService.isValidFile(file)) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Invalid file format. Please upload an Excel (.xlsx, .xls)");
                return ResponseEntity.badRequest().body(response);
            }

            String fileType = dataIngestionService.getFileType(file);
            dataIngestionService.ingestCurriculaData(file.getInputStream());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Curricula data ingested successfully");
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Failed to ingest curricula data", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to process file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            log.error("Unexpected error during curricula ingestion", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ===================== COURSE ENDPOINTS =====================

    @PostMapping("/courses")
    public ResponseEntity<?> uploadCoursesFromCsv(@RequestParam("file") MultipartFile file) {
        try {
            log.info("Uploading courses from file: {}", file.getOriginalFilename());

            if (file.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "File is empty");
                return ResponseEntity.badRequest().body(response);
            }

            if (!dataIngestionService.isValidFile(file)) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Invalid file format. Please upload an Excel (.xlsx, .xls)");
                return ResponseEntity.badRequest().body(response);
            }

            // String fileType = dataIngestionService.getFileType(file);
            dataIngestionService.ingestCourseDataFromExcel(file.getInputStream());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Courses data ingested successfully");
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Failed to ingest courses data", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to process file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            log.error("Unexpected error during courses ingestion", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/courses")
    public ResponseEntity<?> getAllCourses() {
        try {
            List<Course> courses = courseService.getAllCourses();
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            log.error("Error retrieving courses", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(false, "Error retrieving courses: " + e.getMessage()));
        }
    }

    @GetMapping("/courses/{id}")
    public ResponseEntity<?> getCourseById(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse(false, "Invalid course ID"));
            }

            Course course = courseService.getCourseById(id);
            return ResponseEntity.ok(course);

        } catch (IllegalArgumentException e) {
            log.warn("Course not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(false, e.getMessage()));
        } catch (Exception e) {
            log.error("Error retrieving course", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(false, "Error retrieving course: " + e.getMessage()));
        }
    }

    @GetMapping("/courses/name/{courseName}")
    public ResponseEntity<?> getCourseBName(@PathVariable String courseName) {
        try {
            if (courseName == null || courseName.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse(false, "Course name is required"));
            }

            Course course = courseService.getCourseBName(courseName);
            return ResponseEntity.ok(course);

        } catch (IllegalArgumentException e) {
            log.warn("Course not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(false, e.getMessage()));
        } catch (Exception e) {
            log.error("Error retrieving course", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(false, "Error retrieving course: " + e.getMessage()));
        }
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        try {
            if (id == null || id <= 0) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse(false, "Invalid course ID"));
            }

            courseService.deleteCourse(id);

            // Log transaction
            Transaction transaction = new Transaction();
            transaction.setActionDetails("Course deleted - ID: " + id);
            transaction.setActionType("DELETE_COURSE");
            transactionService.postTransaction(transaction, null);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Course deleted successfully");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Course not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse(false, e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting course", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(false, "Error deleting course: " + e.getMessage()));
        }
    }

    private Map<String, Object> createErrorResponse(Boolean success, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("message", message);
        return response;
    }

}
