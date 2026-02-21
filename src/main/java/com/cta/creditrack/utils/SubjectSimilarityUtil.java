package com.cta.creditrack.utils;

import org.apache.commons.text.similarity.CosineSimilarity;
import org.apache.commons.text.similarity.JaroWinklerSimilarity;

import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@Slf4j
public class SubjectSimilarityUtil {

    private static final JaroWinklerSimilarity jaro = new JaroWinklerSimilarity();
    private static final CosineSimilarity cosine = new CosineSimilarity();

    public static double computeScore(
            String transcriptName,
            String curriculumName,
            int transcriptCredits,
            int curriculumCredits) {

                log.info("Computing similarity for: " + transcriptName + " vs " + curriculumName);

        double jaroScore = jaroSimilarity(transcriptName, curriculumName);
        double cosineScore = cosineSimilarity(transcriptName, curriculumName);
        double creditScore = creditMatch(transcriptCredits, curriculumCredits);

        return (jaroScore * 0.4) +
               (cosineScore * 0.4) +
               (creditScore * 0.2);
    }

    private static double jaroSimilarity(String a, String b) {
        Double score = jaro.apply(a.toLowerCase(), b.toLowerCase());
        return score * 100;
    }

    private static double cosineSimilarity(String a, String b) {
        Map<CharSequence, Integer> leftVector = buildVector(a);
        Map<CharSequence, Integer> rightVector = buildVector(b);

        Double score = cosine.cosineSimilarity(leftVector, rightVector);
        return score == null ? 0 : score * 100;
    }

    private static Map<CharSequence, Integer> buildVector(String text) {
        Map<CharSequence, Integer> vector = new HashMap<>();
        for (String word : text.toLowerCase().split("\\s+")) {
            vector.put(word, vector.getOrDefault(word, 0) + 1);
        }
        return vector;
    }

    private static double creditMatch(int tCredits, int cCredits) {
        if (tCredits == cCredits) return 100;
        if (Math.abs(tCredits - cCredits) == 1) return 80;
        return 50;
    }
}

