package com.cta.creditrack.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.cta.creditrack.dtos.FileUploadDTO;
import com.cta.creditrack.dtos.FileUploadDTO2;
import com.cta.creditrack.model.FileUpload;
import com.cta.creditrack.services.FileUploadService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileUploadController {

    @Autowired
    private final FileUploadService fileUploadService;

    /**
     * Upload a file (PDF or JPEG)
     * 
     * @param file        The file to upload (multipart)
     * @param studentId   The student ID associated with the file
     * @param description Optional description for the file
     * @return ResponseEntity with file details
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("torFile") MultipartFile torFile,
            @RequestParam("cdFile") MultipartFile cdFile,
            @RequestParam("studentId") Long studentId,
            @RequestParam(value = "description", required = false) String description) {

        try {
            log.info("Uploading file: {} for student ID: {}", torFile.getOriginalFilename(), studentId);

            FileUpload uploadedFile = fileUploadService.uploadFile(torFile, cdFile, studentId, description);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "File uploaded successfully");
            response.put("fileId", uploadedFile.getId());
            response.put("filename", uploadedFile.getTorFilename() != null ? uploadedFile.getTorFilename()
                    : uploadedFile.getCdFilename());
            response.put("fileType", uploadedFile.getTorFileType() != null ? uploadedFile.getTorFileType()
                    : uploadedFile.getCdFileType());
            response.put("fileSize", uploadedFile.getTorFileSize() != null ? uploadedFile.getTorFileSize()
                    : uploadedFile.getCdFileSize());
            response.put("uploadDate", uploadedFile.getUploadDate());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Invalid file: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);

        } catch (IOException e) {
            log.error("Error uploading file: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error uploading file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);

        } catch (Exception e) {
            log.error("Unexpected error during file upload: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Unexpected error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get file by ID
     * 
     * @param fileId The ID of the file
     * @return ResponseEntity with file data
     */
    // @GetMapping("/{fileId}")
    // public ResponseEntity<?> getFile(@PathVariable Long fileId) {
    // try {
    // FileUpload fileUpload = fileUploadService.getFileById(fileId);

    // if (fileUpload == null) {
    // Map<String, Object> response = new HashMap<>();
    // response.put("success", false);
    // response.put("message", "File not found");
    // return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    // }

    // log.info("Downloading file: {}", fileUpload.getFilename());

    // return ResponseEntity.ok()
    // .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" +
    // fileUpload.getFilename() + "\"")
    // .contentType(MediaType.parseMediaType(fileUpload.getFileType()))
    // .body(fileUpload.getFileData());

    // } catch (Exception e) {
    // log.error("Error retrieving file: {}", e.getMessage());
    // Map<String, Object> response = new HashMap<>();
    // response.put("success", false);
    // response.put("message", "Error retrieving file");
    // return
    // ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    // }
    // }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getFilesByStudentId(@PathVariable Long studentId) {
        try {
            List<FileUpload> files = fileUploadService.getFilesByStudentId(studentId);
            List<FileUploadDTO2> dtoList = files.stream()
                    .map(f -> new FileUploadDTO2(
                            f.getId(), f.getTorFilename(), f.getTorFileType(), f.getTorFileSize(), f.getTorFileData(),
                            f.getCdFilename(), f.getCdFileType(), f.getCdFileSize(), f.getCdFileData(),
                            f.getUploadDate(), f.getStudent().getId()))
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("studentId", studentId);
            response.put("fileCount", files.size());
            response.put("files", dtoList);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error retrieving files: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error retrieving files");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Delete a file
     * 
     * @param fileId The ID of the file to delete
     * @return ResponseEntity with success status
     */
    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> deleteFile(@PathVariable Long fileId) {
        try {
            boolean deleted = fileUploadService.deleteFile(fileId);

            Map<String, Object> response = new HashMap<>();
            if (deleted) {
                response.put("success", true);
                response.put("message", "File deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "File not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

        } catch (Exception e) {
            log.error("Error deleting file: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error deleting file");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Health check endpoint
     * 
     * @return ResponseEntity with status
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "File upload service is running");
        return ResponseEntity.ok(response);
    }
}
