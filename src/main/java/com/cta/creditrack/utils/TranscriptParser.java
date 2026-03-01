package com.cta.creditrack.utils;

import com.cta.creditrack.model.TranscriptSubject;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TranscriptParser {

    public static List<TranscriptSubject> parse(List<List<String>> rawRows) {

        List<TranscriptSubject> subjects = new ArrayList<>();
        String currentYear = null;

        for (List<String> row : rawRows) {

            if (row.isEmpty()) continue;

            String left = row.get(0).trim();

            // 1️⃣ Detect year from semester line
            Matcher yearMatcher = Pattern.compile("(20\\d{2})").matcher(left);
            if (yearMatcher.find()) {
                currentYear = yearMatcher.group(1);
            }

            // Skip obvious non-subject rows
            if (left.contains("GRADING SYSTEM") ||
                left.contains("Degree:") ||
                left.contains("Address:") ||
                left.contains("NOTE:") ||
                left.contains("VALID")) {
                continue;
            }

            // 2️⃣ Extract subject code
            String subjectCode = extractSubjectCode(left);
            if (subjectCode == null) continue;

            // 3️⃣ Extract course name
            String courseName = left.replace(subjectCode, "").trim();

            // 4️⃣ Extract grade and credits
            String grade = null;
            int credits = 0;

            if (row.size() > 1) {
                String right = row.get(1);

                Matcher gradeMatcher = Pattern
                        .compile("\\b([1-5]\\.?\\d{0,2})\\b")
                        .matcher(right);

                if (gradeMatcher.find()) {
                    grade = gradeMatcher.group(1);
                }

                Matcher creditMatcher = Pattern
                        .compile("\\b([1-6])\\b")
                        .matcher(right);

                if (creditMatcher.find()) {
                    credits = Integer.parseInt(creditMatcher.group(1));
                }
            }

            if (grade != null) {
                subjects.add(new TranscriptSubject(
                        currentYear,
                        subjectCode,
                        courseName,
                        grade,
                        credits
                ));
            }
        }

        return subjects;
    }

    private static String extractSubjectCode(String text) {

        Matcher matcher = Pattern
                .compile("^([A-Z]{2,5}[- ]?\\d{1,3})")
                .matcher(text);

        if (matcher.find()) {
            return matcher.group(1);
        }

        return null;
    }
}
