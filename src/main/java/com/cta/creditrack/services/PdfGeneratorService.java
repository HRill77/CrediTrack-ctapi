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

        private static final float MARGIN = 72f;

        public byte[] generateEvaluationPdf(Long studentId, User programHead) {

                try {

                        ByteArrayOutputStream out = new ByteArrayOutputStream();
                        PdfWriter writer = new PdfWriter(out);
                        PdfDocument pdf = new PdfDocument(writer);
                        Document document = new Document(pdf, PageSize.A4.rotate());
                        document.setMargins(MARGIN, MARGIN, MARGIN, MARGIN);

                        TranscriptEvaluationGroupedResponse data = evaluationService.getEvaluationByStudentId(studentId,
                                        programHead);

                        // ===============================
                        // HEADER - wrapped in table to force text wrap
                        // ===============================
                        document.add(textRow("CrediTrack Evaluation Results", 14, true,
                                        new DeviceRgb(6, 79, 30)));
                        document.add(spacer());
                        document.add(textRow("Name: " + safe(data.lastName()) + ", " +
                                        safe(data.firstName()) + " " + safe(data.middleName()), 10, false, null));
                        document.add(textRow("Email: " + safe(data.email()), 10, false, null));
                        document.add(textRow("Year Level: " + safe(data.yearLevel()), 10, false, null));
                        document.add(spacer());

                        // ===============================
                        // TRANSFER DETAILS
                        // ===============================
                        document.add(textRow("Transfer Details", 14, true,
                                        new DeviceRgb(6, 79, 30)));
                        document.add(spacer());
                        document.add(textRow("From: " + safe(data.fromUniversity()) +
                                        " - " + safe(data.fromProgram()), 9, false, null));
                        document.add(textRow("To: " + safe(data.toUniversity()) +
                                        " - " + safe(data.toProgram()), 9, false, null));
                        document.add(spacer());

                        // ===============================
                        // TABLE
                        // ===============================
                        Table table = new Table(UnitValue.createPercentArray(
                                        new float[] { 10, 25, 8, 8, 8, 25, 10 }))
                                        .useAllAvailableWidth()
                                        .setFixedLayout();

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

                                table.addCell(new Cell(1, 7)
                                                .add(new Paragraph(entry.getKey())
                                                                .setBold()
                                                                .setFontSize(9)
                                                                .setFontColor(ColorConstants.BLACK))
                                                .setBackgroundColor(new DeviceRgb(240, 240, 240))
                                                .setPaddingTop(4)
                                                .setPaddingBottom(4));

                                for (EvaluationItem e : entry.getValue()) {

                                        int units = e.curricula().units() != null ? e.curricula().units() : 0;
                                        totalUnits += units;

                                        int credited = Boolean.TRUE.equals(e.finalApproved()) ? units : 0;
                                        totalCredited += credited;

                                        boolean isInvalid = "Insufficient units".equalsIgnoreCase(e.remarks()) ||
                                                        "Failed grade".equalsIgnoreCase(e.remarks()) ||
                                                        "Course mismatch".equalsIgnoreCase(e.remarks());

                                        Color textColor = isInvalid ? ColorConstants.RED : ColorConstants.BLACK;

                                        table.addCell(valueCell(e.transcript().subjectCode(), textColor));
                                        table.addCell(valueCell(e.transcript().courseName(), textColor));
                                        table.addCell(centerCell(String.valueOf(units), textColor));
                                        table.addCell(centerCell(String.valueOf(credited), textColor));
                                        table.addCell(centerCell(e.transcript().grade(), textColor));
                                        table.addCell(valueCell(safe(e.remarks()), textColor));
                                        table.addCell(centerCell(
                                                        String.valueOf(Math.round(e.confidenceScore())), textColor));
                                }
                        }

                        document.add(table);
                        document.add(spacer());

                        // ===============================
                        // FOOTER (LEFT + RIGHT)
                        // ===============================
                        Table footer = new Table(UnitValue.createPercentArray(new float[] { 1, 1 }))
                                        .useAllAvailableWidth();

                        Cell left = new Cell().setBorder(Border.NO_BORDER);

                        if (data.approvals() != null && data.approvals().approvedDate() != null) {
                                left.add(new Paragraph("sgd.")
                                                .setFontColor(ColorConstants.RED)
                                                .setMultipliedLeading(1));
                                left.add(new Paragraph(programHead.getLastname() + ", " + programHead.getFirstname())
                                                .setFontSize(10).setMultipliedLeading(1));
                                left.add(new Paragraph("Program Head")
                                                .setFontSize(10).setMultipliedLeading(1));
                                left.add(new Paragraph(data.approvals().approvedDate().toLocalDate().toString())
                                                .setFontSize(10).setMultipliedLeading(1));
                        } else {
                                left.add(new Paragraph("_________________________"));
                                left.add(new Paragraph(programHead.getLastname() + ", " + programHead.getFirstname()));
                                left.add(new Paragraph("Program Head"));
                        }

                        footer.addCell(left);

                        Cell right = new Cell()
                                        .setBorder(Border.NO_BORDER)
                                        .setTextAlignment(TextAlignment.RIGHT);
                        right.add(new Paragraph("Units Credited: " + totalCredited + "/" + totalUnits)
                                        .setFontColor(new DeviceRgb(6, 79, 30)));
                        right.add(new Paragraph("Expected Year of Graduation: " + calculateGraduationYear())
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

        // ===============================
        // WRAPPER - forces text to wrap
        // ===============================
        private Table textRow(String text, float fontSize, boolean bold, DeviceRgb color) {
                Table wrapper = new Table(UnitValue.createPercentArray(new float[] { 100 }))
                                .useAllAvailableWidth()
                                .setFixedLayout();

                Paragraph p = new Paragraph(text)
                                .setFontSize(fontSize)
                                .setMultipliedLeading(1.3f);

                if (bold)
                        p.setBold();
                if (color != null)
                        p.setFontColor(color);

                wrapper.addCell(new Cell()
                                .setBorder(Border.NO_BORDER)
                                .setPadding(0)
                                .setMargin(0)
                                .add(p));

                return wrapper;
        }

        private Table spacer() {
                Table spacer = new Table(UnitValue.createPercentArray(new float[] { 100 }))
                                .useAllAvailableWidth();
                spacer.addCell(new Cell()
                                .setBorder(Border.NO_BORDER)
                                .setPadding(2)
                                .add(new Paragraph(" ").setFontSize(4)));
                return spacer;
        }

        // ===============================
        // CELL HELPERS
        // ===============================
        private Cell valueCell(String text, Color color) {
                return new Cell()
                                .add(new Paragraph(safe(text))
                                                .setFontSize(8.5f)
                                                .setFontColor(color)
                                                .setMultipliedLeading(1.2f))
                                .setPadding(2)
                                .setKeepTogether(false);
        }

        private Cell centerCell(String text, Color color) {
                return new Cell()
                                .add(new Paragraph(safe(text))
                                                .setFontSize(8.5f)
                                                .setFontColor(color)
                                                .setMultipliedLeading(1.2f))
                                .setTextAlignment(TextAlignment.CENTER)
                                .setPadding(2)
                                .setKeepTogether(false);
        }

        // ===============================
        // GROUPING
        // ===============================
        private Map<String, List<EvaluationItem>> groupByYearAndSemester(
                        List<EvaluationItem> evaluations) {

                Map<String, Integer> yearOrder = Map.of(
                                "First Year", 1, "Second Year", 2,
                                "Third Year", 3, "Fourth Year", 4);

                Map<String, Integer> semOrder = Map.of(
                                "First Semester", 1, "Second Semester", 2);

                return evaluations.stream()
                                .sorted(Comparator
                                                .comparing((EvaluationItem e) -> yearOrder.getOrDefault(
                                                                safe(e.curricula().year()), 99))
                                                .thenComparing(e -> semOrder.getOrDefault(
                                                                safe(e.curricula().semester()), 99)))
                                .collect(Collectors.groupingBy(
                                                e -> safe(e.curricula().year()) + ", " + safe(e.curricula().semester()),
                                                LinkedHashMap::new,
                                                Collectors.toList()));
        }

        // ===============================
        // HELPERS
        // ===============================
        private void addHeader(Table table, String text) {
                table.addHeaderCell(new Cell()
                                .add(new Paragraph(text).setFontSize(9).setBold())
                                .setBackgroundColor(new DeviceRgb(6, 79, 30))
                                .setFontColor(ColorConstants.WHITE)
                                .setPadding(3));
        }

        private String safe(String value) {
                return value != null ? value : "";
        }

        private String calculateGraduationYear() {
                LocalDate today = LocalDate.now();
                int currentYear = today.getYear();
                int academicStartYear = today.getMonthValue() < 6 ? currentYear - 1 : currentYear;
                int graduationStart = academicStartYear + 3;
                return "A.Y " + graduationStart + "-" + (graduationStart + 1);
        }
}