package com.cta.creditrack.services;

import com.cta.creditrack.dtos.TranscriptRowDto;
import com.cta.creditrack.dtos.VisionWordDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OcrService {

    @Value("${google.gemini.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public List<VisionWordDto> extractWords(File file) throws Exception {

        byte[] bytes = Files.readAllBytes(file.toPath());
        String base64 = Base64.getEncoder().encodeToString(bytes);

        String mimeType = detectMimeType(file.getName());

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
                + apiKey;

        String requestJson = """
                {
                  "contents": [
                    {
                      "parts": [
                        {
                          "inline_data": {
                            "mime_type": "%s",
                            "data": "%s"
                          }
                        },
                        {
                          "text": "Extract every word from this document image exactly as it appears. Return ONLY a valid JSON array, no explanation, no markdown. Each object must have: \\"text\\" (the word), \\"x\\" (top-left x coordinate in pixels), \\"y\\" (top-left y coordinate in pixels). If coordinates are not determinable, use 0. Example: [{\\"text\\": \\"John\\", \\"x\\": 120, \\"y\\": 45}]"
                        }
                      ]
                    }
                  ],
                  "generationConfig": {
                    "temperature": 0,
                    "responseMimeType": "application/json"
                  }
                }
                """
                .formatted(mimeType, base64);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(requestJson, headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        System.out.println("RAW RESPONSE: " + response.getBody());

        return parseGeminiResponse(response.getBody());
    }

    public List<TranscriptRowDto> extractTranscript(List<MultipartFile> files) throws Exception {

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
                + apiKey;

        // ==============================
        // STEP 1: VALIDATE IMAGE FIRST
        // ==============================
        validateImages(files, url);

        List<Object> parts = new ArrayList<>();

        for (MultipartFile file : files) {
            byte[] bytes = file.getBytes();
            String base64 = Base64.getEncoder().encodeToString(bytes);
            String mimeType = detectMimeType(file.getOriginalFilename());

            parts.add(Map.of(
                    "inline_data", Map.of(
                            "mime_type", mimeType,
                            "data", base64)));
        }

        parts.add(Map.of(
                "text", """
                        These images are parts of a single or multiple Transcript of Records (TOR).

                        Combine all pages and extract ALL subject rows.

                        For each row return:
                        - year (e.g., "2021-2022")
                        - subjectCode
                        - courseName
                        - grade
                        - units

                        Output requirements:
                        - Return ONLY a valid JSON array
                        - Each item must follow this structure:
                        {"year": "",
                        "subjectCode": "",
                        "courseName": "",
                        "grade": "",
                        "units": ""
                        }

                        Data rules:
                        - Preserve exact text as shown in the document.
                        - Units: remove any parentheses and return only the numeric value (e.g., "(3)" → "3")
                        - Grade: if empty or missing, return ""
                        - Units: if empty or missing, return ""
                        - Never return null values
                        - Ensure all values are strings

                        Strict constraints:
                        - Do NOT split results per image
                        - Do NOT wrap the JSON in a string
                        - Do NOT include explanations, comments, or markdown
                        - Output must be directly parseable JSON
                        """));

        Map<String, Object> request = Map.of(
                "contents", List.of(
                        Map.of("parts", parts)),
                "generationConfig", Map.of(
                        "temperature", 0,
                        "responseMimeType", "application/json",
                        "responseSchema", Map.of(
                                "type", "ARRAY",
                                "items", Map.of(
                                        "type", "OBJECT",
                                        "properties", Map.of(
                                                "year", Map.of("type", "STRING"),
                                                "subjectCode", Map.of("type", "STRING"),
                                                "courseName", Map.of("type", "STRING"),
                                                "grade", Map.of("type", "STRING"),
                                                "units", Map.of("type", "STRING"))))));

        String requestJson = mapper.writeValueAsString(request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(requestJson, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class);

        String body = response.getBody();
        System.out.println("RAW RESPONSE: " + body);

        return parseGeminiResponse2(body);
    }

    // ==============================
    // NEW: IMAGE VALIDATION
    // ==============================
    private void validateImages(List<MultipartFile> files, String url) throws Exception {

        List<Object> parts = new ArrayList<>();

        for (MultipartFile file : files) {
            byte[] bytes = file.getBytes();
            String base64 = Base64.getEncoder().encodeToString(bytes);
            String mimeType = detectMimeType(file.getOriginalFilename());

            parts.add(Map.of(
                    "inline_data", Map.of(
                            "mime_type", mimeType,
                            "data", base64)));
        }

        parts.add(Map.of("text",
                """
                        Look at the image(s) provided and answer with ONLY one of these exact responses:
                        - "NO_TEXT" if the image contains no readable text at all (e.g., blank, photo, drawing)
                        - "NOT_TRANSCRIPT" if the image contains text but is clearly NOT a Transcript of Records (e.g., random document, receipt, letter, ID, certificate, etc.)
                        - "VALID" if the image appears to be a Transcript of Records (contains subject codes, grades, course names, academic years, student info)

                        Reply with ONLY one word: NO_TEXT, NOT_TRANSCRIPT, or VALID
                        """));

        Map<String, Object> request = Map.of(
                "contents", List.of(Map.of("parts", parts)),
                "generationConfig", Map.of("temperature", 0));

        String requestJson = mapper.writeValueAsString(request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(requestJson, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, String.class);

        JsonNode root = mapper.readTree(response.getBody());
        String result = root
                .path("candidates")
                .get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText()
                .trim()
                .toUpperCase()
                .replaceAll("[^A-Z_]", "");

        System.out.println("IMAGE VALIDATION RESULT: " + result);

        if (result.contains("NO_TEXT")) {
            throw new IllegalArgumentException(
                    " The uploaded image does not contain any readable text. Please upload a clear photo or scan of your Transcript of Records.");
        }

        if (result.contains("NOT_TRANSCRIPT")) {
            throw new IllegalArgumentException(
                    " The uploaded image does not appear to be a Transcript of Records. Please make sure you are uploading the correct document.");
        }
    }

    private List<TranscriptRowDto> parseGeminiResponse2(String body) throws Exception {

        JsonNode root = mapper.readTree(body);

        // Gemini standard path
        JsonNode textNode = root
                .path("candidates")
                .get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text");

        if (textNode.isMissingNode()) {
            throw new RuntimeException("Invalid Gemini response format");
        }

        String text = textNode.asText().trim();

        try {

            TranscriptRowDto[] arr = mapper.readValue(text, TranscriptRowDto[].class);
            return Arrays.asList(arr);
        } catch (Exception e) {

            String cleaned = text.replace("\\\"", "\"");
            TranscriptRowDto[] arr = mapper.readValue(text, TranscriptRowDto[].class);
            return Arrays.asList(arr);
        }
    }

    private String detectMimeType2(String fileName) {
        if (fileName.endsWith(".png"))
            return "image/png";
        if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg"))
            return "image/jpeg";
        return "application/octet-stream";
    }

    private List<VisionWordDto> parseGeminiResponse(String json) {

        List<VisionWordDto> words = new ArrayList<>();

        try {
            JsonNode root = mapper.readTree(json);

            String content = root
                    .path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

            System.out.println("EXTRACTED CONTENT: " + content);

            // Strip markdown fences just in case
            String clean = content
                    .replaceAll("(?s)```json", "")
                    .replaceAll("```", "")
                    .trim();

            JsonNode wordArray = mapper.readTree(clean);

            for (JsonNode wordNode : wordArray) {
                String text = wordNode.path("text").asText();
                int x = wordNode.path("x").asInt(0);
                int y = wordNode.path("y").asInt(0);

                if (!text.isBlank()) {
                    words.add(new VisionWordDto(text, x, y));
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return words;
    }

    private String detectMimeType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".pdf"))
            return "application/pdf";
        if (lower.endsWith(".png"))
            return "image/png";
        if (lower.endsWith(".webp"))
            return "image/webp";
        if (lower.endsWith(".heic"))
            return "image/heic";
        if (lower.endsWith(".heif"))
            return "image/heif";
        return "image/jpeg";
    }
}