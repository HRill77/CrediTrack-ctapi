package com.cta.creditrack.services;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.cta.creditrack.auth.model.CustomUserDetials;
import com.cta.creditrack.dtos.StudentDetailRequest;
import com.cta.creditrack.model.Student;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.repository.StudentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    @Autowired
    private TransactionService transactionService;

    public void saveStudent(StudentDetailRequest sdr){
     
        try {
              Student student = new Student();
        student.setFirstname(sdr.firstname());
        student.setLastname(sdr.lastname());
        student.setMiddlename(sdr.middlename());
        student.setSuffix(sdr.suffix());
        student.setEmail(sdr.email());
        student.setPhone(sdr.phone());
        student.setAddress(sdr.address());
        student.setYearLevel(sdr.yearLevel());
        LocalDate dob = sdr.dob() != null? LocalDate.parse(sdr.dob()) : null;
        student.setDob(dob);
        studentRepository.save(student);

            Transaction transaction = new Transaction();
            transaction.setActionDetails("Saved student details for: " + student.getFirstname() + " " + student.getLastname()
            );
            transaction.setActionType("SAVE_STUDENT_DETAILS");
            transactionService.postTransaction(transaction, null);
        } catch (Exception e) {
            // TODO: handle exception
            log.error("Error saving student details: {}", e.getMessage());
        }
    }

}
