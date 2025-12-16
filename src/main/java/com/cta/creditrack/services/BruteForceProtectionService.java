package com.cta.creditrack.services;


import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class BruteForceProtectionService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long BLOCK_DURATION_SECONDS = 15 * 60; // 15 minutes

    private record Attempt(int count, Instant firstAttemptTime) {}

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    private String key(String username, String ip) {
        return username.toLowerCase() + ":" + ip;
    }
    // Returns remaining block time in seconds
    public long getRemainingBlockTimeSeconds(String username, String ip) {
        Attempt a = attempts.get(key(username, ip));
        if (a == null) return 0;
        
        long secondsElapsed = java.time.temporal.ChronoUnit.SECONDS.between(
            a.firstAttemptTime, Instant.now());
        long remainingSeconds = BLOCK_DURATION_SECONDS - secondsElapsed;
        
        return remainingSeconds > 0 ? remainingSeconds : 0;
    }

    public boolean isBlocked(String username, String ip) {
        Attempt a = attempts.get(key(username, ip));
        if (a == null) return false;
        if (a.count >= MAX_ATTEMPTS &&
            Instant.now().isBefore(a.firstAttemptTime.plusSeconds(BLOCK_DURATION_SECONDS))) {
            return true;
        }
        // window expired -> cleanup
        if (Instant.now().isAfter(a.firstAttemptTime.plusSeconds(BLOCK_DURATION_SECONDS))) {
            attempts.remove(key(username, ip));
        }
        return false;
    }

    public void loginFailed(String username, String ip) {
        String key = key(username, ip);
        attempts.compute(key, (k, a) -> {
            if (a == null) return new Attempt(1, Instant.now());
            if (Instant.now().isAfter(a.firstAttemptTime.plusSeconds(BLOCK_DURATION_SECONDS))) {
                return new Attempt(1, Instant.now());
            }
            return new Attempt(a.count + 1, a.firstAttemptTime);
        });
        log.warn("Login failed for {} from {}. Attempts: {}", username, ip,
                attempts.get(key).count);
    }

    public void loginSucceeded(String username, String ip) {
        attempts.remove(key(username, ip));
    }
}
