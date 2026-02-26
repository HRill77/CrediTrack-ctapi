package com.cta.creditrack.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class TranscriptDto {
    private String year;
    private String subjectCode;
    private String courseName;
    private String grade;
    private Integer credits;

     private Double confidence; 

}
