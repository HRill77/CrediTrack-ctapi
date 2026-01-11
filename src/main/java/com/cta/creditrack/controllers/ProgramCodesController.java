package com.cta.creditrack.controllers;

import com.cta.creditrack.services.ProgramCodesService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/curricula/filters")
@RequiredArgsConstructor
public class ProgramCodesController {

    private final ProgramCodesService programCodesService;

    @GetMapping("/program-codes")
    public ResponseEntity<?> getProgramCodes() {
        try {
            List<String> programCodes = programCodesService.getDistinctProgramCodes();
            log.info("Successfully retrieved {} program codes", programCodes.size());
            return ResponseEntity.ok(programCodes);
        } catch (Exception e) {
            log.error("Error fetching program codes", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An error occurred while fetching program codes: " + e.getMessage()));
        }
    }


    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", "error");
        errorResponse.put("message", message);
        errorResponse.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return errorResponse;
    }
}
