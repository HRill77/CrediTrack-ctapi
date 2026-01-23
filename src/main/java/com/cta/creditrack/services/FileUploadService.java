package com.cta.creditrack.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cta.creditrack.model.FileUpload;
import com.cta.creditrack.model.Student;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.repository.FileUploadRepository;
import com.cta.creditrack.repository.StudentRepository;
import com.cta.creditrack.utils.FileUtility;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final FileUploadRepository fileUploadRepository;
    private final StudentRepository studentRepository;
    private final FileUtility fileUtility;
    @Autowired
    private TransactionService transactionService;

    // Allowed file types
    // private static final String[] ALLOWED_FILE_TYPES = {"application/pdf", "image/jpeg", "image/jpg"};
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    public FileUpload uploadFile(MultipartFile torFile, MultipartFile cdFile,  Long studentId, String description) throws IOException {
        try {
            // Validate file
            if (torFile.isEmpty() && cdFile.isEmpty()) {
                throw new IllegalArgumentException("File is empty");
            }

            if (!fileUtility.isAllowedFileType(torFile.getContentType()) || !fileUtility.isAllowedFileType(cdFile.getContentType())) {
                throw new IllegalArgumentException("File type not allowed. Only PDF and JPEG files are allowed.");
            }

            if (torFile.getSize() > MAX_FILE_SIZE || cdFile.getSize() > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("File size exceeds maximum limit of 5MB");
            }

            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new IllegalArgumentException("Student not found with ID: " + studentId)); 
            // Create FileUpload entity
            FileUpload fileUpload = new FileUpload();
            fileUpload.setTorFilename(torFile.getOriginalFilename());
            fileUpload.setTorFileType(torFile.getContentType());
            fileUpload.setTorFileData(torFile.getBytes());
            fileUpload.setTorFileSize(torFile.getSize());
            fileUpload.setCdFilename(cdFile.getOriginalFilename());
            fileUpload.setCdFileType(cdFile.getContentType());
            fileUpload.setCdFileData(cdFile.getBytes());
            fileUpload.setCdFileSize(cdFile.getSize());
            fileUpload.setStudent(student);
            // Save to database
            FileUpload savedFile = fileUploadRepository.save(fileUpload);

            // Log transaction
            Transaction transaction = new Transaction();
            transaction.setActionDetails("Uploaded file: " + torFile.getOriginalFilename() + " for student ID: " + studentId);
            transaction.setActionType("FILE_UPLOAD");
            transactionService.postTransaction(transaction, null);

            log.info("File uploaded successfully: {} for student ID: {}", torFile.getOriginalFilename(), studentId);
            return savedFile;

        } catch (IOException e) {
            log.error("Error uploading file: {}", e.getMessage());
            throw new IOException("Error uploading file", e);
        } catch (Exception e) {
            log.error("Unexpected error during file upload: {}", e.getMessage());
            throw new RuntimeException("Unexpected error during file upload", e);
        }
    }

    public FileUpload getFileById(Long fileId) {
        try {
            Optional<FileUpload> fileUpload = fileUploadRepository.findById(fileId);
            if (fileUpload.isPresent()) {
                log.info("Retrieved file: {}", fileId);
                return fileUpload.get();
            } else {
                log.warn("File not found with ID: {}", fileId);
                return null;
            }
        } catch (Exception e) {
            log.error("Error retrieving file: {}", e.getMessage());
            return null;
        }
    }

    public List<FileUpload> getFilesByStudentId(Long studentId) {
        try {
            List<FileUpload> files = fileUploadRepository.findByStudentId(studentId);
            log.info("Retrieved {} files for student ID: {}", files.size(), studentId);
            return files;
        } catch (Exception e) {
            log.error("Error retrieving files for student: {}", e.getMessage());
            return List.of();
        }
    }

    public boolean deleteFile(Long fileId) {
        try {
            if (fileUploadRepository.existsById(fileId)) {
                fileUploadRepository.deleteById(fileId);
                log.info("File deleted successfully: {}", fileId);
                return true;
            } else {
                log.warn("File not found for deletion: {}", fileId);
                return false;
            }
        } catch (Exception e) {
            log.error("Error deleting file: {}", e.getMessage());
            return false;
        }
    }

    // public boolean isAllowedFileType(String contentType) {
    //     for (String allowedType : ALLOWED_FILE_TYPES) {
    //         if (contentType != null && contentType.equals(allowedType)) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }
}
