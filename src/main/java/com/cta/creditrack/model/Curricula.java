package com.cta.creditrack.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name= "cta_curricula")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Curricula {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    
    private String programTitle;

    private String programCode;
    private String year;
    private String semester;
    private String courseCode;
    private String courseTitle;
    private String preRequisite;
    private Integer lec;
    private Integer lab;
    private Integer units;



}
