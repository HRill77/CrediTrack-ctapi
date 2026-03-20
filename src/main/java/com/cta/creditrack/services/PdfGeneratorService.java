package com.cta.creditrack.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import com.cta.creditrack.model.User;
import com.cta.creditrack.dtos.TranscriptEvaluationGroupedResponse;
import com.cta.creditrack.dtos.EvaluationItem;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

import com.itextpdf.kernel.colors.*;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.*;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfGeneratorService {

    private final TranscriptEvaluationService evaluationService;

    public byte[] generateEvaluationPdf(Long studentId, User programHead) {

        try {

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4.rotate());
            document.setMargins(20, 20, 20, 20);

            TranscriptEvaluationGroupedResponse data = evaluationService.getEvaluationByStudentId(studentId,
                    programHead);

            // ===============================
            // HEADER
            // ===============================
            document.add(new Paragraph("CrediTrack Evaluation Results")
                    .setBold()
                    .setFontSize(14)
                    .setFontColor(new DeviceRgb(6, 79, 30))
                    .setMultipliedLeading(1));

            document.add(new Paragraph(
                    "Name: " + safe(data.lastName()) + ", " +
                            safe(data.firstName()) + " " +
                            safe(data.middleName()))
                    .setFontSize(10)
                    .setMultipliedLeading(1));

            document.add(new Paragraph("Email: " + safe(data.email()))
                    .setFontSize(10)
                    .setMultipliedLeading(1));

            document.add(new Paragraph("Year Level: " + safe(data.yearLevel()))
                    .setFontSize(10)
                    .setMultipliedLeading(1));

            document.add(new Paragraph(" ").setFontSize(6));
            // ===============================
            // TRANSFER DETAILS
            // ===============================
            document.add(new Paragraph("Transfer Details")
                    .setBold()
                      .setFontSize(14)
                    .setFontColor(new DeviceRgb(6, 79, 30))
                    .setMultipliedLeading(1));

            document.add(new Paragraph("From: " +
                    safe(data.fromUniversity()) + " - " +
                    safe(data.fromProgram()))
                    .setFontSize(10)
                    .setMultipliedLeading(1));

            document.add(new Paragraph("To: " +
                    safe(data.toUniversity()) + " - " +
                    safe(data.toProgram()))
                    .setFontSize(10)
                    .setMultipliedLeading(1));

            document.add(new Paragraph(" "));

            // ===============================
            // TABLE
            // ===============================

            Table table = new Table(UnitValue.createPercentArray(
                    new float[] { 10, 25, 8, 8, 8, 25, 10 }))
                    .useAllAvailableWidth();

            addHeader(table, "Subject Code");
            addHeader(table, "Course Name");
            addHeader(table, "Units");
            addHeader(table, "Credited");
            addHeader(table, "Grade");
            addHeader(table, "Remarks");
            addHeader(table, "Confidence %");

            int totalUnits = 0;
            int totalCredited = 0;

            Map<String, List<EvaluationItem>> grouped = groupByYearAndSemester(data.evaluation());

            for (Map.Entry<String, List<EvaluationItem>> entry : grouped.entrySet()) {

                // Section Header (like React)
                table.addCell(new Cell(1, 7)
                        .add(new Paragraph(entry.getKey())
                                .setBold()
                                .setFontSize(9)
                                .setFontColor(ColorConstants.BLACK))
                        .setBackgroundColor(new DeviceRgb(240, 240, 240))
                        .setPaddingTop(4)
                        .setPaddingBottom(4));

                for (EvaluationItem e : entry.getValue()) {

                    int units = e.curricula().units() != null
                            ? e.curricula().units()
                            : 0;

                    totalUnits += units;

                    int credited = Boolean.TRUE.equals(e.finalApproved())
                            ? units
                            : 0;

                    totalCredited += credited;

                    boolean isInvalid = "Insufficient units".equalsIgnoreCase(e.remarks()) ||
                            "Failed grade".equalsIgnoreCase(e.remarks()) ||
                            "Course mismatch".equalsIgnoreCase(e.remarks());

                    Color textColor = isInvalid
                            ? ColorConstants.RED
                            : ColorConstants.BLACK;

                    table.addCell(valueCell(e.transcript().subjectCode(), textColor));
                    table.addCell(valueCell(e.transcript().courseName(), textColor));
                    table.addCell(centerCell(String.valueOf(units), textColor));
                    table.addCell(centerCell(String.valueOf(credited), textColor));
                    table.addCell(centerCell(e.transcript().grade(), textColor));
                    table.addCell(valueCell(safe(e.remarks()), textColor));
                    table.addCell(centerCell(
                            String.valueOf(Math.round(e.confidenceScore())),
                            textColor));
                }
            }

            document.add(table);

            document.add(new Paragraph(" "));

            // ===============================
            // FOOTER (LEFT + RIGHT)
            // ===============================

            Table footer = new Table(UnitValue.createPercentArray(new float[] { 1, 1 }))
                    .useAllAvailableWidth();

            // LEFT SIDE
            Cell left = new Cell().setBorder(Border.NO_BORDER);

            if (data.approvals() != null &&
                    data.approvals().approvedDate() != null) {

                left.add(new Paragraph("sgd.")
                        .setFontColor(ColorConstants.RED)
                         .setMultipliedLeading(1));

                left.add(new Paragraph(
                        programHead.getLastname() + ", " +
                                programHead.getFirstname())
                        .setFontSize(10)
                        .setMultipliedLeading(1));

                left.add(new Paragraph("Program Head")
                        .setFontSize(10)
                        .setMultipliedLeading(1));

                left.add(new Paragraph(
                        data.approvals().approvedDate().toLocalDate().toString())
                        .setFontSize(10)
                        .setMultipliedLeading(1));
            } else {

                left.add(new Paragraph("_________________________"));
                left.add(new Paragraph(
                        programHead.getLastname() + ", " +
                                programHead.getFirstname()));
                left.add(new Paragraph("Program Head"));
            }

            footer.addCell(left);

            // RIGHT SIDE
            Cell right = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT);

            right.add(new Paragraph(
                    "Units Credited: " +
                            totalCredited + "/" + totalUnits)
                    .setFontColor(new DeviceRgb(6, 79, 30)));

            right.add(new Paragraph(
                    "Expected Year of Graduation: " +
                            calculateGraduationYear())
                    .setFontColor(new DeviceRgb(6, 79, 30)));

            footer.addCell(right);

            document.add(footer);

            document.close();
            return out.toByteArray();

        } catch (Exception e) {
            log.error("PDF generation failed", e);
            throw new RuntimeException("PDF generation failed: " + e.getMessage(), e);
        }
    }

    private Cell valueCell(String text, Color color) {
    return new Cell()
            .add(new Paragraph(safe(text))
                    .setFontSize(8.5f)
                    .setFontColor(color))
            .setPadding(2);
}


    // ===============================
    // GROUPING (MATCH FRONTEND)
    // ===============================
    private Map<String, List<EvaluationItem>> groupByYearAndSemester(
            List<EvaluationItem> evaluations) {

        Map<String, Integer> yearOrder = Map.of(
                "First Year", 1,
                "Second Year", 2,
                "Third Year", 3,
                "Fourth Year", 4);

        Map<String, Integer> semOrder = Map.of(
                "First Semester", 1,
                "Second Semester", 2);

        return evaluations.stream()
                .sorted(Comparator
                        .comparing((EvaluationItem e) -> yearOrder.getOrDefault(
                                safe(e.curricula().year()), 99))
                        .thenComparing(e -> semOrder.getOrDefault(
                                safe(e.curricula().semester()), 99)))
                .collect(Collectors.groupingBy(
                        e -> safe(e.curricula().year()) + ", " +
                                safe(e.curricula().semester()),
                        LinkedHashMap::new,
                        Collectors.toList()));
    }

    // ===============================
    // HELPERS
    // ===============================

   private void addHeader(Table table, String text) {
    table.addHeaderCell(new Cell()
            .add(new Paragraph(text)
                    .setFontSize(9)
                    .setBold())
            .setBackgroundColor(new DeviceRgb(6,79,30))
            .setFontColor(ColorConstants.WHITE)
            .setPadding(3));
}

   private Cell centerCell(String text, Color color) {
    return new Cell()
            .add(new Paragraph(safe(text))
                    .setFontSize(8.5f)
                    .setFontColor(color))
            .setTextAlignment(TextAlignment.CENTER)
            .setPadding(2);
}

    private String safe(String value) {
        return value != null ? value : "";
    }

    private String calculateGraduationYear() {
        LocalDate today = LocalDate.now();
        int currentYear = today.getYear();
        int academicStartYear = today.getMonthValue() < 6
                ? currentYear - 1
                : currentYear;

        int graduationStart = academicStartYear + 3;

        return "A.Y " + graduationStart + "-" + (graduationStart + 1);
    }
}