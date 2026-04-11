package com.cta.creditrack.utils;

import org.apache.commons.text.similarity.CosineSimilarity;
import org.apache.commons.text.similarity.JaroWinklerSimilarity;

import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
public class SubjectSimilarityUtil {

    private static final JaroWinklerSimilarity jaro = new JaroWinklerSimilarity();
    private static final CosineSimilarity cosine = new CosineSimilarity();

   
    private static final Set<String> STOPWORDS = Set.of(
            "and", "of", "the", "in", "on", "for", "to"
    );

    public static double computeScore(
            String transcriptName,
            String curriculumName,
            int transcriptCredits,
            int curriculumCredits) {

        //  APPLY normalization here
        String normalizedA = normalizeAndSort(transcriptName);
        String normalizedB = normalizeAndSort(curriculumName);

        

        double jaroScore = jaroSimilarity(normalizedA, normalizedB);
        double cosineScore = cosineSimilarity(normalizedA, normalizedB);
        double creditScore = creditMatch(transcriptCredits, curriculumCredits);

        return (jaroScore * 0.4) +
                (cosineScore * 0.4) +
                (creditScore * 0.2);
    }

    // NORMALIZATION (dynamic)
    private static String normalizeAndSort(String text) {
        if (text == null)
            return "";

        return Arrays.stream(
                text.toLowerCase()
                        .replaceAll("[^a-z0-9\\s]", "") // remove punctuation
                        .replaceAll("\\b(\\w+)'s\\b", "$1") // remove possessive
                        .split("\\s+"))
                .map(SubjectSimilarityUtil::stemWord) // normalize plurals
                .filter(word -> !STOPWORDS.contains(word)) // remove stopwords
                .sorted() // ignore word order
                .collect(Collectors.joining(" "));
    }

    // SIMPLE STEMMER (generic)
    private static String stemWord(String word) {
        if (word.endsWith("s") && word.length() > 3) {
            return word.substring(0, word.length() - 1);
        }
        return word;
    }

    // NORMALIZATION (dynamic)
    private static String normalizeAndSort(String text) {
        if (text == null) return "";

        return Arrays.stream(
                text.toLowerCase()
                    .replaceAll("[^a-z0-9\\s]", "") // remove punctuation
                    .replaceAll("\\b(\\w+)'s\\b", "$1") // remove possessive
                    .split("\\s+")
            )
            .map(SubjectSimilarityUtil::stemWord) // normalize plurals
            .filter(word -> !STOPWORDS.contains(word)) // remove stopwords
            .sorted() // ignore word order
            .collect(Collectors.joining(" "));
    }

    //  SIMPLE STEMMER (generic)
    private static String stemWord(String word) {
        if (word.endsWith("s") && word.length() > 3) {
            return word.substring(0, word.length() - 1);
        }
        return word;
    }

    private static double jaroSimilarity(String a, String b) {
        Double score = jaro.apply(a, b);
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
        for (String word : text.split("\\s+")) {
            vector.put(word, vector.getOrDefault(word, 0) + 1);
        }
        return vector;
    }

    private static double creditMatch(int tCredits, int cCredits) {
        if (tCredits == cCredits)
            return 100;
        if (Math.abs(tCredits - cCredits) == 1)
            return 80;
        return 50;
    }
}