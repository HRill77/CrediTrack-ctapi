package com.cta.creditrack.services;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cta.creditrack.model.Curricula;
import com.cta.creditrack.model.Course;
import com.cta.creditrack.repository.CurriculaRepository;
import com.cta.creditrack.repository.CourseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@AllArgsConstructor
public class DataIngestionService {

    private final CurriculaRepository curriculaRepository;
    private final CourseRepository courseRepository;
    private final ObjectMapper objectMapper;

    private static final int BATCH_SIZE = 500;

    public void ingestCurriculaData(InputStream file, String fileType) throws IOException {
        if ("csv".equalsIgnoreCase(fileType)) {
            ingestCurriculaDataFromCSV(file);
        } else {
            ingestCurriculaDataFromExcel(file);
        }
    }

    public void ingestCurriculaData(InputStream file) throws IOException {
        ingestCurriculaDataFromExcel(file);
    }

    public void ingestCurriculaDataFromExcel(InputStream file) throws IOException {
        List<Curricula> curriculaList = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file)) {

            int sheetCount = workbook.getNumberOfSheets();

            for (int i = 0; i < sheetCount; i++) {
                Sheet sheet = workbook.getSheetAt(i);
                Map<String, Integer> headerMap = extractHeaderIndexMap(sheet);
                log.info("{}" + headerMap);

                validateRequiredHeaders(headerMap, sheet.getSheetName());

                StreamSupport.stream(sheet.spliterator(), false)
                        .skip(1) // skip header row
                        .filter(row -> !isRowEmpty(row))
                        .map(row -> {
                            try {
                                Curricula curricula = mapRowToCurricula(row, headerMap);
                                return curriculaRepository.findByProgramCodeAndProgramTitleAndCourseCodeAndCourseTitle(
                                        curricula.getProgramCode(),
                                        curricula.getProgramTitle(),
                                        curricula.getCourseCode(),
                                        curricula.getCourseTitle())
                                        .map(existing -> updateExistingCurricula(existing, curricula))
                                        .orElse(curricula);
                            } catch (Exception e) {
                                String errorMsg = String.format(
                                        "Sheet: %s, Row %d: %s",
                                        sheet.getSheetName(),
                                        row.getRowNum() + 1,
                                        e.getMessage());
                                log.warn(errorMsg, e);
                                errors.add(errorMsg);
                                return null;
                            }
                        })
                        .filter(Objects::nonNull)
                        .forEach(curriculaList::add);
            }

            saveAndFlushData(curriculaList);
        } catch (Exception e) {
            log.error("Failed to ingest curriculaa file", e);
            throw e instanceof IOException ? (IOException) e : new IOException(e.getMessage());
        }

        logResults(errors, curriculaList);
    }

    private void ingestCurriculaDataFromCSV(InputStream file) throws IOException {
        List<Curricula> curriculaList = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int rowNum = 1;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file))) {
            String line;
            String headerLine = reader.readLine();
            String[] headers = headerLine.split(",");

            Map<String, Integer> headerMap = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                headerMap.put(headers[i].trim().toLowerCase(), i);
            }

            validateRequiredHeaders(headerMap, "CSV");

            while ((line = reader.readLine()) != null) {
                rowNum++;
                if (line.trim().isEmpty()) {
                    continue;
                }

                try {
                    Curricula curricula = mapCSVLineToCurricula(line, headerMap);
                    Optional<Curricula> existingData = curriculaRepository
                            .findByProgramCodeAndProgramTitleAndCourseCodeAndCourseTitle(curricula.getProgramCode(),
                                    curricula.getProgramTitle(),
                                    curricula.getCourseCode(),
                                    curricula.getCourseTitle());
                    Curricula curriculaToSave = existingData
                            .map(existing -> this.updateExistingCurricula(existing, curricula))
                            .orElse(curricula);
                    curriculaList.add(curriculaToSave);

                } catch (Exception e) {
                    String errorMsg = String.format("Error processing row %d: %s", rowNum, e.getMessage());
                    log.warn(errorMsg, e);
                    errors.add(errorMsg);
                }
            }

            saveAndFlushData(curriculaList);

        } catch (Exception e) {
            log.error("Failed to ingest curricula CSV file", e);
            throw e instanceof IOException ? (IOException) e : new IOException(e.getMessage());
        }

        logResults(errors, curriculaList);
    }

    private void saveAndFlushData(List<Curricula> curriculaList) {
        saveAndFlushDataGeneric(curriculaList, batch -> curriculaRepository.saveAll(batch));
    }

    private void saveAndFlushDataCourse(List<Course> courseList) {
        saveAndFlushDataGeneric(courseList, batch -> courseRepository.saveAll(batch));
    }

    private <T> void saveAndFlushDataGeneric(List<T> dataList, java.util.function.Consumer<List<T>> saveOperation) {
        for (int i = 0; i < dataList.size(); i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, dataList.size());
            List<T> batch = dataList.subList(i, end);
            saveOperation.accept(batch);
            log.info("Saved batch {} to {}", i / BATCH_SIZE + 1, end);
        }
    }

    private void logResults(List<String> errors, List<Curricula> curriculaList) {
        if (!errors.isEmpty()) {
            log.info("Completed with {} parsing errors. First few errors:\n{}",
                    errors.size(),
                    errors.stream().limit(10).collect(Collectors.joining("\n")));
        } else {
            log.info("Upload completed successfully. {} records persisted.", curriculaList.size());
        }
    }

    private void logResultsCourse(List<String> errors, List<Course> courseList) {
        if (!errors.isEmpty()) {
            log.info("Completed with {} parsing errors. First few errors:\n{}",
                    errors.size(),
                    errors.stream().limit(10).collect(Collectors.joining("\n")));
        } else {
            log.info("Upload completed successfully. {} records persisted.", courseList.size());
        }
    }

    private Curricula mapRowToCurricula(Row row, Map<String, Integer> h) {
        Curricula c = new Curricula();

        c.setProgramTitle(getString(row, h, "Program Title"));
        c.setProgramCode(getString(row, h, "Program Code"));
        c.setYear(getString(row, h, "Year"));
        c.setSemester(getString(row, h, "Semester"));
        c.setCourseCode(getString(row, h, "Code"));
        c.setCourseTitle(getString(row, h, "Course Title"));
        c.setPreRequisite(getString(row, h, "Pre-req"));

        c.setLec(getInt(row, h, "LEC"));
        c.setLab(getInt(row, h, "LAB"));
        c.setUnits(getInt(row, h, "Units"));

        return c;
    }

    private Curricula mapCSVLineToCurricula(String line, Map<String, Integer> h) {
        String[] values = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");

        Curricula c = new Curricula();

        c.setProgramTitle(getCsvString(values, h, "Program Title"));
        c.setProgramCode(getCsvString(values, h, "Program Code"));
        c.setYear(getCsvString(values, h, "Year"));
        c.setSemester(getCsvString(values, h, "Semester"));
        c.setCourseCode(getCsvString(values, h, "Code"));
        c.setCourseTitle(getCsvString(values, h, "Course Title"));
        c.setPreRequisite(getCsvString(values, h, "Pre-req"));

        c.setLec(getCsvInt(values, h, "LEC"));
        c.setLab(getCsvInt(values, h, "LAB"));
        c.setUnits(getCsvInt(values, h, "Units"));

        return c;
    }

    private Curricula updateExistingCurricula(Curricula existing, Curricula updated) {
        existing.setProgramTitle(updated.getProgramTitle());
        existing.setProgramCode(updated.getProgramCode());
        existing.setYear(updated.getYear());
        existing.setSemester(updated.getSemester());
        existing.setCourseTitle(updated.getCourseTitle());
        existing.setPreRequisite(updated.getPreRequisite());
        existing.setLec(updated.getLec());
        existing.setLab(updated.getLab());
        existing.setUnits(updated.getUnits());
        return existing;
    }

    private Course updateExistingCourse(Course existing, Course updated) {
        existing.setUnits(updated.getUnits());
        existing.setPrerequisite(updated.getPrerequisite());
        existing.setDescription(updated.getDescription());
        existing.setCourseOutline(updated.getCourseOutline());
        existing.setSyllabusVersion(existing.getSyllabusVersion()); // Increment syllabus version on update
        return existing;
    }

    private boolean isRowEmpty(Row row) {
        if (row == null)
            return true;
        for (int i = row.getFirstCellNum(); i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                return false;
            }
        }
        return true;
    }

    public boolean isValidFile(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return false;
        }
        return originalFilename.endsWith(".xlsx") || originalFilename.endsWith(".xls")
                || originalFilename.endsWith(".csv");
    }

    public String getFileType(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return null;
        }
        if (originalFilename.endsWith(".csv")) {
            return "csv";
        }
        return "excel";
    }

    private Map<String, Integer> extractHeaderIndexMap(Sheet sheet) {
        Row headerRow = sheet.getRow(0);
        if (headerRow == null) {
            throw new IllegalArgumentException("Header row is missing");
        }

        Map<String, Integer> headerMap = new HashMap<>();

        for (Cell cell : headerRow) {
            String header = cell.getStringCellValue()
                    .trim()
                    .toLowerCase(); // normalize to lowercase for case-insensitive matching

            headerMap.put(header, cell.getColumnIndex());
        }

        return headerMap;
    }

    private String getString(Row row, Map<String, Integer> h, String key) {
        Integer idx = h.get(key.toLowerCase());
        if (idx == null)
            return null;

        Cell cell = row.getCell(idx, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null)
            return null;

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((int) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> null;
        };
    }

    private Integer getInt(Row row, Map<String, Integer> h, String key) {
        Integer idx = h.get(key.toLowerCase());
        if (idx == null)
            return null;

        Cell cell = row.getCell(idx, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null)
            return null;

        return cell.getCellType() == CellType.NUMERIC
                ? (int) cell.getNumericCellValue()
                : null;
    }

    private String getCsvString(String[] values, Map<String, Integer> h, String key) {
        Integer idx = h.get(key.toLowerCase());
        if (idx == null || idx >= values.length)
            return null;

        String v = values[idx].trim().replace("\"", "");
        return v.isEmpty() ? null : v;
    }

    private Integer getCsvInt(String[] values, Map<String, Integer> h, String key) {
        Integer idx = h.get(key.toLowerCase());
        if (idx == null || idx >= values.length)
            return null;

        String v = values[idx].trim().replace("\"", "");
        if (v.isEmpty())
            return null;

        return Integer.parseInt(v);
    }

    private void validateRequiredHeaders(Map<String, Integer> headerMap, String source) {
        validateRequiredHeaders(headerMap, source, CURRICULA_HEADERS);
    }

    private void validateRequiredHeadersForCourse(Map<String, Integer> headerMap, String source) {
        validateRequiredHeaders(headerMap, source, COURSE_HEADERS);
    }

    private void validateRequiredHeaders(Map<String, Integer> headerMap, String source, List<String> requiredHeaders) {
        log.info("Headers found in {}: {}", source, headerMap.keySet());
        List<String> missingHeaders = requiredHeaders.stream()
                .filter(h -> !headerMap.containsKey(h.toLowerCase()))
                .collect(Collectors.toList());

        if (!missingHeaders.isEmpty()) {
            throw new IllegalArgumentException(
                    "Missing required header(s) in " + source + ": " + String.join(", ", missingHeaders));
        }
    }

    private static final List<String> CURRICULA_HEADERS = List.of(
            "Program Title",
            "Program Code",
            "Year",
            "Semester",
            "Code",
            "Course Title",
            "Pre-req",
            "LEC",
            "LAB",
            "Units");

    private static final List<String> COURSE_HEADERS = List.of(
            "Course Name",
            "Units",
            "Pre-requisite",
            "Description",
            "Course Outline",
            "Version");

    // ===================== COURSE UPLOAD METHODS =====================

    public void ingestCourseData(InputStream file, String fileType) throws IOException {
        if ("csv".equalsIgnoreCase(fileType)) {
            ingestCoursesFromCsv(file);
        } else {
            ingestCourseDataFromExcel(file);
        }
    }

    public void ingestCourseDataFromExcel(InputStream file) throws IOException {
        List<Course> courseList = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file)) {

            int sheetCount = workbook.getNumberOfSheets();

            for (int i = 0; i < sheetCount; i++) {
                Sheet sheet = workbook.getSheetAt(i);
                Map<String, Integer> headerMap = extractHeaderIndexMap(sheet);
                log.info("{}" + headerMap);

                validateRequiredHeadersForCourse(headerMap, sheet.getSheetName());

                StreamSupport.stream(sheet.spliterator(), false)
                        .skip(1) // skip header row
                        .filter(row -> !isRowEmpty(row))
                        .map(row -> {
                            try {
                                Course course = mapRowToCourseExcel(row, headerMap);
                                return courseRepository.findByCourseNameIgnoreCaseAndSyllabusVersion(course.getCourseName().toLowerCase(), course.getSyllabusVersion())
                                        .map(existing -> updateExistingCourse(existing, course))
                                        .orElse(course);
                            } catch (Exception e) {
                                String errorMsg = String.format(
                                        "Sheet: %s, Row %d: %s",
                                        sheet.getSheetName(),
                                        row.getRowNum() + 1,
                                        e.getMessage());
                                log.warn(errorMsg, e);
                                errors.add(errorMsg);
                                return null;
                            }
                        })
                        .filter(Objects::nonNull)
                        .forEach(courseList::add);
            }

            saveAndFlushDataCourse(courseList);
        } catch (Exception e) {
            log.error("Failed to ingest course file", e);
            throw e instanceof IOException ? (IOException) e : new IOException(e.getMessage());
        }

        logResultsCourse(errors, courseList);
    }

    public void ingestCoursesFromCsv(InputStream file) throws IOException {
        List<Course> courseList = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int rowNum = 1;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file))) {
            String line;
            String headerLine = reader.readLine();
            String[] headers = headerLine.split(",");

            Map<String, Integer> headerMap = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                headerMap.put(headers[i].trim().toLowerCase(), i);

            }

            validateRequiredHeadersForCourse(headerMap, "CSV");

            while ((line = reader.readLine()) != null) {
                rowNum++;
                if (line.trim().isEmpty()) {
                    continue;
                }

                try {
                    Course c = mapRowToCourseCsv(line, headerMap);
                    Optional<Course> existingData = courseRepository.findByCourseNameIgnoreCaseAndSyllabusVersion(c.getCourseName().toLowerCase(), c.getSyllabusVersion());
                    Course courseToSave = existingData
                            .map(existing -> this.updateExistingCourse(existing, c))
                            .orElse(c);
                    courseList.add(courseToSave);

                } catch (Exception e) {
                    String errorMsg = String.format("Error processing row %d: %s", rowNum, e.getMessage());
                    log.warn(errorMsg, e);
                    errors.add(errorMsg);
                }
            }

            saveAndFlushDataCourse(courseList);

        } catch (Exception e) {
            log.error("Failed to ingest curricula CSV file", e);
            throw e instanceof IOException ? (IOException) e : new IOException(e.getMessage());
        }

        logResultsCourse(errors, courseList);

    }

    private String[] parseCSVLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean insideQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);

            if (c == '"') {
                insideQuotes = !insideQuotes;
            } else if (c == ',' && !insideQuotes) {
                result.add(sb.toString().trim());
                sb = new StringBuilder();
            } else {
                sb.append(c);
            }
        }

        result.add(sb.toString().trim());
        return result.toArray(new String[0]);
    }

    private Course mapRowToCourseCsv(String line, Map<String, Integer> h) throws Exception {
        String[] values = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");

        Course course = new Course();
        course.setCourseName(getCsvString(values, h, "Course Name"));
        course.setUnits(getCsvString(values, h, "Units"));
        course.setPrerequisite(getCsvString(values, h, "Pre-requisite"));
        course.setDescription(getCsvString(values, h, "Description"));
        String rawOutline = getCsvString(values, h, "Course Outline");
        course.setCourseOutline(convertCourseOutlineToJson(rawOutline));

        return course;
    }

    private Course mapRowToCourseExcel(Row row, Map<String, Integer> h) {
        Course c = new Course();

        c.setCourseName(getString(row, h, "Course Name"));
        c.setUnits(getString(row, h, "Units"));
        c.setPrerequisite(getString(row, h, "Pre-requisite"));
        c.setDescription(getString(row, h, "Description"));
        String rawOutline = getString(row, h, "Course Outline");
        c.setCourseOutline(convertCourseOutlineToJson(rawOutline));
        c.setSyllabusVersion(getInt(row, h, "Version"));

        return c;
    }

    private String getMapValue(Map<String, String> map, String... possibleKeys) {
        for (String key : possibleKeys) {
            String value = map.get(key);
            if (value != null && !value.isEmpty()) {
                return value;
            }
        }
        return null;
    }

    private String convertCourseOutlineToJson(String courseOutline) {
    if (courseOutline == null || courseOutline.isBlank()) {
        return "[]";
    }

    try {
        List<String> items = new ArrayList<>();

        String normalized = courseOutline
                .replace("\r\n", "\n")
                .replace("\r", "\n");

        // Split by newline ONLY
        String[] lines = normalized.split("\\n");

        for (String line : lines) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty()) {
                items.add(trimmed); // keeps numbering intact
            }
        }

        return objectMapper.writeValueAsString(items);

    } catch (Exception e) {
        throw new IllegalArgumentException("Invalid course outline format", e);
    }
}


}
