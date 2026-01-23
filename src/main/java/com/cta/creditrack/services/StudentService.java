package com.cta.creditrack.services;

import java.time.LocalDate;
import java.util.Optional;

import org.apache.poi.sl.draw.geom.GuideIf.Op;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cta.creditrack.auth.model.CustomUserDetials;
import com.cta.creditrack.dtos.StudentDetailRequest;
import com.cta.creditrack.enums.TransactionConstants;
import com.cta.creditrack.model.FileUpload;
import com.cta.creditrack.model.Student;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.model.TransferDetails;
import com.cta.creditrack.repository.FileUploadRepository;
import com.cta.creditrack.repository.StudentRepository;
import com.cta.creditrack.repository.TransferDetailsRepository;
import com.cta.creditrack.utils.FileUtility;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final TransferDetailsRepository transferDetailsRepository;
    private final FileUploadRepository fileUploadRepository;
    private final FileUtility fileUtility;
    @Autowired
    private TransactionService transactionService;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    @Transactional
public void saveStudent(StudentDetailRequest sdr,
                        MultipartFile torFile,
                        MultipartFile cdFile) {
    
    Student student = null;

    try {
        // ================= STUDENT SAVE =================
        Optional<Student> existing =
                studentRepository.findByEmail(sdr.email());

        student = existing.orElseGet(Student::new);
        student.setFirstname(sdr.firstname());
        student.setLastname(sdr.lastname());
        student.setMiddlename(sdr.middlename());
        student.setSuffix(sdr.suffix());
        student.setEmail(sdr.email());
        student.setYearLevel(sdr.yearLevel());

        student = studentRepository.save(student);

       transactionService.logTransaction(
                null,
                transactionService.generateTransactionNumber(),
                TransactionConstants.ACTION_SAVE.getValue(),
                TransactionConstants.MODULE_STUDENT.getValue(),
                "Student saved: " + student.getEmail(),
                "SUCCESS"
        );

        // ================= TRANSFER DETAILS =================
        boolean hasTD =
                transferDetailsRepository.existsByStudentId(student.getId());

        if (!hasTD) {
            TransferDetails td = new TransferDetails();
            td.setFromUniversity(sdr.fromUniversity());
            td.setFromCollege(sdr.fromCollege());
            td.setFromProgram(sdr.fromProgram());
            td.setToUniversity(sdr.toUniversity());
            td.setToCollege(sdr.toCollege());
            td.setToProgram(sdr.toProgram());
            td.setStudent(student);

            transferDetailsRepository.save(td);

             transactionService.logTransaction(
                    null,
                    transactionService.generateTransactionNumber(),
                    TransactionConstants.ACTION_SAVE.getValue(),
                    TransactionConstants.MODULE_TRANSFER.getValue(),
                    "Transfer details saved for student ID " + student.getId(),
                    "SUCCESS"
            );
        }

        // ================= FILE UPLOAD =================
        FileUpload fileUpload =
                fileUploadRepository.findByStudentId(student.getId())
                        .stream()
                        .findFirst()
                        .orElseGet(FileUpload::new);

        fileUpload.setTorFilename(torFile.getOriginalFilename());
        fileUpload.setTorFileType(torFile.getContentType());
        fileUpload.setTorFileData(torFile.getBytes());
        fileUpload.setTorFileSize(torFile.getSize());

        fileUpload.setCdFilename(cdFile.getOriginalFilename());
        fileUpload.setCdFileType(cdFile.getContentType());
        fileUpload.setCdFileData(cdFile.getBytes());
        fileUpload.setCdFileSize(cdFile.getSize());

        fileUpload.setStudent(student);
        fileUploadRepository.save(fileUpload);

        transactionService.logTransaction(
                null,
                transactionService.generateTransactionNumber(),
                TransactionConstants.ACTION_UPLOAD.getValue(),
                TransactionConstants.MODULE_FILE_UPLOAD.getValue(),
                "Files uploaded for student ID " + student.getId(),
                "SUCCESS"
        );

    } catch (Exception e) {

        // ===== FAILURE LOGS (best effort) =====
          transactionService.logTransaction(
                null,
                transactionService.generateTransactionNumber(),
                "PROCESS",
                "STUDENT_ONBOARDING",
                "Failed student onboarding",
                e.getMessage()
        );

        log.error("Error saving student", e);

        // force rollback of main transaction
        throw new RuntimeException(e);
    }
}


    public boolean emailExists(String email) {
        try {
            boolean exists = studentRepository.findByEmail(email).isPresent();

            if (exists) {
                log.info("Email already exists: {}", email);
            } else {
                log.warn("No student found with email: {}", email);
            }
            return exists;
        } catch (Exception e) {
            log.error("Error checking if email exists: {}", e.getMessage());
            return false;
        }
    }

}
