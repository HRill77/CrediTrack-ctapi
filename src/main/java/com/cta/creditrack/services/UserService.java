package com.cta.creditrack.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.cta.creditrack.dtos.UserSearchRequest;
import com.cta.creditrack.dtos.UserSearchResult;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.repository.UserRepository;
import com.cta.creditrack.utils.CheckNullOrIsEmpty;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TransactionService transactionService;


    public Page<UserSearchResult> searchUsers(UserSearchRequest request, Pageable pageable) {

        String searchText = CheckNullOrIsEmpty.isEmptyOrNull(request.searchText());
        Long programId = request.programId();
        Long roleId = request.roleId();
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
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            
            List<UserSearchResult> userResults = results.stream()
                    .map(row -> {
                        String createdAtStr = "";
                        String updatedAtStr = "";
                        
                        // Convert Timestamp to String
                        if (row[8] instanceof Timestamp) {
                            createdAtStr = ((Timestamp) row[8]).toLocalDateTime().format(dateFormatter);
                        } else if (row[8] instanceof LocalDateTime) {
                            createdAtStr = ((LocalDateTime) row[8]).format(dateFormatter);
                        }
                        
                        if (row[9] instanceof Timestamp) {
                            updatedAtStr = ((Timestamp) row[9]).toLocalDateTime().format(dateFormatter);
                        } else if (row[9] instanceof LocalDateTime) {
                            updatedAtStr = ((LocalDateTime) row[9]).format(dateFormatter);
                        }
                        
                        return new UserSearchResult(
                                (Long) row[0],              // id
                                String.format("%s, %s %s", row[3], row[1], ((String) row[2]).charAt(0)),// fullName
                                (String) row[4],            // email
                                (Boolean) row[5],           // is_active
                                (String) row[6],            // program
                                (String) row[7],            // role
                                createdAtStr,               // created_at
                                updatedAtStr                // updated_at
                        );
                    })
                    .collect(Collectors.toList());
            
            log.info("Found {} users", userResults.size());
            
            // Post transaction for user search activity
            Transaction transaction = new Transaction();
            transaction.setActionDetails("User search - Search text: " + searchText + ", Program ID: " + programId + ", Role ID: " + roleId);
            transaction.setActionType("USER_SEARCH");
            transactionService.postTransaction(transaction, null);

            // create sorting order
        if (pageable.getSort().isSorted()) {
            Comparator<UserSearchResult> comparator = null;

            for (Sort.Order order : pageable.getSort()) {
                Comparator<UserSearchResult> fieldComparator = getUserListComparator(order.getProperty(),
                        order.isAscending());

                if (fieldComparator != null) {
                    comparator = comparator == null ? fieldComparator : comparator.thenComparing(fieldComparator);
                }
            }

            if (comparator != null) {
                userResults.sort(comparator);
            }
        }
            
            // manual pagination
        int start = (int) pageable.getOffset();
        int total = userResults.size();
        int end = Math.min(start + pageable.getPageSize(), total);

        if (start >= total) {
            return new PageImpl<>(Collections.emptyList(), pageable, total);
        }

        List<UserSearchResult> paginatedList = userResults.subList(start, end);

        // return the sorted result wrapped in a PageImpl
        return new PageImpl<>(paginatedList, pageable, total);
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

    private Comparator<UserSearchResult> getUserListComparator(String property, boolean ascending) {
        Comparator<UserSearchResult> comparator = null;

        switch (property) {
            case "fullName":
                comparator = Comparator.comparing(UserSearchResult::fullName,
                    Comparator.nullsLast(String::compareToIgnoreCase)
                );
                break;
            case "email":
                comparator = Comparator.comparing(UserSearchResult::email,
                    Comparator.nullsLast(String::compareToIgnoreCase)
                );
                break;
            case "isActive":
                comparator = Comparator.comparing(UserSearchResult::isActive);
                break;
            case "program":
                comparator = Comparator.comparing(UserSearchResult::program,
                    Comparator.nullsLast(String::compareToIgnoreCase)
                );
                break;
            case "role":
                comparator = Comparator.comparing(UserSearchResult::role,
                    Comparator.nullsLast(String::compareToIgnoreCase)
                );
                break;
            case "createdAt":
                comparator = Comparator.comparing(UserSearchResult::createdAt,
                    Comparator.nullsLast(String::compareToIgnoreCase)
                );
                break;
            case "updatedAt":
                comparator = Comparator.comparing(UserSearchResult::updatedAt,
                    Comparator.nullsLast(String::compareToIgnoreCase)
                );
                break;
            default:
                throw new IllegalArgumentException("Invalid sort field: " + property);
        }

        return ascending ? comparator : comparator.reversed();
    }


}
