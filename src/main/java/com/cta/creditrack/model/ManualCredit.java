    package com.cta.creditrack.model;
    import jakarta.persistence.*;
    import lombok.*;
    import java.time.LocalDateTime;

    import org.hibernate.annotations.CreationTimestamp;

    @Entity
    @Table(name = "cta_edited_credit")
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

        @CreationTimestamp
        @Column(name = "created_at")
        private LocalDateTime createdAt;
        
    }
