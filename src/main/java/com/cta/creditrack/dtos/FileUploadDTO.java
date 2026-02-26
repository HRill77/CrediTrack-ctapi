package com.cta.creditrack.dtos;

import java.time.LocalDateTime;

public record FileUploadDTO(
        Long id,
        String torFilename,
        String torFileType,
        Long torFileSize,
        String cdFilename,
        String cdFileType,
        Long cdFileSize,
        LocalDateTime uploadDate
) {}
