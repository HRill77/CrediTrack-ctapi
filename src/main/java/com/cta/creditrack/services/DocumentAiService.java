package com.cta.creditrack.services;



import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.documentai.v1.*;
import com.google.protobuf.ByteString;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
public class DocumentAiService {

    private final String projectId = "project-4890b749-a445-45ca-8b3";
    private final String location = "asia-southeast1";
    private final String processorId = "83b2206748cc3b55";

    public Document process(byte[] fileBytes, String mimeType) throws Exception {

        String endpoint = String.format("%s-documentai.googleapis.com:443", location);

        InputStream credentialsStream =
                new ClassPathResource("google/service-account.json").getInputStream();

        GoogleCredentials credentials =
                GoogleCredentials.fromStream(credentialsStream)
                        .createScoped("https://www.googleapis.com/auth/cloud-platform");

        DocumentProcessorServiceSettings settings =
                DocumentProcessorServiceSettings.newBuilder()
                        .setEndpoint(endpoint)
                        .setCredentialsProvider(() -> credentials)
                        .build();

        try (DocumentProcessorServiceClient client =
                     DocumentProcessorServiceClient.create(settings)) {

            String name = String.format(
                    "projects/%s/locations/%s/processors/%s",
                    projectId, location, processorId);

            ProcessRequest request =
                    ProcessRequest.newBuilder()
                            .setName(name)
                            .setRawDocument(
                                    RawDocument.newBuilder()
                                            .setContent(ByteString.copyFrom(fileBytes))
                                            .setMimeType(mimeType)
                                            .build())
                            .build();

            ProcessResponse result = client.processDocument(request);

            return result.getDocument();
        }
    }
}
