package com.cta.creditrack.services;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.cta.creditrack.dtos.CourseSearchRequest;
import com.cta.creditrack.dtos.CourseSearchResult;
import com.cta.creditrack.model.Course;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.repository.CourseRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final TransactionService transactionService;

    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course not found with ID: " + id));
    }

    public Course getCourseBName(String courseName) {
        return courseRepository.findByCourseNameIgnoreCase(courseName)
                .orElseThrow(() -> new IllegalArgumentException("Course not found with name: " + courseName));
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new IllegalArgumentException("Course not found with ID: " + id);
        }
        courseRepository.deleteById(id);
        log.info("Course deleted with ID: {}", id);
    }

    public java.util.Map<String, Object> deleteMultipleCourses(List<Long> ids) {
        try {
            log.info("Deleting {} course records", ids.size());

            if (ids == null || ids.isEmpty()) {
                throw new IllegalArgumentException("IDs list cannot be empty");
            }

            long successCount = 0;
            long failureCount = 0;
            List<String> failedIds = new ArrayList<>();

            for (Long id : ids) {
                try {
                    if (courseRepository.existsById(id)) {
                        courseRepository.deleteById(id);
                        successCount++;
                    } else {
                        failureCount++;
                        failedIds.add("ID " + id + " not found");
                    }
                } catch (Exception e) {
                    failureCount++;
                    failedIds.add("ID " + id + ": " + e.getMessage());
                }
            }

            log.info("Deleted {} course records, {} failed", successCount, failureCount);

            // Post transaction for multiple course deletion
            try {
                Transaction transaction = new Transaction();
                transaction.setActionDetails("Deleted " + successCount + " course records out of " + ids.size());
                transaction.setActionType("COURSE_BULK_DELETE");
                transactionService.postTransaction(transaction, null);
            } catch (Exception txnError) {
                log.error("Failed to log bulk deletion transaction", txnError);
            }

            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("totalRequested", ids.size());
            result.put("successCount", successCount);
            result.put("failureCount", failureCount);
            if (!failedIds.isEmpty()) {
                result.put("failures", failedIds);
            }

            return result;

        } catch (Exception e) {
            log.error("Error deleting multiple courses", e);
            throw new RuntimeException("Error deleting multiple courses: " + e.getMessage(), e);
        }
    }

    public Page<CourseSearchResult> searchCourses(CourseSearchRequest request, Pageable pageable) {
        String courseName = request.courseName();

        log.info("Searching courses - courseName: {}", courseName);

        try {
            // Validate search parameters
            if (courseName != null && courseName.length() > 255) {
                throw new IllegalArgumentException("Search text cannot exceed 255 characters");
            }

            // Execute searchs
            List<Course> results = courseName == null || courseName.isEmpty() 
                    ? courseRepository.findAll() 
                    : courseRepository.searchCourseByName(courseName).stream().toList();

            log.info("Found {} course records", results.size());

            // Map Course to CourseSearchResult
            List<CourseSearchResult> courseResults = results.stream()
                    .map(this::mapToCourseSearchResult)
                    .collect(Collectors.toList());

            // Post transaction for course search activity
            // Transaction transaction = new Transaction();
            // transaction.setActionDetails("Course search - Course Name: " + courseName);
            // transaction.setActionType("COURSE_SEARCH");
            // transactionService.postTransaction(transaction, null);

            // Apply sorting if requested
            if (pageable.getSort().isSorted()) {
                Comparator<CourseSearchResult> comparator = null;

                for (Sort.Order order : pageable.getSort()) {
                    Comparator<CourseSearchResult> fieldComparator = getCourseComparator(order.getProperty(),
                            order.isAscending());

                    if (fieldComparator != null) {
                        comparator = comparator == null ? fieldComparator : comparator.thenComparing(fieldComparator);
                    }
                }

                if (comparator != null) {
                    courseResults.sort(comparator);
                }
            }

            // Manual pagination
            int start = (int) pageable.getOffset();
            int total = courseResults.size();
            int end = Math.min(start + pageable.getPageSize(), total);

            if (start >= total) {
                return new PageImpl<>(Collections.emptyList(), pageable, total);
            }

            List<CourseSearchResult> paginatedList = courseResults.subList(start, end);

            return new PageImpl<>(paginatedList, pageable, total);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid search parameters: {}", e.getMessage());

            // Log error transaction
            try {
                Transaction errorTransaction = new Transaction();
                errorTransaction.setActionDetails("Course search error - Invalid parameters: " + e.getMessage());
                errorTransaction.setActionType("COURSE_SEARCH_ERROR");
                transactionService.postTransaction(errorTransaction, null);
            } catch (Exception txnError) {
                log.error("Failed to log error transaction", txnError);
            }

            throw e;
        } catch (Exception e) {
            log.error("Error searching courses", e);

            // Log error transaction
            try {
                Transaction errorTransaction = new Transaction();
                errorTransaction.setActionDetails("Course search error - " + e.getMessage());
                errorTransaction.setActionType("COURSE_SEARCH_ERROR");
                transactionService.postTransaction(errorTransaction, null);
            } catch (Exception txnError) {
                log.error("Failed to log error transaction", txnError);
            }

            throw new RuntimeException("Error searching courses: " + e.getMessage(), e);
        }
    }

    private CourseSearchResult mapToCourseSearchResult(Course course) {
        return new CourseSearchResult(
                course.getId(),
                course.getCourseName(),
                course.getUnits(),
                course.getPrerequisite(),
                course.getDescription(),
                course.getCourseOutline(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }

    private Comparator<CourseSearchResult> getCourseComparator(String property, boolean ascending) {
        Comparator<CourseSearchResult> comparator = null;

        switch (property) {
            case "courseName":
                comparator = Comparator.comparing(CourseSearchResult::courseName,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "units":
                comparator = Comparator.comparing(CourseSearchResult::units,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "prerequisite":
                comparator = Comparator.comparing(CourseSearchResult::prerequisite,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "description":
                comparator = Comparator.comparing(CourseSearchResult::description,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "courseOutline":
                comparator = Comparator.comparing(CourseSearchResult::courseOutline,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "createdAt":
                comparator = Comparator.comparing(CourseSearchResult::createdAt,
                        Comparator.nullsLast(java.time.LocalDateTime::compareTo));
                break;
            case "updatedAt":
                comparator = Comparator.comparing(CourseSearchResult::updatedAt,
                        Comparator.nullsLast(java.time.LocalDateTime::compareTo));
                break;
            case "id":
                comparator = Comparator.comparing(CourseSearchResult::id);
                break;
            default:
                throw new IllegalArgumentException("Invalid sort field: " + property);
        }

        return ascending ? comparator : comparator.reversed();
    }

}
