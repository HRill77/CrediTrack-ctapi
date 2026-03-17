package com.cta.creditrack.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cta.creditrack.dtos.BulkTranscriptRequest;
import com.cta.creditrack.dtos.TranscriptDto;
import com.cta.creditrack.dtos.TranscriptEvaluationResponse;
import com.cta.creditrack.services.TranscriptProcessingService;
import com.cta.creditrack.services.TranscriptService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/transcripts")
@RequiredArgsConstructor
public class TranscriptController {

    private final TranscriptService transcriptService;
    private final TranscriptProcessingService transcriptProcessingService;

    @PostMapping("/upload")
    public ResponseEntity<List<TranscriptDto>> uploadTranscript(
            @RequestParam("file") List<MultipartFile> files
    ) throws Exception {

        List<TranscriptDto> rows =
                transcriptService.processTranscript(files);

        return ResponseEntity.ok(rows);
    }

    @PostMapping("/evaluate")
    public ResponseEntity<List<TranscriptEvaluationResponse>> evaluateTranscript(
            @RequestBody BulkTranscriptRequest request,
            @RequestParam("program") String program
    ) {
        try {
            System.out.println("Received evaluation request year: " + request.transcripts().get(0).year());
            var result = transcriptProcessingService.processTranscriptEvaluation(request, program);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }
}
