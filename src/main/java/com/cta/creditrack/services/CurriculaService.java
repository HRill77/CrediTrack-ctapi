package com.cta.creditrack.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.cta.creditrack.dtos.CurriculaCreateRequest;
import com.cta.creditrack.dtos.CurriculaDTO;
import com.cta.creditrack.dtos.CurriculaSearchRequest;
import com.cta.creditrack.dtos.CurriculaSearchResult;
import com.cta.creditrack.dtos.CurriculaUpdateRequest;
import com.cta.creditrack.model.Curricula;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.repository.CurriculaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CurriculaService {

    private final CurriculaRepository curriculaRepository;
    private final TransactionService transactionService;

    public Page<CurriculaSearchResult> searchCurricula(CurriculaSearchRequest request, Pageable pageable) {
        List<String> programCodes = request.programCodes();
        List<String> years = request.years();
        List<String> semesters = request.semesters();
        List<String> courseCodes = request.courseCodes();
        String searchText = request.searchText();

        log.info("Searching curricula - programCodes: {}, years: {}, semesters: {}, courseCodes: {}, searchText: {}",
                programCodes, years, semesters, courseCodes, searchText);

        try {
            // Validate search parameters
            if (searchText != null && searchText.length() > 255) {
                throw new IllegalArgumentException("Search text cannot exceed 255 characters");
            }

            if (programCodes != null && programCodes.isEmpty()) {
                programCodes = null;
            }

            if (years != null && years.isEmpty()) {
                years = null;
            }

            if (semesters != null && semesters.isEmpty()) {
                semesters = null;
            }

            if (courseCodes != null && courseCodes.isEmpty()) {
                courseCodes = null;
            }

            // Execute search
            List<Object[]> results = curriculaRepository.searchCurricula(
                    programCodes,
                    years,
                    semesters,
                    courseCodes,
                    searchText
            );

            log.info("Found {} curricula records", results.size());

            // Map Object[] to CurriculaSearchResult
            List<CurriculaSearchResult> curriculaResults = results.stream()
                    .map(row -> new CurriculaSearchResult(
                            (Long) row[0],                  // id
                            (String) row[1],                // programTitle
                            (String) row[2],                // programCode
                            (String) row[3],                // year
                            (String) row[4],                // semester
                            (String) row[5],                // courseCode
                            (String) row[6],                // courseTitle
                            (String) row[7],                // preRequisite
                            ((Number) row[8]).intValue(),   // lec
                            ((Number) row[9]).intValue(),   // lab
                            ((Number) row[10]).intValue()   // units
                    ))
                    .collect(Collectors.toList());

            // Post transaction for curricula search activity
            // Transaction transaction = new Transaction();
            // transaction.setActionDetails("Curricula search - Program Codes: " + programCodes + ", Years: " + years +
            //         ", Semesters: " + semesters + ", Course Codes: " + courseCodes + ", Search Text: " + searchText);
            // transaction.setActionType("CURRICULA_SEARCH");
            // transactionService.postTransaction(transaction, null);

            // Apply sorting if requested
            if (pageable.getSort().isSorted()) {
                Comparator<CurriculaSearchResult> comparator = null;

                for (Sort.Order order : pageable.getSort()) {
                    Comparator<CurriculaSearchResult> fieldComparator = getCurriculaComparator(order.getProperty(),
                            order.isAscending());

                    if (fieldComparator != null) {
                        comparator = comparator == null ? fieldComparator : comparator.thenComparing(fieldComparator);
                    }
                }

                if (comparator != null) {
                    curriculaResults.sort(comparator);
                }
            }

            // Manual pagination
            int start = (int) pageable.getOffset();
            int total = curriculaResults.size();
            int end = Math.min(start + pageable.getPageSize(), total);

            if (start >= total) {
                return new PageImpl<>(Collections.emptyList(), pageable, total);
            }

            List<CurriculaSearchResult> paginatedList = curriculaResults.subList(start, end);

            return new PageImpl<>(paginatedList, pageable, total);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid search parameters: {}", e.getMessage());

            // Log error transaction
            try {
                Transaction errorTransaction = new Transaction();
                errorTransaction.setActionDetails("Curricula search error - Invalid parameters: " + e.getMessage());
                errorTransaction.setActionType("CURRICULA_SEARCH_ERROR");
                transactionService.postTransaction(errorTransaction, null);
            } catch (Exception txnError) {
                log.error("Failed to log error transaction", txnError);
            }

            throw e;
        } catch (Exception e) {
            log.error("Error searching curricula", e);

            // Log error transaction
            try {
                Transaction errorTransaction = new Transaction();
                errorTransaction.setActionDetails("Curricula search error - " + e.getMessage());
                errorTransaction.setActionType("CURRICULA_SEARCH_ERROR");
                transactionService.postTransaction(errorTransaction, null);
            } catch (Exception txnError) {
                log.error("Failed to log error transaction", txnError);
            }

            throw new RuntimeException("Error searching curricula: " + e.getMessage(), e);
        }
    }

    private Comparator<CurriculaSearchResult> getCurriculaComparator(String property, boolean ascending) {
        Comparator<CurriculaSearchResult> comparator = null;

        switch (property) {
            case "programTitle":
                comparator = Comparator.comparing(CurriculaSearchResult::programTitle,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "programCode":
                comparator = Comparator.comparing(CurriculaSearchResult::programCode,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "year":
                comparator = Comparator.comparing(CurriculaSearchResult::year,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "semester":
                comparator = Comparator.comparing(CurriculaSearchResult::semester,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "courseCode":
                comparator = Comparator.comparing(CurriculaSearchResult::courseCode,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "courseTitle":
                comparator = Comparator.comparing(CurriculaSearchResult::courseTitle,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "preRequisite":
                comparator = Comparator.comparing(CurriculaSearchResult::preRequisite,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "lec":
                comparator = Comparator.comparing(CurriculaSearchResult::lec,
                        Comparator.nullsLast(Integer::compareTo));
                break;
            case "lab":
                comparator = Comparator.comparing(CurriculaSearchResult::lab,
                        Comparator.nullsLast(Integer::compareTo));
                break;
            case "units":
                comparator = Comparator.comparing(CurriculaSearchResult::units,
                        Comparator.nullsLast(Integer::compareTo));
                break;
            case "id":
                comparator = Comparator.comparing(CurriculaSearchResult::id);
                break;
            default:
                throw new IllegalArgumentException("Invalid sort field: " + property);
        }

        return ascending ? comparator : comparator.reversed();
    }

    public Curricula createCurricula(CurriculaCreateRequest request) {
        try {
            log.info("Creating new curricula - programCode: {}, courseCode: {}", 
                    request.programCode(), request.courseCode());

            Curricula curricula = new Curricula();
            curricula.setProgramTitle(request.programTitle());
            curricula.setProgramCode(request.programCode());
            curricula.setYear(request.year());
            curricula.setSemester(request.semester());
            curricula.setCourseCode(request.courseCode());
            curricula.setCourseTitle(request.courseTitle());
            curricula.setPreRequisite(request.preRequisite());
            curricula.setLec(request.lec());
            curricula.setLab(request.lab());
            curricula.setUnits(request.units());

            Curricula savedCurricula = curriculaRepository.save(curricula);
            
            log.info("Successfully created curricula with ID: {}", savedCurricula.getId());
            
            // Post transaction for curricula creation
            try {
                Transaction transaction = new Transaction();
                transaction.setActionDetails("Created curricula - Program: " + request.programCode() + 
                        ", Course: " + request.courseCode());
                transaction.setActionType("CURRICULA_CREATE");
                transactionService.postTransaction(transaction, null);
            } catch (Exception txnError) {
                log.error("Failed to log creation transaction", txnError);
            }

            return savedCurricula;
        } catch (Exception e) {
            log.error("Error creating curricula", e);
            throw new RuntimeException("Error creating curricula: " + e.getMessage(), e);
        }
    }

    public Curricula updateCurricula(CurriculaUpdateRequest request) {
        try {
            log.info("Updating curricula with ID: {}", request.id());

            Curricula curricula = curriculaRepository.findById(request.id())
                    .orElseThrow(() -> new RuntimeException("Curricula not found with ID: " + request.id()));

            // Update only non-null fields
            if (request.programTitle() != null) {
                curricula.setProgramTitle(request.programTitle());
            }
            if (request.programCode() != null) {
                curricula.setProgramCode(request.programCode());
            }
            if (request.year() != null) {
                curricula.setYear(request.year());
            }
            if (request.semester() != null) {
                curricula.setSemester(request.semester());
            }
            if (request.courseCode() != null) {
                curricula.setCourseCode(request.courseCode());
            }
            if (request.courseTitle() != null) {
                curricula.setCourseTitle(request.courseTitle());
            }
            if (request.preRequisite() != null) {
                curricula.setPreRequisite(request.preRequisite());
            }
            if (request.lec() != null) {
                curricula.setLec(request.lec());
            }
            if (request.lab() != null) {
                curricula.setLab(request.lab());
            }
            if (request.units() != null) {
                curricula.setUnits(request.units());
            }

            Curricula updatedCurricula = curriculaRepository.save(curricula);
            
            log.info("Successfully updated curricula with ID: {}", updatedCurricula.getId());
            
            // Post transaction for curricula update
            try {
                Transaction transaction = new Transaction();
                transaction.setActionDetails("Updated curricula with ID: " + request.id());
                transaction.setActionType("CURRICULA_UPDATE");
                transactionService.postTransaction(transaction, null);
            } catch (Exception txnError) {
                log.error("Failed to log update transaction", txnError);
            }

            return updatedCurricula;
        } catch (RuntimeException e) {
            log.error("Error updating curricula: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error updating curricula", e);
            throw new RuntimeException("Error updating curricula: " + e.getMessage(), e);
        }
    }

    public void deleteCurriculaById(Long id) {
        try {
            log.info("Deleting curricula with ID: {}", id);

            if (!curriculaRepository.existsById(id)) {
                throw new RuntimeException("Curricula not found with ID: " + id);
            }

            curriculaRepository.deleteById(id);
            
            log.info("Successfully deleted curricula with ID: {}", id);
            
            // Post transaction for curricula deletion
            try {
                Transaction transaction = new Transaction();
                transaction.setActionDetails("Deleted curricula with ID: " + id);
                transaction.setActionType("CURRICULA_DELETE");
                transactionService.postTransaction(transaction, null);
            } catch (Exception txnError) {
                log.error("Failed to log deletion transaction", txnError);
            }

        } catch (RuntimeException e) {
            log.error("Error deleting curricula: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error deleting curricula", e);
            throw new RuntimeException("Error deleting curricula: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> deleteMultipleCurricula(List<Long> ids) {
        try {
            log.info("Deleting {} curricula records", ids.size());

            if (ids == null || ids.isEmpty()) {
                throw new IllegalArgumentException("IDs list cannot be empty");
            }

            long successCount = 0;
            long failureCount = 0;
            List<String> failedIds = new ArrayList<>();

            for (Long id : ids) {
                try {
                    if (curriculaRepository.existsById(id)) {
                        curriculaRepository.deleteById(id);
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

            log.info("Deleted {} curricula records, {} failed", successCount, failureCount);

            // Post transaction for multiple curricula deletion
            try {
                Transaction transaction = new Transaction();
                transaction.setActionDetails("Deleted " + successCount + " curricula records out of " + ids.size());
                transaction.setActionType("CURRICULA_BULK_DELETE");
                transactionService.postTransaction(transaction, null);
            } catch (Exception txnError) {
                log.error("Failed to log bulk deletion transaction", txnError);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("totalRequested", ids.size());
            result.put("successCount", successCount);
            result.put("failureCount", failureCount);
            if (!failedIds.isEmpty()) {
                result.put("failures", failedIds);
            }

            return result;

        } catch (Exception e) {
            log.error("Error deleting multiple curricula", e);
            throw new RuntimeException("Error deleting multiple curricula: " + e.getMessage(), e);
        }
    }

    public List<CurriculaDTO> getCurriculaListByProgramCode(String programCode) {
        try {
            log.info("Fetching curricula list for program code: {}", programCode);

            List<Curricula> curriculaList;

            // If program code is empty, get all curricula
            if (programCode == null || programCode.trim().isEmpty()) {
                log.info("Program code is empty, fetching all curricula records");
                curriculaList = curriculaRepository.findAll();
            } else {
                curriculaList = curriculaRepository.findByProgramCode(programCode);
            }

            log.info("Found {} curricula records", curriculaList.size());

            // Convert to DTO
            List<CurriculaDTO> dtoList = curriculaList.stream()
                    .map(curricula -> new CurriculaDTO(
                            curricula.getId(),
                            curricula.getProgramTitle(),
                            curricula.getProgramCode(),
                            curricula.getYear(),
                            curricula.getSemester(),
                            curricula.getCourseCode(),
                            curricula.getCourseTitle(),
                            curricula.getPreRequisite(),
                            curricula.getLec(),
                            curricula.getLab(),
                            curricula.getUnits()
                    ))
                    .collect(Collectors.toList());

            // Post transaction
            try {
                Transaction transaction = new Transaction();
                String actionDetails = (programCode == null || programCode.trim().isEmpty()) 
                    ? "Fetched all curricula records. Found " + dtoList.size() + " records."
                    : "Fetched curricula list for program code: " + programCode + ". Found " + dtoList.size() + " records.";
                transaction.setActionDetails(actionDetails);
                transaction.setActionType("CURRICULA_LIST_FETCH");
                transactionService.postTransaction(transaction, null);
            } catch (Exception txnError) {
                log.error("Failed to log fetch transaction", txnError);
            }

            return dtoList;
        } catch (Exception e) {
            log.error("Error fetching curricula list", e);
            throw new RuntimeException("Error fetching curricula list: " + e.getMessage(), e);
        }
    }

    public List<CurriculaDTO> getAllCurricula() {
        try {
            log.info("Fetching all curricula records");

            List<Curricula> curriculaList = curriculaRepository.findAll();

            log.info("Found {} total curricula records", curriculaList.size());

            // Convert to DTO
            List<CurriculaDTO> dtoList = curriculaList.stream()
                    .map(curricula -> new CurriculaDTO(
                            curricula.getId(),
                            curricula.getProgramTitle(),
                            curricula.getProgramCode(),
                            curricula.getYear(),
                            curricula.getSemester(),
                            curricula.getCourseCode(),
                            curricula.getCourseTitle(),
                            curricula.getPreRequisite(),
                            curricula.getLec(),
                            curricula.getLab(),
                            curricula.getUnits()
                    ))
                    .collect(Collectors.toList());

            // Post transaction
            try {
                Transaction transaction = new Transaction();
                transaction.setActionDetails("Fetched all curricula records. Found " + dtoList.size() + " records.");
                transaction.setActionType("CURRICULA_LIST_FETCH_ALL");
                transactionService.postTransaction(transaction, null);
            } catch (Exception txnError) {
                log.error("Failed to log fetch all transaction", txnError);
            }

            return dtoList;
        } catch (Exception e) {
            log.error("Error fetching all curricula", e);
            throw new RuntimeException("Error fetching all curricula: " + e.getMessage(), e);
        }
    }

   public List<CurriculaDTO> getCurriculaListByCourseTitle(
        String programTitle,
        String courseTitle
) {
    try {
        log.info("Fetching curricula list for programTitle: {}, courseTitle: {}",
                programTitle, courseTitle);

        List<Curricula> curriculaList =
                curriculaRepository.findByProgramTitleAndCourseTitle(
                        programTitle,
                        courseTitle
                );

        List<CurriculaDTO> dtoList = curriculaList.stream()
                .map(curricula -> new CurriculaDTO(
                        curricula.getId(),
                        curricula.getProgramTitle(),
                        curricula.getProgramCode(),
                        curricula.getYear(),
                        curricula.getSemester(),
                        curricula.getCourseCode(),
                        curricula.getCourseTitle(),
                        curricula.getPreRequisite(),
                        curricula.getLec(),
                        curricula.getLab(),
                        curricula.getUnits()
                ))
                .collect(Collectors.toList());

        return dtoList;

    } catch (Exception e) {
        log.error("Error fetching curricula list", e);
        throw new RuntimeException("Error fetching curricula list", e);
    }
}
}