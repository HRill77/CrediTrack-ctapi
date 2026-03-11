import React from "react";
import { Modal, Box, Typography, Button } from "@mui/material";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import CrediTrackResultTable, {
  CREDIT_TRACK_COLUMNS,
  CREDIT_TRACK_DATA,
} from "./CrediTrackResultTable";

interface Course {
  subjectCode: string;
  courseName: string;
  units: number;
  creditedUnits: number;
  grade: number;
  remarks: string;
  confidenceScore: number;
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
}) => {
  /* ==============================
     TRANSFORM DATA
  ============================== */

  const transformEvaluationData = (evalData: any[]): Section[] => {
    if (!evalData || evalData.length === 0) return CREDIT_TRACK_DATA;

    const grouped: Record<string, Section> = {};

    evalData.forEach((item) => {
      // Skip items without curricula data
      if (!item.curricula) return;

      const key = `${item.curricula.year}|${item.curricula.semester}`;

      if (!grouped[key]) {
        grouped[key] = {
          year: item.curricula.year,
          semester: item.curricula.semester,
          courses: [],
        };
      }

      grouped[key].courses.push({
        subjectCode: item.transcript?.subjectCode || "N/A",
        courseName: item.transcript?.courseName || "N/A",
        units: item.curricula?.units || 0,
        creditedUnits: item.finalApproved ? item.curricula?.units || 0 : 0,
        grade: item.transcript?.grade || "N/A",
        remarks: item.remarks || "N/A",
        confidenceScore: Math.round(item.confidenceScore || 0),
      });
    });

    const sortedData = Object.values(grouped).sort((a: any, b: any) => {
      // Convert "First Year" to 1, "Second Year" to 2, etc.
      const yearOrder: any = { First: 1, Second: 2, Third: 3, Fourth: 4 };
      const semesterOrder: any = { First: 1, Second: 2 };

      const yearAText = a.year.split(" ")[0]; // Extract "First" from "First Year"
      const yearBText = b.year.split(" ")[0]; // Extract "Second" from "Second Year"

      const yearA = yearOrder[yearAText] || 0;
      const yearB = yearOrder[yearBText] || 0;

      // If years are different, sort by year
      if (yearA !== yearB) {
        return yearA - yearB;
      }

      // If years are same, sort by semester
      const semesterAText = a.semester.split(" ")[0]; // Extract "First" from "First Semester"
      const semesterBText = b.semester.split(" ")[0]; // Extract "Second" from "Second Semester"

      return (
        (semesterOrder[semesterAText] || 0) -
        (semesterOrder[semesterBText] || 0)
      );
    });

    return sortedData;
  };

  const displayData: Section[] =
    evaluationData.length > 0
      ? transformEvaluationData(evaluationData)
      : CREDIT_TRACK_DATA;
  console.log("Display Data", evaluationData);
  /* ==============================
     CALCULATIONS
  ============================== */

  const calculateUnits = () => {
    let totalUnits = 0;
    let totalCredited = 0;

    displayData.forEach((section) => {
      section.courses.forEach((course) => {
        totalUnits += course.units;
        totalCredited += course.creditedUnits;
      });
    });

    return { totalUnits, totalCredited };
  };

  const { totalUnits, totalCredited } = calculateUnits();

  const calculateGraduationYear = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0 = Jan

    // If before June, still previous academic year
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

  const graduationYear = calculateGraduationYear();

  /* ==============================
     PROFESSIONAL PDF GENERATOR
  ============================== */

  const handleDownloadPDF = () => {
    const doc = new jsPDF("landscape", "mm", "a4");

    // Define consistent margins (20mm all sides)
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let startY = margin;

    // Title
    doc.setFontSize(14);
    doc.setTextColor(6, 79, 30);
    doc.text("CrediTrack Results", margin, startY);
    startY += 10;

    // Student Info
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

    // Transfer Details
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

    // Prepare Table
    const tableRows: RowInput[] = [];

    displayData.forEach((section) => {
      tableRows.push([
        {
          content: `${section.year}, ${section.semester}`,
          colSpan: 7,
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        },
      ]);

      section.courses.forEach((course) => {
        const isInvalid =
          course.remarks === "Insufficient units" ||
          course.remarks === "Failed grade" ||
          course.remarks === "Course mismatch";

        tableRows.push([
          {
            content: course.subjectCode,
            styles: { textColor: isInvalid ? [204, 0, 0] : [0, 0, 0] },
          },
          {
            content: course.courseName,
            styles: { textColor: isInvalid ? [204, 0, 0] : [0, 0, 0] },
          },
          {
            content: course.units,
            styles: { textColor: isInvalid ? [204, 0, 0] : [0, 0, 0] },
          },
          {
            content: course.creditedUnits,
            styles: { textColor: isInvalid ? [204, 0, 0] : [0, 0, 0] },
          },
          {
            content: course.grade,
            styles: { textColor: isInvalid ? [204, 0, 0] : [0, 0, 0] },
          },
          {
            content: course.remarks,
            styles: { textColor: isInvalid ? [204, 0, 0] : [0, 0, 0] },
          },
          {
            content: course.confidenceScore,
            styles: { textColor: isInvalid ? [204, 0, 0] : [0, 0, 0] },
          },
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
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [6, 79, 30],
        textColor: 255,
      },
      columnStyles: {
        2: { halign: "center" }, // Units
        3: { halign: "center" }, // Credited
        4: { halign: "center" }, // Grade
        6: { halign: "center" }, // Confidence
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;

    // Summary Footer - Right aligned
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
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 1200,
          bgcolor: "background.paper",
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "#064F1E", mb: 3 }}
        >
          CrediTrack Results
        </Typography>

        <CrediTrackResultTable
          columns={CREDIT_TRACK_COLUMNS}
          data={displayData}
        />

        <Box sx={{ mt: 3 }}>
          <Typography>
            <strong>Units Credited:</strong> {totalCredited}/{totalUnits}
          </Typography>

          <Typography>
            <strong>Expected Year of Graduation:</strong> {graduationYear}
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 4,
            display: "flex",
            gap: 2,
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            onClick={handleDownloadPDF}
            sx={{ backgroundColor: "#064F1E" }}
          >
            Download PDF
          </Button>

          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default GuestCreditTrackResult;
