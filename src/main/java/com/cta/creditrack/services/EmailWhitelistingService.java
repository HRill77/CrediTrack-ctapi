package com.cta.creditrack.services;

import com.cta.creditrack.dtos.EmailWhitelistingResult;
import com.cta.creditrack.dtos.UserSearchResult;
import com.cta.creditrack.dtos.WhiteListingSearch;
import com.cta.creditrack.dtos.EmailWhitelistingRequest;
import com.cta.creditrack.model.EmailWhitelisting;
import com.cta.creditrack.repository.EmailWhitelistingRepository;
import com.cta.creditrack.utils.CheckNullOrIsEmpty;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class EmailWhitelistingService {

    @Autowired
    private EmailWhitelistingRepository whitelistingRepository;

    public Page<EmailWhitelistingResult> searchWhitelisting(
            WhiteListingSearch request, Pageable pageable) {
        String searchText = CheckNullOrIsEmpty.isEmptyOrNull(request.searchText());
        try {

            if (searchText != null && searchText.length() > 255) {
                throw new IllegalArgumentException("Search text cannot exceed 255 characters");
            }
            List<EmailWhitelisting> whitelistings;

            whitelistings = whitelistingRepository.searchByEmail(searchText);

            // Sort the results

            List<EmailWhitelistingResult> results = whitelistings.stream()
                    .map(this::convertToResult)

                    .collect(Collectors.toList());

            // Comparator<EmailWhitelistingResult> comparator =
            // getWhitelistingComparator(request.sortField(), request.sortDirection());

            // Paginate
            // Pageable pageable = PageRequest.of(page, pageSize);
            if (pageable.getSort().isSorted()) {
                Comparator<EmailWhitelistingResult> comparator = null;

                for (Sort.Order order : pageable.getSort()) {
                    Comparator<EmailWhitelistingResult> fieldComparator = getWhitelistingComparator(order.getProperty(),
                            order.isAscending());

                    if (fieldComparator != null) {
                        comparator = comparator == null ? fieldComparator : comparator.thenComparing(fieldComparator);
                    }
                }

                if (comparator != null) {
                    results.sort(comparator);
                }
            }
            int start = (int) pageable.getOffset();
            int total = results.size();
            int end = Math.min(start + pageable.getPageSize(), total);

            List<EmailWhitelistingResult> pageContent = results.subList(start, end);

            return new PageImpl<>(pageContent, pageable, total);
        } catch (Exception e) {
            log.error("Error searching whitelisting", e);
            throw new RuntimeException("Error searching whitelisting: " + e.getMessage(), e);
        }

    }

    public EmailWhitelistingResult updateWhitelistingStatus(Long id) {
        try {
            EmailWhitelisting whitelisting = whitelistingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Email not found in whitelist"));

            whitelisting.setStatus(!whitelisting.getStatus());
            whitelisting.setUpdatedAt(LocalDateTime.now());

            EmailWhitelisting updated = whitelistingRepository.save(whitelisting);
            return convertToResult(updated);
        } catch (Exception e) {
            log.error("Error updating whitelisting status", e);
            throw new RuntimeException("Error updating whitelisting status: " + e.getMessage(), e);
        }
    }

    public Comparator<EmailWhitelistingResult> getWhitelistingComparator(String property, boolean ascending) {
        Comparator<EmailWhitelistingResult> comparator = null;

        switch (property) {
            case "email":
                comparator = Comparator.comparing(EmailWhitelistingResult::getEmail,
                        Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "status":
                comparator = Comparator.comparing(EmailWhitelistingResult::getStatus,
                        Comparator.nullsLast(Boolean::compareTo));
                break;
            default:
                comparator = Comparator.comparing(EmailWhitelistingResult::getId,
                        Comparator.nullsLast(Long::compareTo));
        }

        return ascending ? comparator : comparator.reversed();
    }

    private EmailWhitelistingResult convertToResult(EmailWhitelisting whitelisting) {
        return EmailWhitelistingResult.builder()
                .id(whitelisting.getId())
                .email(whitelisting.getEmail())
                .status(whitelisting.getStatus())
                .createdAt(whitelisting.getCreatedAt())
                .updatedAt(whitelisting.getUpdatedAt())
                .build();
    }

    public void saveWhiteListingEmail(EmailWhitelistingRequest elr) {
        EmailWhitelisting whiteList = null;
        try {
            Optional<EmailWhitelisting> existingEmail = whitelistingRepository.findByEmail(elr.email());
            whiteList = existingEmail.orElseGet(EmailWhitelisting::new);
            whiteList.setEmail(elr.email());
            whiteList = whitelistingRepository.save(whiteList);
        } catch (Exception e) {
            log.error("Error saving whitelisting", e);
            // force rollback of main transaction
            throw new RuntimeException(e);
        }
    }

    public EmailWhitelistingResult addEmail(String email) {
        // Check if email already exists
        Optional<EmailWhitelisting> existing = whitelistingRepository.findByEmailIgnoreCase(email);

        if (existing.isPresent()) {
            throw new RuntimeException("Email already exists in whitelist");
        }

        // Create new whitelist entry
        EmailWhitelisting whitelisting = EmailWhitelisting.builder()
                .email(email)
                .status(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        EmailWhitelisting saved = whitelistingRepository.save(whitelisting);
        return convertToResult(saved);
    }
}