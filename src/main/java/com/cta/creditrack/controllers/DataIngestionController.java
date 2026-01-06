package com.cta.creditrack.controllers;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cta.creditrack.services.DataIngestionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/ingest")
@RequiredArgsConstructor
public class DataIngestionController {

      private final DataIngestionService dataIngestionService;

    @PostMapping("/curricula")
    public ResponseEntity<?> ingestCurriculaData(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "File is empty");
                return ResponseEntity.badRequest().body(response);
            }

            if (!dataIngestionService.isValidFile(file)) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Invalid file format. Please upload an Excel or CSV file (.xlsx, .xls, .csv)");
                return ResponseEntity.badRequest().body(response);
            }

            String fileType = dataIngestionService.getFileType(file);
            dataIngestionService.ingestCurriculaData(file.getInputStream(), fileType);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Curricula data ingested successfully");
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Failed to ingest curricula data", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to process file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            log.error("Unexpected error during curricula ingestion", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    

}
