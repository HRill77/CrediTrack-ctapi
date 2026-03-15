package com.cta.creditrack.services;

import com.cta.creditrack.dtos.TranscriptDto;
import com.cta.creditrack.dtos.VisionWordDto;
import com.cta.creditrack.layouts.UniversityLayout;
import com.cta.creditrack.layouts.UniversityLayoutRegistry;
import com.cta.creditrack.layouts.UniversityLayoutRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.*;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TranscriptService {

    private final OcrService ocrService;
    private final OcrCorrectionService correctionService;
    // private final UniversityLayoutRegistry layoutRegistry;
    private final UniversityLayoutRepository layoutRepository;

    public List<TranscriptDto> processTranscript(
            List<MultipartFile> files,
            String studentEmail) throws Exception {

        List<TranscriptDto> allResults = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }

            String contentType = file.getContentType();
            if ("application/pdf".equals(contentType)) {
                throw new IllegalArgumentException("PDF files are not allowed. Please upload JPG or PNG images only.");
            }

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            File temp = File.createTempFile("transcript", extension);
            file.transferTo(temp);

            try {
                List<VisionWordDto> words = ocrService.extractWords(temp);
                // ===== PRINT OCR WORDS =====
                System.out.println("========== OCR WORDS START ==========");
                for (VisionWordDto w : words) {
                    System.out.println(
                            "Text: " + w.getText() +
                                    " | X: " + w.getX() +
                                    " | Y: " + w.getY());
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
     * MAIN AI PARSER ENTRY
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

        Optional<UniversityLayout> templateOpt = layoutRepository.findByUniversityCode(university);

        List<List<VisionWordDto>> rows = groupRows(words);

        if (templateOpt.isPresent()) {
            return parseUsingTemplate(rows, templateOpt.get());
        }

        // AI fallback
        LayoutModel aiLayout = detectLayout(words);

        if (!university.equals("UNKNOWN")) {
            autoTrainLayout(university, aiLayout);
        }

        return parseRows(rows, aiLayout);
    }

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

                if (x >= layout.getSubjectMinX() &&
                        x <= layout.getSubjectMaxX() &&
                        text.matches("[A-Z]{2,5}") &&
                        i + 1 < row.size() &&
                        row.get(i + 1).getText().matches("\\d{1,4}")) {

                    subject = text + " " + row.get(i + 1).getText();
                    i++;
                    continue;
                }

                if (x >= layout.getTitleMinX() &&
                        x <= layout.getTitleMaxX()) {

                    if (subject != null && grade == null)
                        title.append(text).append(" ");
                }

                if (x >= layout.getGradeMinX() &&
                        x <= layout.getGradeMaxX()) {

                    if (text.matches("\\d+(\\.\\d+)?"))
                        grade = text;
                }

                if (x >= layout.getCreditMinX() &&
                        x <= layout.getCreditMaxX()) {

                    if (text.matches("\\d{1,2}"))
                        credits = Integer.parseInt(text);
                }
            }

            if (subject != null && grade != null) {
                double confidence = calculateConfidence(
                        subject,
                        title.toString().trim(),
                        grade,
                        credits);
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

    private VisionWordDto normalize(VisionWordDto w) {
        w.setText(correctionService.cleanToken(w.getText()));
        return w;
    }

    /*
     * ==============================
     * AI COLUMN DETECTION
     * ==============================
     */

    private LayoutModel detectLayout(List<VisionWordDto> words) {

        List<Integer> subjectXs = new ArrayList<>();
        List<Integer> gradeXs = new ArrayList<>();
        List<Integer> creditXs = new ArrayList<>();

        for (VisionWordDto w : words) {

            String text = w.getText();

            // Match various subject code patterns (2-10 chars with letters, numbers,
            // hyphens)
            if (text.matches("[A-Z][A-Z0-9\\-]{1,9}") && text.length() >= 2)
                subjectXs.add(w.getX());

            // Match grades (1.00, 1.25, 2.00, etc. or just integers like 86, 90)
            if (text.matches("\\d+\\.\\d{2}") || text.matches("\\d{2}"))
                gradeXs.add(w.getX());

            // Match credits (integer 1-2 digits, sometimes in parentheses)
            if (text.matches("\\d{1,2}") || text.matches("\\(?\\d{1,2}\\)?"))
                creditXs.add(w.getX());
        }

        // Default fallback coordinates if patterns not found
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
     * SMART ROW GROUPING
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
     * ROW PARSING ENGINE
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

            // First pass: find grade and credits from right side of row
            for (VisionWordDto w : row) {
                String text = w.getText();
                int x = w.getX();

                // GRADE - Match decimal grades (1.00, 2.25) or whole grades (86, 90, PASSED)
                if (grade == null &&
                        Math.abs(x - layout.gradeX) < 150 &&
                        (text.matches("\\d+\\.\\d{2}") ||
                                text.matches("\\d{2}(?!\\d{2})") ||
                                text.equals("PASSED"))) {

                    grade = text;
                }

                // CREDITS - Match 1-2 digit numbers (but not year components)
                if (Math.abs(x - layout.creditX) < 180 &&
                        text.matches("\\d{1,2}") &&
                        !text.equals("00")) {

                    try {
                        int creditVal = Integer.parseInt(text);
                        if (creditVal < 12) { // reasonable credit range
                            credits = creditVal;
                        }
                    } catch (NumberFormatException e) {
                        // skip
                    }
                }
            }

            // Second pass: find subject code (leftmost) and title
            // Only process if we found a grade
            if (grade != null) {
                boolean foundSubject = false;

                for (VisionWordDto w : row) {
                    String text = w.getText();
                    int x = w.getX();

                    // SUBJECT - leftmost code that looks like a subject code
                    if (!foundSubject &&
                            x < layout.gradeX - 100 &&
                            text.length() >= 2 && text.length() <= 10 &&
                            text.matches("[A-Z][A-Z0-9\\-]*") &&
                            !text.matches(".*[0-9]{4}.*") &&
                            !isCommonWord(text)) {

                        subject = text;
                        foundSubject = true;
                    }
                    // TITLE - text in middle columns
                    else if (foundSubject &&
                            x > layout.subjectX + 50 &&
                            x < layout.gradeX - 70 &&
                            !text.equals(subject) &&
                            !text.matches(".*[0-9]{4}.*") &&
                            !isCommonWord(text)) {

                        title.append(text).append(" ");
                    }
                }
            }

            if (subject != null && grade != null) {

                double confidence = calculateConfidence(
                        subject,
                        title.toString().trim(),
                        grade,
                        credits);

                if (confidence >= 0.5) { // lowered threshold for better coverage

                    TranscriptDto dto = new TranscriptDto(
                            currentYear,
                            subject,
                            title.toString().trim(),
                            formatGrade(grade),
                            credits,
                            confidence);

                    results.add(dto);
                }
            }

        }

        return removeDuplicates(results);
    }

    private boolean isCommonWord(String text) {
        // Filter out common words that aren't subject codes
        Set<String> commonWords = new HashSet<>(Arrays.asList(
                "COURSE", "CODE", "DESCRIPTION", "TITLE", "SUBJECT",
                "FINAL", "GRADE", "CREDITS", "RE", "EXAM", "UNITS",
                "TERM", "SEM", "SEMESTER", "FOR", "OF", "AND", "THE",
                "IN", "WITH", "ON", "AT", "TO", "OR", "BY", "A", "AS"));
        return commonWords.contains(text);
    }

    /*
     * ==============================
     * UTILITIES
     * ==============================
     */

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

        // Try to match year ranges like "2021-2022"
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(20\\d{2})[\\s\\-](20\\d{2})")
                .matcher(line);

        if (m.find()) {
            String year1 = m.group(1);
            String year2 = m.group(2);
            return year1 + "-" + year2;
        }

        // Try to match single year "2023"
        m = java.util.regex.Pattern.compile("(20\\d{2})")
                .matcher(line);

        if (m.find())
            return m.group(1);

        return null;
    }

    private String formatGrade(String grade) {

        if (!grade.matches("\\d+(\\.\\d+)?"))
            return grade;

        double val = Double.parseDouble(grade);
        return String.format("%.2f", val);
    }

    private String join(List<VisionWordDto> row) {
        return row.stream()
                .map(VisionWordDto::getText)
                .collect(Collectors.joining(" "));
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

        System.out.println("University detection failed, defaulting to UNKNOWN. OCR Text: " + text);

        if (text.contains("IMMACULATE CONCEPTION"))
            return "CIC";

        return "UNKNOWN";
    }

    private void autoTrainLayout(String universityCode, LayoutModel aiLayout) {

        if (layoutRepository.findByUniversityCode(universityCode).isPresent()) {
            return; // already trained
        }

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

    private double calculateConfidence(
            String subject,
            String title,
            String grade,
            Integer credits) {

        double score = 0;

        // Subject code quality (any valid code format gets credit)
        if (subject != null && subject.matches("[A-Z][A-Z0-9\\-]{1,9}"))
            score += 0.3;

        // Title presence (even short titles count, as many courses have brief names)
        if (title != null && !title.isEmpty())
            score += 0.25;

        // Grade presence (critical for course records)
        if (grade != null && (grade.matches("\\d+\\.\\d{2}") || grade.matches("\\d{2}") || grade.equals("PASSED")))
            score += 0.35;

        // Credits presence (optional but good to have)
        if (credits != null && credits > 0)
            score += 0.1;

        return score;
    }

}