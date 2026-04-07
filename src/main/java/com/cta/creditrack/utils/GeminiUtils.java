package com.cta.creditrack.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Slf4j
@Component
public class GeminiUtils {

    @Value("${google.gemini.api-key}")
    private String apiKey;

    private static final String URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

    private final HttpClient client = HttpClient.newHttpClient();

    // ==========================
    // BATCH METHOD (MAIN)
    // ==========================
    public String getBatchMatch(String transcriptsJson, String program, String curriculumJson) {
        try {
            String prompt = buildBatchPrompt(transcriptsJson, program, curriculumJson);

            String requestBody = buildRequestBody(prompt);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(URL + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            log.info("Gemini BATCH response: {}", response.body());

            return response.body();

        } catch (Exception e) {
            log.error("Gemini batch error", e);
            return null;
        }
    }

    // ==========================
    //  OPTIONAL (OLD - SINGLE)
    // ==========================
    public String getBestMatch(String transcriptCourse, String program, String curriculumJson) {
        try {
            String prompt = buildSinglePrompt(transcriptCourse, program, curriculumJson);

            String requestBody = buildRequestBody(prompt);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(URL + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            return response.body();

        } catch (Exception e) {
            log.error("Gemini error", e);
            return null;
        }
    }

    // ==========================
    //  COMMON REQUEST BUILDER
    // ==========================
    private String buildRequestBody(String prompt) {
        return """
                {
                  "contents": [{
                    "parts": [{
                      "text": "%s"
                    }]
                  }]
                }
                """.formatted(prompt.replace("\"", "\\\""));
    }

    // ==========================
    //  BATCH PROMPT (IMPROVED)
    // ==========================
    private String buildBatchPrompt(String transcriptsJson, String program, String curriculumJson) {
        return """
                You are a university academic evaluator.

                Your task:
                Match EACH transcript course to the MOST equivalent curriculum course.

                =========================
                TRANSCRIPT LIST
                =========================
                %s

                Program:
                "%s"

                =========================
                CURRICULUM LIST
                =========================
                %s

                =========================
                STRICT RULES
                =========================
                1. Match based on MEANING, not exact words
                2. Consider:
                   - course topic
                   - academic level
                   - units similarity
                3. Accept synonyms:
                   - "Differential Calculus" = "Calculus I"
                4. Reject if:
                   - unrelated subject
                   - no clear overlap

                =========================
                OUTPUT FORMAT (STRICT JSON ARRAY ONLY)
                =========================
                [
                  {
                    "transcriptCourse": "...",
                    "matchedCourse": "... or NONE",
                    "confidence": 0-100
                  }
                ]

                IMPORTANT:
                - matchedCourse MUST EXACTLY MATCH one from curriculum list
                - If no match → "NONE"
                - NO explanations
                - NO extra text
                """.formatted(transcriptsJson, program, curriculumJson);
    }

    // ==========================
    // OPTIONAL SINGLE PROMPT
    // ==========================
    private String buildSinglePrompt(String course, String program, String curriculumJson) {
        return """
                Find best equivalent subject.

                Course: "%s"
                Program: "%s"
                Curriculum: %s

                STRICT RULES:
                - Return ONLY valid JSON
                - No explanation
                - No extra text

                OUTPUT:
                {
                  "courseTitle": "...",
                  "confidence": 0-100
                }
                """.formatted(course, program, curriculumJson);
    }
}