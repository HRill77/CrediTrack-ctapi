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
import com.cta.creditrack.repository.CurriculaRepository;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@AllArgsConstructor
public class DataIngestionService {

    private final CurriculaRepository curriculaRepository;
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
        for (int i = 0; i < curriculaList.size(); i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, curriculaList.size());
            List<Curricula> batch = curriculaList.subList(i, end);
            curriculaRepository.saveAll(batch);
            curriculaRepository.flush();
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
                    .trim(); // normalize

            headerMap.put(header, cell.getColumnIndex());
        }

        return headerMap;
    }

    private String getString(Row row, Map<String, Integer> h, String key) {
        Integer idx = h.get(key);
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
        Integer idx = h.get(key);
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
        Integer idx = h.get(key);
        if (idx == null || idx >= values.length)
            return null;

        String v = values[idx].trim().replace("\"", "");
        return v.isEmpty() ? null : v;
    }

    private Integer getCsvInt(String[] values, Map<String, Integer> h, String key) {
        Integer idx = h.get(key);
        if (idx == null || idx >= values.length)
            return null;

        String v = values[idx].trim().replace("\"", "");
        if (v.isEmpty())
            return null;

        return Integer.parseInt(v);
    }

    private void validateRequiredHeaders(Map<String, Integer> headerMap, String source) {
        List<String> missingHeaders = REQUIRED_HEADERS.stream()
                .filter(h -> !headerMap.containsKey(h))
                .collect(Collectors.toList());

        if (!missingHeaders.isEmpty()) {
            throw new IllegalArgumentException(
                    "Missing required header(s) in " + source + ": " + String.join(", ", missingHeaders));
        }
    }

    private static final List<String> REQUIRED_HEADERS = List.of(
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
}
