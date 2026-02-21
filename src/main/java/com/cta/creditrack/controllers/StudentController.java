package com.cta.creditrack.controllers;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cta.creditrack.dtos.RegisterRequest;
import com.cta.creditrack.dtos.StudentDetailRequest;
import com.cta.creditrack.model.User;
import com.cta.creditrack.services.StudentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestParam;


@Slf4j
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

     @PostMapping(
    value = "/save",
    consumes = MediaType.MULTIPART_FORM_DATA_VALUE
)
    public ResponseEntity<?> saveStudent(
            @ModelAttribute StudentDetailRequest req,
            @RequestParam("torFile") MultipartFile torFile,
            @RequestParam(value = "cdFile", required = false) MultipartFile cdFile
    ){
       try {
        Long studentId = studentService.saveStudent(req, torFile, cdFile);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            Map.of(
                "message", "Student details saved successfully",
                "studentId", studentId
            )
        );

        //  User user = authService.registerUser(req);
        // return ResponseEntity.status(HttpStatus.CREATED).body(
        //         "User registered with email: " + user.getEmail());
       } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            Map.of("error", e.getMessage())
        );
    }
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        try {
            boolean exists = studentService.emailExists(email);
            return ResponseEntity.ok(
                Map.of("emailExists", exists)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                Map.of("error", e.getMessage())
            );
        }
    }
    



}
