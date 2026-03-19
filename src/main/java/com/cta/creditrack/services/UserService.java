package com.cta.creditrack.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.cta.creditrack.dtos.CreateUserRequestDto;
import com.cta.creditrack.dtos.UpdateUserProfileRequest;
import com.cta.creditrack.dtos.UserSearchRequest;
import com.cta.creditrack.dtos.UserSearchResult;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.model.User;
import com.cta.creditrack.repository.UserRepository;
import com.cta.creditrack.utils.CheckNullOrIsEmpty;
import com.cta.creditrack.utils.PasswordGenerator;

import java.io.IOException;
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

                        String middleInitial = (row[2] != null && !((String) row[2]).isEmpty())
                                ? String.valueOf(((String) row[2]).charAt(0))
                                : "";

                        return new UserSearchResult(
                                (Long) row[0], // id
                                String.format("%s, %s %s", row[3], row[1], middleInitial).trim(), // fullName
                                (String) row[4], // email
                                (Boolean) row[5], // is_active
                                (String) row[6], // program
                                (String) row[7], // role
                                createdAtStr, // created_at
                                updatedAtStr // updated_at
                        );
                    })
                    .collect(Collectors.toList());

            log.info("Found {} users", userResults.size());

            // Post transaction for user search activity
            Transaction transaction = new Transaction();
            transaction.setActionDetails(
                    "User search - Search text: " + searchText + ", Program ID: " + programId + ", Role ID: " + roleId);
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
                errorTransaction.setActionDetails("User search error");
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
                errorTransaction.setActionDetails("User search error");
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
                errorTransaction.setActionDetails(
                        "Temporary password update failed - Current password mismatch for email: " + email);
                errorTransaction.setActionType("INVALID_CURRENT_PASSWORD");
                transactionService.postTransaction(errorTransaction, null);

                throw new IllegalArgumentException("Temporary password is incorrect");
            }

            // Check if passwordExpiresAt is set and if it has expired
            if (user.getPasswordExpiresAt() == null) {
                log.warn("User {} has no temporary password expiration set", email);

                // Log error transaction
                Transaction errorTransaction = new Transaction();
                errorTransaction.setActionDetails(
                        "Temporary password update failed - No temporary password set for email: " + email);
                errorTransaction.setActionType("TEMP_PASSWORD_UPDATE_ERROR");
                transactionService.postTransaction(errorTransaction, null);

                throw new IllegalArgumentException("User does not have a temporary password");
            }

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expiryTime = LocalDateTime.ofInstant(user.getPasswordExpiresAt(),
                    java.time.ZoneId.systemDefault());

            if (now.isAfter(expiryTime)) {
                log.warn("Temporary password for user {} has expired at {}", email, expiryTime);

                // Log error transaction
                Transaction errorTransaction = new Transaction();
                errorTransaction.setActionDetails("Temporary password update failed - Password expired at: "
                        + expiryTime + " for email: " + email);
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
            successTransaction.setActionDetails("Temporary password updated");
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
            errorTransaction.setActionDetails("Temporary password update error");
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
        LocalDateTime expiryTime = LocalDateTime.ofInstant(user.getPasswordExpiresAt(),
                java.time.ZoneId.systemDefault());

        boolean isValid = now.isBefore(expiryTime);
        log.info("Temporary password validity for user {}: {}", email, isValid);

        return isValid;
    }

    public void resetPasswordByEmail(String email) {
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
            transaction.setActionDetails("Temporary password sent");
            transaction.setActionType("TEMP_PASSWORD_SENT");
            transactionService.postTransaction(transaction, null);

        } catch (IllegalArgumentException e) {
            log.warn("Failed to send temporary password: {}", e.getMessage());

            // Log error transaction
            Transaction errorTransaction = new Transaction();
            errorTransaction.setActionDetails("Temporary password send failed");
            errorTransaction.setActionType("TEMP_PASSWORD_SEND_ERROR");
            transactionService.postTransaction(errorTransaction, null);

            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while sending temporary password", e);

            // Log error transaction
            Transaction errorTransaction = new Transaction();
            errorTransaction.setActionDetails("Temporary password send error");
            errorTransaction.setActionType("TEMP_PASSWORD_SEND_ERROR");
            transactionService.postTransaction(errorTransaction, null);

            throw new RuntimeException("Error sending temporary password: " + e.getMessage(), e);
        }
    }

    public void updateWhitelistStatus(Long userId, Boolean isWhitelisted) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsWhitelisted(isWhitelisted);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    // public void sendTemporaryPassword(String email) {
    // log.info("Initiating password reset for email: {}", email);

    // try {
    // User user = userRepository.findByEmailIgnoreCase(email)
    // .orElseThrow(() -> new IllegalArgumentException("User not found with email: "
    // + email));

    // // Generate temporary password
    // String temporaryPassword = PasswordGenerator.generatePassword();

    // // Update user with temporary password
    // user.setPassword(passwordEncoder.encode(temporaryPassword));
    // user.setPasswordSetAt(Instant.now());
    // user.setPasswordExpiresAt(Instant.now().plusSeconds(24 * 60 * 60)); // 24
    // hours
    // user.setMustChangePassword(true);

    // userRepository.save(user);
    // log.info("Temporary password set for user: {}", email);

    // // TODO: Send email with temporary password to user
    // // EmailService.sendPasswordResetEmail(user.getEmail(), temporaryPassword);

    // // Log transaction
    // Transaction transaction = new Transaction();
    // transaction.setActionDetails("Temporary password sent to email: " + email);
    // transaction.setActionType("TEMP_PASSWORD_SENT");
    // transactionService.postTransaction(transaction, null);

    // } catch (IllegalArgumentException e) {
    // log.warn("Failed to send temporary password: {}", e.getMessage());

    // // Log error transaction
    // Transaction errorTransaction = new Transaction();
    // errorTransaction.setActionDetails("Temporary password send failed - " +
    // e.getMessage());
    // errorTransaction.setActionType("TEMP_PASSWORD_SEND_ERROR");
    // transactionService.postTransaction(errorTransaction, null);

    // throw e;
    // } catch (Exception e) {
    // log.error("Unexpected error while sending temporary password", e);

    // // Log error transaction
    // Transaction errorTransaction = new Transaction();
    // errorTransaction.setActionDetails("Temporary password send error - " +
    // e.getMessage());
    // errorTransaction.setActionType("TEMP_PASSWORD_SEND_ERROR");
    // transactionService.postTransaction(errorTransaction, null);

    // throw new RuntimeException("Error sending temporary password: " +
    // e.getMessage(), e);
    // }
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

            if (user.getPassword() == null || !passwordEncoder.matches(tempPassword, user.getPassword())) {
                log.warn("Temporary password does not match for user: {}", email);
                return false;
            }

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expiryTime = LocalDateTime.ofInstant(user.getPasswordExpiresAt(),
                    java.time.ZoneId.systemDefault());

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
                .isWhitelisted(true)
                .isActive(true)
                .build();

        return userRepository.save(user);
    }

    private Comparator<UserSearchResult> getUserListComparator(String property, boolean ascending) {
        Comparator<UserSearchResult> comparator = null;

        switch (property) {
            case "fullName":
                comparator = Comparator.comparing(UserSearchResult::fullName,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "email":
                comparator = Comparator.comparing(UserSearchResult::email,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "isActive":
                comparator = Comparator.comparing(UserSearchResult::isActive);
                break;
            case "program":
                comparator = Comparator.comparing(UserSearchResult::program,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "role":
                comparator = Comparator.comparing(UserSearchResult::role,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "createdAt":
                comparator = Comparator.comparing(UserSearchResult::createdAt,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "updatedAt":
                comparator = Comparator.comparing(UserSearchResult::updatedAt,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "id":
                comparator = Comparator.comparing(UserSearchResult::id);
                break;
            default:
                throw new IllegalArgumentException("Invalid sort field: " + property);
        }

        return ascending ? comparator : comparator.reversed();
    }

    public void updateUserStatus(Long userId, Boolean isActive) {
        try {
            if (userId == null || userId <= 0) {
                throw new IllegalArgumentException("User ID must be greater than 0");
            }

            if (isActive == null) {
                throw new IllegalArgumentException("isActive status cannot be null");
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

            user.setIsActive(isActive);
            userRepository.save(user);

            // Log transaction for user status update
            Transaction transaction = new Transaction();
            transaction.setActionDetails("User status updated");
            transaction.setActionType("UPDATE_USER_STATUS");
            transactionService.postTransaction(transaction, user.getId());

            log.info("User status updated successfully for user ID: {} - isActive: {}", userId, isActive);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid parameters for user status update: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error updating user status for user ID: {}", userId, e);
            throw new RuntimeException("Error updating user status: " + e.getMessage(), e);
        }
    }

    public void updatePassword(String email, String currentPassword, String newPassword) {
        try {
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Email cannot be blank");
            }

            if (currentPassword == null || currentPassword.isBlank()) {
                throw new IllegalArgumentException("Current password cannot be blank");
            }

            if (newPassword == null || newPassword.isBlank()) {
                throw new IllegalArgumentException("New password cannot be blank");
            }

            if (newPassword.length() < 8) {
                throw new IllegalArgumentException("New password must be at least 8 characters long");
            }

            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

            // Verify current password
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                log.warn("Failed password update attempt - incorrect current password for email: {}", email);

                // Log failed transaction
                Transaction failedTransaction = new Transaction();
                failedTransaction.setActionDetails("Password update failed - invalid password");
                failedTransaction.setActionType("PASSWORD_UPDATE_FAILED");
                transactionService.postTransaction(failedTransaction, user.getId());

                throw new IllegalArgumentException("Current password is incorrect");
            }

            // Update to new password
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setPasswordSetAt(Instant.now());
            user.setMustChangePassword(false);

            userRepository.save(user);
            log.info("Password updated successfully for email: {}", email);

            // Log success transaction
            Transaction successTransaction = new Transaction();
            successTransaction.setActionDetails("Password updated successfully");
            successTransaction.setActionType("PASSWORD_UPDATED");
            transactionService.postTransaction(successTransaction, user.getId());

        } catch (IllegalArgumentException e) {
            log.warn("Error updating password: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while updating password", e);

            // Log error transaction
            Transaction errorTransaction = new Transaction();
            errorTransaction.setActionDetails("Password update error");
            errorTransaction.setActionType("PASSWORD_UPDATE_ERROR");
            transactionService.postTransaction(errorTransaction, null);

            throw new RuntimeException("Error updating password: " + e.getMessage(), e);
        }
    }

    public void updateUserProfile(String email, UpdateUserProfileRequest profileRequest, MultipartFile imageFile) {
        try {
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Email cannot be blank");
            }

            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

            // Update name fields
            if (profileRequest.firstName() != null && !profileRequest.firstName().isBlank()) {
                user.setFirstname(profileRequest.firstName());
            }

            if (profileRequest.middleName() != null && !profileRequest.middleName().isBlank()) {
                user.setMiddlename(profileRequest.middleName());
            }

            if (profileRequest.lastName() != null && !profileRequest.lastName().isBlank()) {
                user.setLastname(profileRequest.lastName());
            }

            if (profileRequest.suffix() != null && !profileRequest.suffix().isBlank()) {
                user.setSuffix(profileRequest.suffix());
            }

            // Handle image upload if provided
            if (imageFile != null && !imageFile.isEmpty()) {
                String fileName = imageFile.getOriginalFilename();
                String fileType = imageFile.getContentType();
                Long fileSize = imageFile.getSize();

                // Validate file
                if (fileName == null || fileName.isBlank()) {
                    throw new IllegalArgumentException("Invalid file name");
                }

                // Validate file type (allow common image formats)
                if (fileType == null || !fileType.startsWith("image/")) {
                    throw new IllegalArgumentException("Only image files are allowed");
                }

                // Validate file size (max 5MB)
                if (fileSize > 5 * 1024 * 1024) {
                    throw new IllegalArgumentException("File size cannot exceed 5MB");
                }

                try {
                    byte[] fileData = imageFile.getBytes();
                    user.setFilename(fileName);
                    user.setFileType(fileType);
                    user.setFileData(fileData);
                    user.setFileSize(fileSize);
                    log.info("Image updated for user: {} - filename: {}, size: {}", email, fileName, fileSize);
                } catch (IOException e) {
                    log.error("Failed to read file data for user: {}", email, e);
                    throw new IllegalArgumentException("Failed to process image file: " + e.getMessage());
                }
            }

            user.setUpdatedAt(Instant.now());

            // Ensure password_set_at is not null
            if (user.getPasswordSetAt() == null) {
                user.setPasswordSetAt(Instant.now());
            }

            userRepository.save(user);
            log.info("Profile updated successfully for user: {}", email);

            // Log success transaction
            // Log success transaction
            Transaction successTransaction = new Transaction();
            String details = "Profile updated";
            if (imageFile != null && !imageFile.isEmpty()) {
                details += " with image";
            }
            successTransaction.setActionDetails(details);
            successTransaction.setActionType("PROFILE_UPDATED");
            transactionService.postTransaction(successTransaction, user.getId());

        } catch (IllegalArgumentException e) {
            log.warn("Error updating profile: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while updating profile", e);

            // Log error transaction
            Transaction errorTransaction = new Transaction();
            errorTransaction.setActionDetails("Profile update error");
            errorTransaction.setActionType("PROFILE_UPDATE_ERROR");
            transactionService.postTransaction(errorTransaction, null);

            throw new RuntimeException("Error updating profile: " + e.getMessage(), e);
        }
    }

}
