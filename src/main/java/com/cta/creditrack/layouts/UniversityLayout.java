package com.cta.creditrack.layouts;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "cta_university_layout")
@Getter
@Setter
public class UniversityLayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String universityCode;

    private int subjectMinX;
    private int subjectMaxX;

    private int titleMinX;
    private int titleMaxX;

    private int gradeMinX;
    private int gradeMaxX;

    private int creditMinX;
    private int creditMaxX;
}