package com.cta.creditrack.dtos;

import java.time.LocalDateTime;

public class TranscriptResponse {
    
    private Long id;
    private String year;
    private String subjectCode;
    private String courseName;
    private String grade;
    private Integer credits;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructor
    public TranscriptResponse(
            Long id,
            String year,
            String subjectCode,
            String courseName,
            String grade,
            Integer credits,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.year = year;
        this.subjectCode = subjectCode;
        this.courseName = courseName;
        this.grade = grade;
        this.credits = credits;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public void setSubjectCode(String subjectCode) {
        this.subjectCode = subjectCode;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public Integer getCredits() {
        return credits;
    }

    public void setCredits(Integer credits) {
        this.credits = credits;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
