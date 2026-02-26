package com.cta.creditrack.dtos;

import java.time.LocalDateTime;

public record FileUploadDTO2(
       Long id,
    String torFilename,
    String torFileType,
    Long torFileSize,
    byte[] torFileData,
    String cdFilename,
    String cdFileType,
    Long cdFileSize,
    byte[] cdFileData,
    LocalDateTime uploadDate,
    Long studentId
) {}
