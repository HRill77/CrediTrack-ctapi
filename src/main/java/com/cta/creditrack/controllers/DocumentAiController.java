package com.cta.creditrack.controllers;

import com.cta.creditrack.model.TranscriptSubject;
import com.cta.creditrack.services.DocumentAiService;
import com.cta.creditrack.utils.TableExtractor;
import com.cta.creditrack.utils.TranscriptParser;
import com.google.cloud.documentai.v1.Document;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/document-ai")
@RequiredArgsConstructor
public class DocumentAiController {

    private final DocumentAiService documentAiService;

    @PostMapping(value = "/process", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<TranscriptSubject> process(@RequestParam("file") MultipartFile file) throws Exception {

        Document document = documentAiService.process(
                file.getBytes(),
                file.getContentType());

        List<List<String>> raw = TableExtractor.extractTables(document);
        return TranscriptParser.parse(raw);
    }
}
