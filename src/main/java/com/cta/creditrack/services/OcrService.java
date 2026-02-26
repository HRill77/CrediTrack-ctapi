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

    @Value("${google.vision.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public List<VisionWordDto> extractWords(File file) throws Exception {

        byte[] bytes = Files.readAllBytes(file.toPath());
        String base64 = Base64.getEncoder().encodeToString(bytes);

        String url =
                "https://vision.googleapis.com/v1/images:annotate?key=" + apiKey;

        String requestJson = """
        {
          "requests": [
            {
              "image": { "content": "%s" },
              "features": [
                { "type": "DOCUMENT_TEXT_DETECTION" }
              ]
            }
          ]
        }
        """.formatted(base64);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(requestJson, headers);

        String response =
                restTemplate.postForObject(url, entity, String.class);

        return parseVisionResponse(response);
    }

    private List<VisionWordDto> parseVisionResponse(String json) {

        List<VisionWordDto> words = new ArrayList<>();

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);

            JsonNode pages = root
                    .path("responses")
                    .get(0)
                    .path("fullTextAnnotation")
                    .path("pages");

            for (JsonNode page : pages) {
                for (JsonNode block : page.path("blocks")) {
                    for (JsonNode para : block.path("paragraphs")) {
                        for (JsonNode word : para.path("words")) {

                            StringBuilder text = new StringBuilder();

                            for (JsonNode symbol : word.path("symbols")) {
                                text.append(symbol.path("text").asText());
                            }

                            int x = word.path("boundingBox")
                                    .path("vertices")
                                    .get(0)
                                    .path("x")
                                    .asInt();

                            int y = word.path("boundingBox")
                                    .path("vertices")
                                    .get(0)
                                    .path("y")
                                    .asInt();

                            words.add(new VisionWordDto(text.toString(), x, y));
                        }
                    }
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return words;
    }
}
