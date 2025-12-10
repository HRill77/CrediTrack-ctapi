package com.cta.creditrack.services;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.cta.creditrack.dtos.UserSearchResult;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TransactionService transactionService;


    public List<UserSearchResult> searchUsers(String searchText, Long programId, Long roleId) {
        log.info("Searching users - searchText: {}, programId: {}, roleId: {}", 
                 searchText, programId, roleId);
        
        try {
            if (searchText != null && searchText.length() > 255) {
                throw new IllegalArgumentException("Search text cannot exceed 255 characters");
            }
            
            if (programId != null && programId <= 0) {
                throw new IllegalArgumentException("Program ID must be greater than 0");
            }
            
            if (roleId != null && roleId <= 0) {
                throw new IllegalArgumentException("Role ID must be greater than 0");
            }
            
            List<Object[]> results = userRepository.searchUsers(searchText, programId, roleId);
            
            List<UserSearchResult> userResults = results.stream()
                    .map(row -> new UserSearchResult(
                            (Long) row[0],              // id
                            String.format("%s, %s %s", row[3], row[1], ((String) row[2]).charAt(0)),// fullName
                            (String) row[4],            // email
                            (Boolean) row[5],           // is_active
                            (String) row[6],            // program
                            (String) row[7],            // role
                            row[8],                     // created_at
                            row[9]                      // updated_at
                    ))
                    .collect(Collectors.toList());
            
            log.info("Found {} users", userResults.size());
            
            // Post transaction for user search activity
            Transaction transaction = new Transaction();
            transaction.setActionDetails("User search - Search text: " + searchText + ", Program ID: " + programId + ", Role ID: " + roleId);
            transaction.setActionType("USER_SEARCH");
            transactionService.postTransaction(transaction, null);
            
            return userResults;
        } catch (IllegalArgumentException e) {
            log.warn("Invalid search parameters: {}", e.getMessage());
            
            // Log error transaction
            try {
                Transaction errorTransaction = new Transaction();
                errorTransaction.setActionDetails("User search error - Invalid parameters: " + e.getMessage());
                errorTransaction.setActionType("USER_SEARCH_ERROR");
                transactionService.postTransaction(errorTransaction, null);
            } catch (Exception txnError) {
                log.error("Failed to log error transaction", txnError);
            }
            
            throw e;
        } catch (Exception e) {
            log.error("Error searching users", e);
            
            // Log error transaction
            try {
                Transaction errorTransaction = new Transaction();
                errorTransaction.setActionDetails("User search error - " + e.getMessage());
                errorTransaction.setActionType("USER_SEARCH_ERROR");
                transactionService.postTransaction(errorTransaction, null);
            } catch (Exception txnError) {
                log.error("Failed to log error transaction", txnError);
            }
            
            throw new RuntimeException("Error searching users: " + e.getMessage(), e);
        }
    }


}
