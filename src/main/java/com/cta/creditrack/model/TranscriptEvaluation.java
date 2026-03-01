package com.cta.creditrack.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.cta.creditrack.enums.DecisionType;
import com.cta.creditrack.enums.EvaluationStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "cta_transcript_evaluation")
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TranscriptEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transcript_id", nullable = false)
    private Transcript transcript;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_subject_id")
    private Curricula curricula;

    private Double confidenceScore; // 0-100

    @Enumerated(EnumType.STRING)
    private EvaluationStatus evaluationStatus;

    @Enumerated(EnumType.STRING)
    private DecisionType decisionType; // AUTO or MANUAL

    private Boolean finalApproved;

    private String remarks;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
