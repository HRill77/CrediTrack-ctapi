package com.cta.creditrack.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.cta.creditrack.dtos.CurriculaSearchRequest;
import com.cta.creditrack.dtos.CurriculaSearchResult;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.repository.CurriculaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
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
}
