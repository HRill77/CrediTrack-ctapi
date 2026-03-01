package com.cta.creditrack.dtos;

import com.cta.creditrack.enums.DecisionType;
import com.cta.creditrack.enums.EvaluationStatus;
import java.time.LocalDateTime;

public class TranscriptEvaluationResponse {
    
    private Long id;
    private TranscriptResponse transcript;
    private CurriculaResponse curricula;
    private Double confidenceScore;
    private EvaluationStatus evaluationStatus;
    private DecisionType decisionType;
    private Boolean finalApproved;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructor
    public TranscriptEvaluationResponse(
            Long id,
            TranscriptResponse transcript,
            CurriculaResponse curricula,
            Double confidenceScore,
            EvaluationStatus evaluationStatus,
            DecisionType decisionType,
            Boolean finalApproved,
            String remarks,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.transcript = transcript;
        this.curricula = curricula;
        this.confidenceScore = confidenceScore;
        this.evaluationStatus = evaluationStatus;
        this.decisionType = decisionType;
        this.finalApproved = finalApproved;
        this.remarks = remarks;
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

    public TranscriptResponse getTranscript() {
        return transcript;
    }

    public void setTranscript(TranscriptResponse transcript) {
        this.transcript = transcript;
    }

    public CurriculaResponse getCurricula() {
        return curricula;
    }

    public void setCurricula(CurriculaResponse curricula) {
        this.curricula = curricula;
    }

    public Double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public EvaluationStatus getEvaluationStatus() {
        return evaluationStatus;
    }

    public void setEvaluationStatus(EvaluationStatus evaluationStatus) {
        this.evaluationStatus = evaluationStatus;
    }

    public DecisionType getDecisionType() {
        return decisionType;
    }

    public void setDecisionType(DecisionType decisionType) {
        this.decisionType = decisionType;
    }

    public Boolean getFinalApproved() {
        return finalApproved;
    }

    public void setFinalApproved(Boolean finalApproved) {
        this.finalApproved = finalApproved;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
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
