package com.cta.creditrack.services;

import com.cta.creditrack.dtos.TranscriptDto;
import com.cta.creditrack.dtos.VisionWordDto;
import com.cta.creditrack.layouts.UniversityLayout;
import com.cta.creditrack.layouts.UniversityLayoutRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TranscriptService {

    private final OcrService ocrService;
    private final OcrCorrectionService correctionService;
    private final UniversityLayoutRepository layoutRepository;

    public List<TranscriptDto> processTranscript(List<MultipartFile> files) throws Exception {

        List<TranscriptDto> allResults = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty())
                continue;

            File temp = File.createTempFile("transcript", ".jpg");
            file.transferTo(temp);

            try {
                List<VisionWordDto> words = ocrService.extractWords(temp);

                System.out.println("========== OCR WORDS START ==========");
                for (VisionWordDto w : words) {
                    System.out.println("Text: " + w.getText() + " | X: " + w.getX() + " | Y: " + w.getY());
                }
                System.out.println("========== OCR WORDS END ==========");

                List<TranscriptDto> results = parse(words);
                allResults.addAll(results);
            } finally {
                temp.delete();
            }
        }

        return allResults;
    }

    /*
     * ==============================
     * MAIN PARSER ENTRY
     * ==============================
     */

    private List<TranscriptDto> parse(List<VisionWordDto> words) {

        words = words.stream()
                .map(this::normalize)
                .sorted(Comparator
                        .comparingInt(VisionWordDto::getY)
                        .thenComparingInt(VisionWordDto::getX))
                .collect(Collectors.toList());

        String university = detectUniversity(words);
        System.out.println("Detected university: " + university);

        Optional<UniversityLayout> templateOpt = layoutRepository.findByUniversityCode(university);

        List<List<VisionWordDto>> rows = groupRows(words);

        if (templateOpt.isPresent()) {
            UniversityLayout layout = templateOpt.get();
            System.out.println("Using template for: " + university);
            System.out.println("Layout: subjectX=" + layout.getSubjectMinX() + "-" + layout.getSubjectMaxX()
                    + " titleX=" + layout.getTitleMinX() + "-" + layout.getTitleMaxX()
                    + " gradeX=" + layout.getGradeMinX() + "-" + layout.getGradeMaxX()
                    + " creditX=" + layout.getCreditMinX() + "-" + layout.getCreditMaxX());
            return parseUsingTemplate(rows, layout);
        }

        System.out.println("No template found, using AI layout detection.");
        LayoutModel aiLayout = detectLayout(words);
        System.out.println("AI Layout: subjectX=" + aiLayout.subjectX
                + " gradeX=" + aiLayout.gradeX
                + " creditX=" + aiLayout.creditX);

        if (!university.equals("UNKNOWN")) {
            autoTrainLayout(university, aiLayout);
        }

        return parseRows(rows, aiLayout);
    }

    /*
     * ==============================
     * TEMPLATE-BASED PARSER
     * ==============================
     */

    private List<TranscriptDto> parseUsingTemplate(
            List<List<VisionWordDto>> rows,
            UniversityLayout layout) {

        List<TranscriptDto> results = new ArrayList<>();
        String currentYear = "";

        for (List<VisionWordDto> row : rows) {

            row.sort(Comparator.comparingInt(VisionWordDto::getX));
            String line = join(row).toUpperCase();

            if (isGarbage(line))
                continue;

            String year = extractYear(line);
            if (year != null) {
                currentYear = year;
                continue;
            }

            String subject = null;
            StringBuilder title = new StringBuilder();
            String grade = null;
            Integer credits = 0;

            for (int i = 0; i < row.size(); i++) {

                VisionWordDto w = row.get(i);
                String text = w.getText();
                int x = w.getX();

                // SUBJECT - build multi-word subject code (e.g. "PROF ED 11", "SEE 13", "GEN ED
                // 3")
                if (subject == null &&
                        x >= layout.getSubjectMinX() &&
                        x <= layout.getSubjectMaxX()) {

                    StringBuilder subjectBuilder = new StringBuilder(text);
                    int j = i + 1;

                    while (j < row.size()) {
                        VisionWordDto next = row.get(j);
                        String nextText = next.getText();
                        int nextX = next.getX();

                        // Stop if we've gone past the subject zone
                        if (nextX > layout.getSubjectMaxX() + 50)
                            break;

                        // Stop if we've reached the title zone
                        if (nextX >= layout.getTitleMinX())
                            break;

                        subjectBuilder.append(" ").append(nextText);
                        j++;

                        // Stop after appending a number suffix (e.g. "11", "3")
                        if (nextText.matches("\\d{1,4}"))
                            break;
                    }

                    String candidate = subjectBuilder.toString().trim();

                    // Valid subject: starts with letters, ends with a number
                    if (candidate.matches("[A-Z].*\\d+")) {
                        subject = candidate;
                        i = j - 1;
                    }
                    continue;
                }

                // TITLE - words in the middle columns
                if (subject != null && grade == null &&
                        x >= layout.getTitleMinX() &&
                        x <= layout.getTitleMaxX()) {
                    title.append(text).append(" ");
                }

                // GRADE
                if (x >= layout.getGradeMinX() &&
                        x <= layout.getGradeMaxX() &&
                        text.matches("\\d+(\\.\\d+)?")) {
                    grade = text;
                }

                // CREDITS
                if (x >= layout.getCreditMinX() &&
                        x <= layout.getCreditMaxX() &&
                        text.matches("\\(?(\\d{1,2})\\)?")) {
                    String digits = text.replaceAll("[^0-9]", "");
                    try {
                        int val = Integer.parseInt(digits);
                        if (val < 12)
                            credits = val;
                    } catch (NumberFormatException e) {
                        /* skip */ }
                }
            }

            if (subject != null && grade != null) {
                double confidence = calculateConfidence(subject, title.toString().trim(), grade, credits);
                if (confidence >= 0.6) {
                    results.add(new TranscriptDto(
                            currentYear,
                            subject,
                            title.toString().trim(),
                            formatGrade(grade),
                            credits,
                            confidence));
                }
            }
        }

        return removeDuplicates(results);
    }

    /*
     * ==============================
     * AI LAYOUT DETECTION
     * ==============================
     */

    private LayoutModel detectLayout(List<VisionWordDto> words) {

        List<Integer> subjectXs = new ArrayList<>();
        List<Integer> gradeXs = new ArrayList<>();
        List<Integer> creditXs = new ArrayList<>();

        for (VisionWordDto w : words) {
            String text = w.getText();

            if (text.matches("[A-Z][A-Z0-9\\-]{1,9}") && text.length() >= 2)
                subjectXs.add(w.getX());

            if (text.matches("\\d+\\.\\d{2}") || text.matches("\\d{2}"))
                gradeXs.add(w.getX());

            if (text.matches("\\d{1,2}") || text.matches("\\(?\\d{1,2}\\)?"))
                creditXs.add(w.getX());
        }

        int subjectX = subjectXs.isEmpty() ? 100 : percentile(subjectXs, 30);
        int gradeX = gradeXs.isEmpty() ? 1900 : percentile(gradeXs, 80);
        int creditX = creditXs.isEmpty() ? 2600 : percentile(creditXs, 90);

        return new LayoutModel(subjectX, gradeX, creditX);
    }

    private int percentile(List<Integer> list, int percent) {
        if (list.isEmpty())
            return 0;
        Collections.sort(list);
        return list.get(list.size() * percent / 100);
    }

    /*
     * ==============================
     * ROW GROUPING
     * ==============================
     */

    private List<List<VisionWordDto>> groupRows(List<VisionWordDto> words) {

        List<List<VisionWordDto>> rows = new ArrayList<>();
        int tolerance = calculateTolerance(words);

        for (VisionWordDto word : words) {
            boolean added = false;
            for (List<VisionWordDto> row : rows) {
                if (Math.abs(row.get(0).getY() - word.getY()) < tolerance) {
                    row.add(word);
                    added = true;
                    break;
                }
            }
            if (!added) {
                List<VisionWordDto> newRow = new ArrayList<>();
                newRow.add(word);
                rows.add(newRow);
            }
        }

        return rows;
    }

    private int calculateTolerance(List<VisionWordDto> words) {

        List<Integer> diffs = new ArrayList<>();
        for (int i = 1; i < words.size(); i++) {
            int diff = Math.abs(words.get(i).getY() - words.get(i - 1).getY());
            if (diff > 0 && diff < 100)
                diffs.add(diff);
        }

        if (diffs.isEmpty())
            return 15;
        Collections.sort(diffs);
        return Math.max(15, diffs.get(diffs.size() / 2));
    }

    /*
     * ==============================
     * AI FALLBACK ROW PARSER
     * ==============================
     */

    private List<TranscriptDto> parseRows(
            List<List<VisionWordDto>> rows,
            LayoutModel layout) {

        List<TranscriptDto> results = new ArrayList<>();
        String currentYear = "";

        for (List<VisionWordDto> row : rows) {

            row.sort(Comparator.comparingInt(VisionWordDto::getX));
            String line = join(row).toUpperCase();

            if (isGarbage(line))
                continue;

            String year = extractYear(line);
            if (year != null) {
                currentYear = year;
                continue;
            }

            String subject = null;
            StringBuilder title = new StringBuilder();
            String grade = null;
            Integer credits = 0;

            // First pass: find grade and credits
            for (VisionWordDto w : row) {
                String text = w.getText();
                int x = w.getX();

                if (grade == null &&
                        Math.abs(x - layout.gradeX) < 150 &&
                        (text.matches("\\d+\\.\\d{2}") ||
                                text.matches("\\d{2}(?!\\d{2})") ||
                                text.equals("PASSED"))) {
                    grade = text;
                }

                if (Math.abs(x - layout.creditX) < 180 &&
                        text.matches("\\d{1,2}") &&
                        !text.equals("00")) {
                    try {
                        int creditVal = Integer.parseInt(text);
                        if (creditVal < 12)
                            credits = creditVal;
                    } catch (NumberFormatException e) {
                        /* skip */ }
                }
            }

            // Second pass: find subject and title (only if grade found)
            if (grade != null) {
                boolean foundSubject = false;

                for (int i = 0; i < row.size(); i++) {
                    VisionWordDto w = row.get(i);
                    String text = w.getText();
                    int x = w.getX();

                    if (!foundSubject &&
                            x < layout.gradeX - 100 &&
                            text.length() >= 2 && text.length() <= 10 &&
                            text.matches("[A-Z][A-Z0-9\\-]*") &&
                            !isCommonWord(text)) {

                        // Build multi-word subject code
                        StringBuilder subjectBuilder = new StringBuilder(text);
                        int j = i + 1;

                        while (j < row.size()) {
                            VisionWordDto next = row.get(j);
                            String nextText = next.getText();
                            int nextX = next.getX();

                            if (nextX >= layout.gradeX - 100)
                                break;

                            subjectBuilder.append(" ").append(nextText);
                            j++;

                            if (nextText.matches("\\d{1,4}"))
                                break;
                        }

                        String candidate = subjectBuilder.toString().trim();
                        if (candidate.matches("[A-Z].*\\d+")) {
                            subject = candidate;
                            i = j - 1;
                            foundSubject = true;
                        }

                    } else if (foundSubject &&
                            x > layout.subjectX + 50 &&
                            x < layout.gradeX - 70 &&
                            !isCommonWord(text)) {
                        title.append(text).append(" ");
                    }
                }
            }

            if (subject != null && grade != null) {
                double confidence = calculateConfidence(subject, title.toString().trim(), grade, credits);
                if (confidence >= 0.5) {
                    results.add(new TranscriptDto(
                            currentYear,
                            subject,
                            title.toString().trim(),
                            formatGrade(grade),
                            credits,
                            confidence));
                }
            }
        }

        return removeDuplicates(results);
    }

    /*
     * ==============================
     * UTILITIES
     * ==============================
     */

    private VisionWordDto normalize(VisionWordDto w) {
        w.setText(correctionService.cleanToken(w.getText()));
        return w;
    }

    private boolean isGarbage(String line) {
        return line.contains("GRADING")
                || line.contains("OFFICIAL")
                || line.contains("REGISTRAR")
                || line.contains("CERTIFIED")
                || line.contains("SEAL")
                || line.contains("FAILED")
                || line.contains("BELOW 75")
                || line.contains("PAGE")
                || line.contains("REMARKS");
    }

    private String extractYear(String line) {

        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("(20\\d{2})[\\s\\-](20\\d{2})")
                .matcher(line);

        if (m.find())
            return m.group(1) + "-" + m.group(2);

        m = java.util.regex.Pattern.compile("(20\\d{2})").matcher(line);
        if (m.find())
            return m.group(1);

        return null;
    }

    private String formatGrade(String grade) {
        if (!grade.matches("\\d+(\\.\\d+)?"))
            return grade;
        return String.format("%.2f", Double.parseDouble(grade));
    }

    private String join(List<VisionWordDto> row) {
        return row.stream().map(VisionWordDto::getText).collect(Collectors.joining(" "));
    }

    private boolean isCommonWord(String text) {
        Set<String> commonWords = new HashSet<>(Arrays.asList(
                "COURSE", "CODE", "DESCRIPTION", "TITLE", "SUBJECT",
                "FINAL", "GRADE", "CREDITS", "RE", "EXAM", "UNITS",
                "TERM", "SEM", "SEMESTER", "FOR", "OF", "AND", "THE",
                "IN", "WITH", "ON", "AT", "TO", "OR", "BY", "A", "AS"));
        return commonWords.contains(text);
    }

    private List<TranscriptDto> removeDuplicates(List<TranscriptDto> list) {
        return list.stream()
                .collect(Collectors.collectingAndThen(
                        Collectors.toMap(
                                r -> r.getSubjectCode() + "_" + r.getYear(),
                                r -> r,
                                (r1, r2) -> r1),
                        m -> new ArrayList<>(m.values())));
    }

    private double calculateConfidence(String subject, String title, String grade, Integer credits) {
        double score = 0;
        if (subject != null && subject.matches("[A-Z][A-Z0-9\\-]{1,9}"))
            score += 0.3;
        if (title != null && !title.isEmpty())
            score += 0.25;
        if (grade != null && (grade.matches("\\d+\\.\\d{2}") || grade.matches("\\d{2}") || grade.equals("PASSED")))
            score += 0.35;
        if (credits != null && credits > 0)
            score += 0.1;
        return score;
    }

    /*
     * ==============================
     * UNIVERSITY DETECTION
     * ==============================
     */

    private String detectUniversity(List<VisionWordDto> words) {

        String text = words.stream()
                .map(VisionWordDto::getText)
                .collect(Collectors.joining(" "))
                .toUpperCase();

        if (text.contains("NUEVA ECIJA UNIVERSITY"))
            return "NEUST";
        if (text.contains("ARAULLO UNIVERSITY"))
            return "ARAULLO";
        if (text.contains("MIDWAY COLLEGES"))
            return "MIDWAY";
        if (text.contains("IMMACULATE CONCEPTION"))
            return "CIC";

        System.out.println("University detection failed. OCR Text: " + text);
        return "UNKNOWN";
    }

    private void autoTrainLayout(String universityCode, LayoutModel aiLayout) {

        if (layoutRepository.findByUniversityCode(universityCode).isPresent())
            return;

        UniversityLayout entity = new UniversityLayout();
        entity.setUniversityCode(universityCode);
        entity.setSubjectMinX(aiLayout.subjectX - 120);
        entity.setSubjectMaxX(aiLayout.subjectX + 120);
        entity.setTitleMinX(aiLayout.subjectX + 120);
        entity.setTitleMaxX(aiLayout.gradeX - 120);
        entity.setGradeMinX(aiLayout.gradeX - 120);
        entity.setGradeMaxX(aiLayout.gradeX + 120);
        entity.setCreditMinX(aiLayout.creditX - 120);
        entity.setCreditMaxX(aiLayout.creditX + 120);
        layoutRepository.save(entity);
    }

    /*
     * ==============================
     * INNER LAYOUT MODEL
     * ==============================
     */

    private static class LayoutModel {
        final int subjectX;
        final int gradeX;
        final int creditX;

        LayoutModel(int subjectX, int gradeX, int creditX) {
            this.subjectX = subjectX;
            this.gradeX = gradeX;
            this.creditX = creditX;
        }
    }
}