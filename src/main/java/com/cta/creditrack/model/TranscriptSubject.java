package com.cta.creditrack.model;

public class TranscriptSubject {

    private String year;
    private String subjectCode;
    private String courseName;
    private String grade;
    private int credits;

    public TranscriptSubject(String year, String subjectCode,
                             String courseName, String grade, int credits) {
        this.year = year;
        this.subjectCode = subjectCode;
        this.courseName = courseName;
        this.grade = grade;
        this.credits = credits;
    }

    public String getYear() { return year; }
    public String getSubjectCode() { return subjectCode; }
    public String getCourseName() { return courseName; }
    public String getGrade() { return grade; }
    public int getCredits() { return credits; }
}