package com.cta.creditrack.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cta_manual_credit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ManualCredit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String transcriptSubjectCode;
    private String transcriptCourseName;
    private Integer transcriptUnits;

    private String curriculumSubjectCode;
    private String curriculumCourseName;
    private Integer curriculumUnits;

    private String program;

    @ManyToOne
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    private LocalDateTime approvedAt;

    private Integer matchCount = 1;
}