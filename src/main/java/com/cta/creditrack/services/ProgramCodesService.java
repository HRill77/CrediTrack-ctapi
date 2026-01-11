package com.cta.creditrack.services;

import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.repository.CurriculaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProgramCodesService {

    private final CurriculaRepository curriculaRepository;
    private final TransactionService transactionService;

    public List<String> getDistinctProgramCodes() {
        try {
            log.info("Fetching distinct program codes");
            List<String> programCodes = curriculaRepository.findDistinctProgramCodes();
            
            log.info("Found {} distinct program codes", programCodes.size());
            
            // Log transaction
            Transaction transaction = new Transaction();
            transaction.setActionDetails("Fetched distinct program codes - Count: " + programCodes.size());
            transaction.setActionType("FETCH_PROGRAM_CODES");
            transactionService.postTransaction(transaction, null);
            
            return programCodes;
        } catch (Exception e) {
            log.error("Error fetching distinct program codes", e);
            throw new RuntimeException("Error fetching program codes: " + e.getMessage(), e);
        }
    }

    public List<String> getDistinctYears() {
        try {
            log.info("Fetching distinct years");
            List<String> years = curriculaRepository.findDistinctYears();
            
            log.info("Found {} distinct years", years.size());
            
            // Log transaction
            Transaction transaction = new Transaction();
            transaction.setActionDetails("Fetched distinct years - Count: " + years.size());
            transaction.setActionType("FETCH_YEARS");
            transactionService.postTransaction(transaction, null);
            
            return years;
        } catch (Exception e) {
            log.error("Error fetching distinct years", e);
            throw new RuntimeException("Error fetching years: " + e.getMessage(), e);
        }
    }

    public List<String> getDistinctSemesters() {
        try {
            log.info("Fetching distinct semesters");
            List<String> semesters = curriculaRepository.findDistinctSemesters();
            
            log.info("Found {} distinct semesters", semesters.size());
            
            // Log transaction
            Transaction transaction = new Transaction();
            transaction.setActionDetails("Fetched distinct semesters - Count: " + semesters.size());
            transaction.setActionType("FETCH_SEMESTERS");
            transactionService.postTransaction(transaction, null);
            
            return semesters;
        } catch (Exception e) {
            log.error("Error fetching distinct semesters", e);
            throw new RuntimeException("Error fetching semesters: " + e.getMessage(), e);
        }
    }

    public List<String> getDistinctCourseCodes() {
        try {
            log.info("Fetching distinct course codes");
            List<String> courseCodes = curriculaRepository.findDistinctCourseCodes();
            
            log.info("Found {} distinct course codes", courseCodes.size());
            
            // Log transaction
            Transaction transaction = new Transaction();
            transaction.setActionDetails("Fetched distinct course codes - Count: " + courseCodes.size());
            transaction.setActionType("FETCH_COURSE_CODES");
            transactionService.postTransaction(transaction, null);
            
            return courseCodes;
        } catch (Exception e) {
            log.error("Error fetching distinct course codes", e);
            throw new RuntimeException("Error fetching course codes: " + e.getMessage(), e);
        }
    }
}
