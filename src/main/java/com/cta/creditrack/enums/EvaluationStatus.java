package com.cta.creditrack.enums;

public enum EvaluationStatus {

    HIGH_CONFIDENCE_MATCH,   // >= 85%
    MEDIUM_CONFIDENCE_MATCH, // 75–84%
    LOW_CONFIDENCE_MATCH,    // 60–74%
    NO_MATCH                 // < 60%
}

