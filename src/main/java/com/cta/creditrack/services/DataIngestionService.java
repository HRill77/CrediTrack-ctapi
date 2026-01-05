package com.cta.creditrack.services;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
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

    public void ingestCurriculaDataFromExcel(InputStream file) throws IOException{
        List<Curricula> curriculaList = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file)) {
            Sheet sheet = workbook.getSheetAt(0);

            curriculaList = StreamSupport.stream(sheet.spliterator(), false)
                    .skip(1) // Skip header row
                    .filter(row -> !isRowEmpty(row))
                    .map(row -> {
                        try {
                            Curricula curricula = mapRowToCurricula(row);
                            Optional<Curricula> existingData = curriculaRepository.findByCourseCode(curricula.getCourseCode());
                            return existingData
                            .map(existing -> this.updateExistingCurricula(existing, curricula))
                            .orElse(curricula);

                        } catch (Exception e) {
                            String errorMsg = String.format("Error processing row %d: %s", row.getRowNum() + 1, e.getMessage());
                            log.warn(errorMsg, e);
                            errors.add(errorMsg);
                            return null;
                        }
                    })
                     .filter(b -> b != null).collect(Collectors.toList());

             saveAndFlushData(curriculaList);
            
        } catch (Exception e) {
            log.error("Failed to ingest bill rates file", e);
            throw e instanceof IOException ? (IOException) e : new IOException("Failed to process file", e);
        }

       logResults(errors, curriculaList);
    }

    private void ingestCurriculaDataFromCSV(InputStream file) throws IOException {
        List<Curricula> curriculaList = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int rowNum = 1;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file))) {
            String line;
            reader.readLine(); // Skip header row

            while ((line = reader.readLine()) != null) {
                rowNum++;
                if (line.trim().isEmpty()) {
                    continue;
                }

                try {
                    Curricula curricula = mapCSVLineToCurricula(line);
                    Optional<Curricula> existingData = curriculaRepository.findByCourseCode(curricula.getCourseCode());
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
            throw e instanceof IOException ? (IOException) e : new IOException("Failed to process file", e);
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

    private Curricula mapRowToCurricula(Row row) {
        Curricula curricula = new Curricula();
        curricula.setProgramTitle(row.getCell(0).getStringCellValue());
        curricula.setProgramCode(row.getCell(1).getStringCellValue());
        curricula.setYear(row.getCell(2).getStringCellValue());
        curricula.setSemester(row.getCell(3).getStringCellValue());
        curricula.setCourseCode(row.getCell(4).getStringCellValue());
        curricula.setCourseTitle(row.getCell(5).getStringCellValue());
        curricula.setPreRequisite(row.getCell(6).getStringCellValue());
        curricula.setLec((int) row.getCell(7).getNumericCellValue());
        curricula.setLab((int) row.getCell(8).getNumericCellValue());
        curricula.setUnits((int) row.getCell(9).getNumericCellValue());
        return curricula;
    }

     private Curricula mapCSVLineToCurricula(String line) {
        String[] values = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)"); // CSV parsing with quoted values support
        
        Curricula curricula = new Curricula();
        curricula.setProgramTitle(values[0].trim());
        curricula.setProgramCode(values[1].trim());
        curricula.setYear(values[2].trim());
        curricula.setSemester(values[3].trim());
        curricula.setCourseCode(values[4].trim());
        curricula.setCourseTitle(values[5].trim());
        curricula.setPreRequisite(values[6].trim());
        curricula.setLec(Integer.parseInt(values[7].trim()));
        curricula.setLab(Integer.parseInt(values[8].trim()));
        curricula.setUnits(Integer.parseInt(values[9].trim()));
        return curricula;
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
        return originalFilename.endsWith(".xlsx") || originalFilename.endsWith(".xls") || originalFilename.endsWith(".csv");
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
}
