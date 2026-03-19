package com.cta.creditrack.services;

import com.cta.creditrack.dtos.VisionWordDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

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