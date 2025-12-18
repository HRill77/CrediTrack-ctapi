package com.cta.creditrack.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.cta.creditrack.dtos.CreateUserRequestDto;
import com.cta.creditrack.dtos.UserSearchRequest;
import com.cta.creditrack.dtos.UserSearchResult;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.model.User;
import com.cta.creditrack.repository.UserRepository;
import com.cta.creditrack.utils.CheckNullOrIsEmpty;
import com.cta.creditrack.utils.PasswordGenerator;

import java.sql.Timestamp;
import java.time.Instant;
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
    private final PasswordEncoder passwordEncoder;
    @Autowired
    private EmailService emailService;


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

    public Boolean existsByEmailIgnoreCase(String email) {
        return userRepository.existsByEmailIgnoreCase(email);
    }

  
    public boolean checkAndUpdateTemporaryPassword(String email, String currentPassword, String newPassword) {
        log.info("Checking temporary password expiration for email: {}", email);
        
        try {
            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
            
            // Validate current password
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                log.warn("Temporary password does not match for user: {}", email);
                
                // Log error transaction
                Transaction errorTransaction = new Transaction();
                errorTransaction.setActionDetails("Temporary password update failed - Current password mismatch for email: " + email);
                errorTransaction.setActionType("INVALID_CURRENT_PASSWORD");
                transactionService.postTransaction(errorTransaction, null);
                
                throw new IllegalArgumentException("Temporary password is incorrect");
            }
            
            // Check if passwordExpiresAt is set and if it has expired
            if (user.getPasswordExpiresAt() == null) {
                log.warn("User {} has no temporary password expiration set", email);
                
                // Log error transaction
                Transaction errorTransaction = new Transaction();
                errorTransaction.setActionDetails("Temporary password update failed - No temporary password set for email: " + email);
                errorTransaction.setActionType("TEMP_PASSWORD_UPDATE_ERROR");
                transactionService.postTransaction(errorTransaction, null);
                
                throw new IllegalArgumentException("User does not have a temporary password");
            }
            
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expiryTime = LocalDateTime.ofInstant(user.getPasswordExpiresAt(), java.time.ZoneId.systemDefault());
            
            if (now.isAfter(expiryTime)) {
                log.warn("Temporary password for user {} has expired at {}", email, expiryTime);
                
                // Log error transaction
                Transaction errorTransaction = new Transaction();
                errorTransaction.setActionDetails("Temporary password update failed - Password expired at: " + expiryTime + " for email: " + email);
                errorTransaction.setActionType("TEMP_PASSWORD_EXPIRED");
                transactionService.postTransaction(errorTransaction, null);
                
                throw new IllegalArgumentException("Temporary password has expired. Please contact administrator.");
            }
            
            // Password has not expired, update it
            log.info("Temporary password for user {} is still valid, updating password", email);
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setPasswordSetAt(Instant.now());
            user.setPasswordExpiresAt(null); // Clear the expiry since it's now a permanent password
            user.setMustChangePassword(false);
            
            userRepository.save(user);
            log.info("Password updated successfully for user: {}", email);
            
            // Log success transaction
            Transaction successTransaction = new Transaction();
            successTransaction.setActionDetails("Temporary password updated successfully for email: " + email);
            successTransaction.setActionType("TEMP_PASSWORD_UPDATED");
            transactionService.postTransaction(successTransaction, null);
            
            return false; // Password was updated successfully
            
        } catch (IllegalArgumentException e) {
            log.warn("Error updating temporary password: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while updating temporary password", e);
            
            // Log error transaction
            Transaction errorTransaction = new Transaction();
            errorTransaction.setActionDetails("Temporary password update error - " + e.getMessage());
            errorTransaction.setActionType("TEMP_PASSWORD_UPDATE_ERROR");
            transactionService.postTransaction(errorTransaction, null);
            
            throw new RuntimeException("Error updating temporary password: " + e.getMessage(), e);
        }
    }

    public boolean isTemporaryPasswordValid(String email) {
        log.info("Checking if temporary password is valid for email: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
        
        if (user.getPasswordExpiresAt() == null) {
            log.debug("User {} has no temporary password expiration set", email);
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiryTime = LocalDateTime.ofInstant(user.getPasswordExpiresAt(), java.time.ZoneId.systemDefault());
        
        boolean isValid = now.isBefore(expiryTime);
        log.info("Temporary password validity for user {}: {}", email, isValid);
        
        return isValid;
    }

    public void resetPasswordByEmail(String email){
        log.info("Initiating pasword reset for email: {}", email);
        
        try {
                User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

            // Generate new password
            String temporaryPassword = PasswordGenerator.generatePassword();

            // Update user with new password
            user.setPassword(passwordEncoder.encode(temporaryPassword));
            user.setPasswordSetAt(Instant.now());
            user.setPasswordExpiresAt(Instant.now().plusSeconds(24 * 60 * 60)); // 24 hours
            user.setMustChangePassword(true);
            userRepository.save(user);

            userRepository.save(user);
            log.info("Password reset and temporary password set for user: {}", email);
            emailService.sendTemporaryPasswordEmail(user.getEmail(), temporaryPassword);
              Transaction transaction = new Transaction();
            transaction.setActionDetails("Temporary password sent to email: " + email);
            transaction.setActionType("TEMP_PASSWORD_SENT");
            transactionService.postTransaction(transaction, null);
            

        }  catch (IllegalArgumentException e) {
            log.warn("Failed to send temporary password: {}", e.getMessage());
            
            // Log error transaction
            Transaction errorTransaction = new Transaction();
            errorTransaction.setActionDetails("Temporary password send failed - " + e.getMessage());
            errorTransaction.setActionType("TEMP_PASSWORD_SEND_ERROR");
            transactionService.postTransaction(errorTransaction, null);
            
            throw e;
        } 
         catch (Exception e) {
            log.error("Unexpected error while sending temporary password", e);
            
            // Log error transaction
            Transaction errorTransaction = new Transaction();
            errorTransaction.setActionDetails("Temporary password send error - " + e.getMessage());
            errorTransaction.setActionType("TEMP_PASSWORD_SEND_ERROR");
            transactionService.postTransaction(errorTransaction, null);
            
            throw new RuntimeException("Error sending temporary password: " + e.getMessage(), e);
        }
    }
    
    // public void sendTemporaryPassword(String email) {
    //     log.info("Initiating password reset for email: {}", email);
        
    //     try {
    //         User user = userRepository.findByEmailIgnoreCase(email)
    //                 .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
            
    //         // Generate temporary password
    //         String temporaryPassword = PasswordGenerator.generatePassword();
            
    //         // Update user with temporary password
    //         user.setPassword(passwordEncoder.encode(temporaryPassword));
    //         user.setPasswordSetAt(Instant.now());
    //         user.setPasswordExpiresAt(Instant.now().plusSeconds(24 * 60 * 60)); // 24 hours
    //         user.setMustChangePassword(true);
            
    //         userRepository.save(user);
    //         log.info("Temporary password set for user: {}", email);
            
    //         // TODO: Send email with temporary password to user
    //         // EmailService.sendPasswordResetEmail(user.getEmail(), temporaryPassword);
            
    //         // Log transaction
    //         Transaction transaction = new Transaction();
    //         transaction.setActionDetails("Temporary password sent to email: " + email);
    //         transaction.setActionType("TEMP_PASSWORD_SENT");
    //         transactionService.postTransaction(transaction, null);
            
    //     } catch (IllegalArgumentException e) {
    //         log.warn("Failed to send temporary password: {}", e.getMessage());
            
    //         // Log error transaction
    //         Transaction errorTransaction = new Transaction();
    //         errorTransaction.setActionDetails("Temporary password send failed - " + e.getMessage());
    //         errorTransaction.setActionType("TEMP_PASSWORD_SEND_ERROR");
    //         transactionService.postTransaction(errorTransaction, null);
            
    //         throw e;
    //     } catch (Exception e) {
    //         log.error("Unexpected error while sending temporary password", e);
            
    //         // Log error transaction
    //         Transaction errorTransaction = new Transaction();
    //         errorTransaction.setActionDetails("Temporary password send error - " + e.getMessage());
    //         errorTransaction.setActionType("TEMP_PASSWORD_SEND_ERROR");
    //         transactionService.postTransaction(errorTransaction, null);
            
    //         throw new RuntimeException("Error sending temporary password: " + e.getMessage(), e);
    //     }
    // }

    public boolean hasTemporaryPasswordToUpdate(String email, String tempPassword) {
        log.info("Checking if user {} has temporary password to update", email);
        
        try {
            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
            
            // If mustChangePassword is false, password is already permanent
            if (!user.getMustChangePassword()) {
                log.debug("User {} has permanent password, no update needed", email);
                return false;
            }
            
            // If passwordExpiresAt is null, no temporary password
            if (user.getPasswordExpiresAt() == null) {
                log.debug("User {} has no temporary password expiration set", email);
                return false;
            }

            if(user.getPassword() == null || !passwordEncoder.matches(tempPassword, user.getPassword())) {
                log.warn("Temporary password does not match for user: {}", email);
                return false;
            }
            
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expiryTime = LocalDateTime.ofInstant(user.getPasswordExpiresAt(), java.time.ZoneId.systemDefault());
            
            // If expired, return false
            if (now.isAfter(expiryTime)) {
                log.warn("Temporary password for user {} has expired", email);
                return false;
            }
            
            // Has valid temporary password that needs update
            log.info("User {} has valid temporary password to update", email);
            return true;
            
        } catch (IllegalArgumentException e) {
            log.warn("Error checking temporary password: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error checking temporary password", e);
            throw new RuntimeException("Error checking temporary password: " + e.getMessage(), e);
        }
    }




    public User createUser(CreateUserRequestDto dto) {
        String generatedPassword = PasswordGenerator.generatePassword();

        User user = User.builder()
                .firstname(dto.firstName())
                .middlename(dto.middleName())
                .lastname(dto.lastName())
                .suffix(dto.suffix())
                .email(dto.email().toLowerCase())
                .password(passwordEncoder.encode(generatedPassword))
                .phoneNumber(dto.phone())
                .isActive(true)
                .build();

        return userRepository.save(user);
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
            case "id":
                comparator = Comparator.comparing(UserSearchResult::id);
                break;
            default:
                throw new IllegalArgumentException("Invalid sort field: " + property);
        }

        return ascending ? comparator : comparator.reversed();
    }


}
