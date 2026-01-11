package com.cta.creditrack.controllers;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cta.creditrack.dtos.RegisterRequest;
import com.cta.creditrack.dtos.StudentDetailRequest;
import com.cta.creditrack.model.User;
import com.cta.creditrack.services.StudentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

     @PostMapping("/save")
    public ResponseEntity<?> register(@Valid @RequestBody StudentDetailRequest req) {
       try {
        studentService.saveStudent(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            Map.of("message", "Student details saved successfully")
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



}
