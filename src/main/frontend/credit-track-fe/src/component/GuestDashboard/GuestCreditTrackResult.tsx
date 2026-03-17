import React, { useState } from "react";
import { Modal, Box, Typography, Button, Snackbar, Alert } from "@mui/material";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import CrediTrackResultTable, {
  CREDIT_TRACK_COLUMNS,
  CREDIT_TRACK_DATA,
} from "./CrediTrackResultTable";
import TranscriptEvaluationService from "../../shared/services/TranscriptEvaluationService";

interface Course {
  subjectCode: string;
  courseName: string;
  units: number;
  creditedUnits: number;
  grade: number;
  remarks: string;
  confidenceScore: number;
  finalApproved?: boolean;
}

interface Section {
  year: string;
  semester: string;
  courses: Course[];
}

interface GuestCreditTrackResultProps {
  open: boolean;
  onClose: () => void;
  evaluationData?: any[];
  studentData?: {
    firstname: string;
    middlename: string;
    lastname: string;
    suffix: string;
    email: string;
    yearLevel: string;
  };
  studentId?: number;
  transferData?: {
    fromUniversity: string;
    fromCollege: string;
    fromProgram: string;
    toUniversity: string;
    toCollege: string;
    toProgram: string;
  };
}

const GuestCreditTrackResult: React.FC<GuestCreditTrackResultProps> = ({
  open,
  onClose,
  evaluationData = [],
  studentData,
  transferData,
  studentId,
}) => {
  /* ==============================
     TRANSFORM DATA
  ============================== */

  const invalidRemarks = [
    "Insufficient units",
    "Failed grade",
    "Course mismatch",
    "Courses mismatch",
  ];

  const transformEvaluationData = (evalData: any[]): Section[] => {
    if (!evalData || evalData.length === 0) return CREDIT_TRACK_DATA;

    const grouped: Record<string, Section> = {};

    evalData.forEach((item) => {
      if (!item.curricula) return;

      const key = `${item.curricula.year}|${item.curricula.semester}`;

      if (!grouped[key]) {
        grouped[key] = {
          year: item.curricula.year,
          semester: item.curricula.semester,
          courses: [],
        };
      }

      const isInvalid = invalidRemarks.includes(item.remarks);
      const units = item.curricula?.units || 0;

      grouped[key].courses.push({
        subjectCode: item.transcript?.subjectCode || "N/A",
        courseName: item.transcript?.courseName || "N/A",
        units,
        creditedUnits: item.finalApproved && !isInvalid ? units : 0,
        grade: item.transcript?.grade || "N/A",
        remarks: item.remarks || "N/A",
        confidenceScore: Math.round(item.confidenceScore || 0),
      });
    });

    const sortedData = Object.values(grouped).sort((a: any, b: any) => {
      const yearOrder: any = { First: 1, Second: 2, Third: 3, Fourth: 4 };
      const semesterOrder: any = { First: 1, Second: 2 };

      const yearA = yearOrder[a.year.split(" ")[0]] || 0;
      const yearB = yearOrder[b.year.split(" ")[0]] || 0;

      if (yearA !== yearB) return yearA - yearB;

      return (
        (semesterOrder[a.semester.split(" ")[0]] || 0) -
        (semesterOrder[b.semester.split(" ")[0]] || 0)
      );
    });

    return sortedData;
  };

  const displayData: Section[] =
    evaluationData.length > 0
      ? transformEvaluationData(evaluationData)
      : CREDIT_TRACK_DATA;

  /* ==============================
     CALCULATIONS
  ============================== */

  const calculateUnits = () => {
    let totalUnits = 0;
    let totalCredited = 0;
    displayData.forEach((section) => {
      section.courses.forEach((course) => {
        if (course.units > 0) {
          totalUnits += course.units;
        }
        if (
          course.creditedUnits > 0 &&
          !invalidRemarks.includes(course.remarks)
        ) {
          totalCredited += course.creditedUnits;
        }
      });
    });
    return { totalUnits, totalCredited };
  };

  const { totalUnits, totalCredited } = calculateUnits();

  const calculateGraduationYear = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const academicStartYear = currentMonth < 5 ? currentYear - 1 : currentYear;
    const yearLevelText = studentData?.yearLevel || "First Year";
    const yearMap: Record<string, number> = {
      First: 1,
      Second: 2,
      Third: 3,
      Fourth: 4,
    };
    const currentYearLevel = yearMap[yearLevelText.split(" ")[0]] || 1;
    const yearsRemaining = 4 - currentYearLevel;
    const graduationStartYear = academicStartYear + yearsRemaining;
    return `A.Y ${graduationStartYear}-${graduationStartYear + 1}`;
  };

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success",
  );

  // const handleSendForApproval = async () => {
  //   const isGuest = sessionStorage.getItem("isGuest") === "true";

  //   const guestPayload = {
  //     id: studentId || Date.now(),
  //     studentName:
  //       `${studentData?.lastname || ""}, ${studentData?.firstname || ""}`.trim(),
  //     studentEmail: studentData?.email || "",
  //     fromUniversity: transferData?.fromUniversity || "",
  //     fromProgram: transferData?.fromProgram || "",
  //     toProgram: transferData?.toProgram || "",
  //     toUniversity:
  //       transferData?.toUniversity || "Wesleyan University - Philippines",
  //     createdAt: new Date().toISOString(),
  //     evaluations: displayData.flatMap((section) =>
  //       section.courses.map((course) => ({
  //         subjectCode: course.subjectCode,
  //         courseName: course.courseName,
  //         units: course.units,
  //         creditedUnits: course.creditedUnits,
  //         grade: course.grade,
  //         remarks: course.remarks,
  //         confidenceScore: course.confidenceScore,
  //       })),
  //     ),
  //   };

  //   if (isGuest) {
  //     const existing = JSON.parse(
  //       localStorage.getItem("guest_approval_queue") || "[]",
  //     );
  //     localStorage.setItem(
  //       "guest_approval_queue",
  //       JSON.stringify([...existing, guestPayload]),
  //     );
  //     setSnackbarMessage(
  //       "CrediTrack result added to guest approval queue for program head.",
  //     );
  //     setSnackbarSeverity("success");
  //     setSnackbarOpen(true);
  //     return;
  //   }

  //   if (!studentId) {
  //     setSnackbarMessage("Unable to send for approval: missing student ID.");
  //     setSnackbarSeverity("error");
  //     setSnackbarOpen(true);
  //     return;
  //   }

  //   try {
  //     const payload = {
  //       studentId,
  //       toProgram: transferData?.toProgram,
  //       fromProgram: transferData?.fromProgram,
  //       evaluations: displayData.flatMap((section) =>
  //         section.courses.map((course) => ({
  //           evaluationId: null,
  //           transcriptId: null,
  //           courseName: course.courseName,
  //           subjectCode: course.subjectCode,
  //           units: course.units,
  //           grade: course.grade,
  //           curriculaId: null,
  //           remarks: course.remarks,
  //           confidenceScore: course.confidenceScore,
  //           finalApproved: course.creditedUnits > 0,
  //           deleted: false,
  //         })),
  //       ),
  //     };
  //     console.debug("Send for approval payload:", payload);
  //     await TranscriptEvaluationService.upsertEvaluations(payload);

  //     setSnackbarMessage("CrediTrack result sent for approval successfully.");
  //     setSnackbarSeverity("success");
  //     setSnackbarOpen(true);
  //   } catch (error: any) {
  //     console.error("Send for approval failed:", error);
  //     setSnackbarMessage(
  //       error?.response?.data?.message || "Failed to send for approval.",
  //     );
  //     setSnackbarSeverity("error");
  //     setSnackbarOpen(true);
  //   }
  // };

  const graduationYear = calculateGraduationYear();

  /* ==============================
     PDF GENERATOR
  ============================== */

  const handleDownloadPDF = () => {
    const doc = new jsPDF("landscape", "mm", "a4");
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let startY = margin;

    doc.setFontSize(14);
    doc.setTextColor(6, 79, 30);
    doc.text("CrediTrack Results", margin, startY);
    startY += 10;

    if (studentData) {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Name: ${studentData.lastname}, ${studentData.firstname} ${studentData.middlename || ""} ${studentData.suffix || ""}`,
        margin,
        startY,
      );
      startY += 6;
      doc.text(`Email: ${studentData.email}`, margin, startY);
      startY += 6;
      doc.text(`Year Level: ${studentData.yearLevel}`, margin, startY);
      startY += 10;
    }

    if (transferData) {
      doc.setFontSize(12);
      doc.setTextColor(6, 79, 30);
      doc.text("Transfer Details", margin, startY);
      startY += 6;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `From: ${transferData.fromUniversity} - ${transferData.fromProgram} (${transferData.fromCollege})`,
        margin,
        startY,
      );
      startY += 6;
      doc.text(
        `To: ${transferData.toUniversity} - ${transferData.toProgram} (${transferData.toCollege})`,
        margin,
        startY,
      );
      startY += 10;
    }

    const tableRows: RowInput[] = [];

    displayData.forEach((section) => {
      tableRows.push([
        {
          content: `${section.year}, ${section.semester}`,
          colSpan: 7,
          styles: {
            fontStyle: "bold",
            fillColor: [240, 240, 240] as [number, number, number],
          },
        },
      ]);

      section.courses.forEach((course) => {
        const isInvalid =
          course.remarks === "Insufficient units" ||
          course.remarks === "Failed grade" ||
          course.remarks === "Course mismatch";
        const color: [number, number, number] = isInvalid
          ? [204, 0, 0]
          : [0, 0, 0];

        tableRows.push([
          { content: course.subjectCode, styles: { textColor: color } },
          { content: course.courseName, styles: { textColor: color } },
          { content: course.units, styles: { textColor: color } },
          { content: course.creditedUnits, styles: { textColor: color } },
          { content: course.grade, styles: { textColor: color } },
          { content: course.remarks, styles: { textColor: color } },
          { content: course.confidenceScore, styles: { textColor: color } },
        ]);
      });
    });

    autoTable(doc, {
      startY,
      margin,
      head: [
        [
          "Subject Code",
          "Course Name",
          "Units",
          "Credited",
          "Grade",
          "Remarks",
          "Confidence",
        ],
      ],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: {
        fillColor: [6, 79, 30] as [number, number, number],
        textColor: 255,
      },
      columnStyles: {
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
        6: { halign: "center" },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(11);
    doc.setTextColor(6, 79, 30);
    doc.text(
      `Units Credited: ${totalCredited}/${totalUnits}`,
      pageWidth - margin,
      finalY,
      { align: "right" },
    );
    doc.text(
      `Expected Year of Graduation: ${graduationYear}`,
      pageWidth - margin,
      finalY + 6,
      { align: "right" },
    );

    doc.save(
      `${studentData?.lastname}, ${studentData?.firstname} -CrediTrack_Results.pdf`,
    );
  };

  /* ==============================
     UI
  ============================== */

  return (
    <Modal open={open} onClose={onClose}>
      <>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95%", sm: "90%", md: "85%" },
            maxWidth: 1200,
            maxHeight: "90vh",
            bgcolor: "background.paper",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Scrollable content */}
          <Box sx={{ overflowY: "auto", p: { xs: 2, sm: 3, md: 4 }, flex: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#064F1E",
                mb: 3,
                fontSize: "clamp(0.85rem, 2.5vw, 1.25rem)",
              }}
            >
              CrediTrack Results
            </Typography>

            <Box sx={{ overflowX: "auto" }}>
              <CrediTrackResultTable
                columns={CREDIT_TRACK_COLUMNS}
                data={displayData}
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontSize: "clamp(0.65rem, 1.8vw, 0.85rem)" }}>
                <strong>Units Credited:</strong> {totalCredited}/{totalUnits}
              </Typography>
              <Typography sx={{ fontSize: "clamp(0.65rem, 1.8vw, 0.85rem)" }}>
                <strong>Expected Year of Graduation:</strong> {graduationYear}
              </Typography>
            </Box>
          </Box>

          {/* Sticky footer buttons */}
          <Box
            sx={{
              px: { xs: 2, sm: 3, md: 4 },
              py: 2,
              borderTop: "1px solid #e0e0e0",
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
              bgcolor: "background.paper",
            }}
          >
            <Button
              variant="contained"
              onClick={handleDownloadPDF}
              sx={{
                backgroundColor: "#064F1E",
                fontSize: "clamp(0.65rem, 1.8vw, 0.8rem)",
                textTransform: "none",
                "&:hover": { backgroundColor: "#053a16" },
              }}
            >
              Download PDF
            </Button>
            {/* <Button
              variant="contained"
              onClick={handleSendForApproval}
              sx={{
                backgroundColor: "#1e5c2f",
                fontSize: "clamp(0.65rem, 1.8vw, 0.8rem)",
                textTransform: "none",
                "&:hover": { backgroundColor: "#164422" },
              }}
            >
              Send for Approval
            </Button> */}
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                fontSize: "clamp(0.65rem, 1.8vw, 0.8rem)",
                textTransform: "none",
              }}
            >
              Close
            </Button>
          </Box>
        </Box>
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={snackbarOpen}
          autoHideDuration={3500}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </>
    </Modal>
  );
};

export default GuestCreditTrackResult;
