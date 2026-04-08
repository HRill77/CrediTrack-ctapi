import * as React from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Box } from "@mui/material";

export const CREDIT_TRACK_COLUMNS = [
  { id: "subjectCode", label: "Subject Code", minWidth: 80 },
  { id: "courseName", label: "Course Name", minWidth: 120 },
  { id: "units", label: "Units", minWidth: 30, align: "center" },
  { id: "creditedUnits", label: "Credited", minWidth: 30, align: "center" },
  { id: "grade", label: "Grade", minWidth: 30, align: "center" },
  { id: "remarks", label: "Remarks", minWidth: 120, align: "center" },
  {
    id: "confidenceScore",
    label: "Confidence Score",
    minWidth: 30,
    align: "center",
  },
];

export const CREDIT_TRACK_DATA = [
  {
    year: "First Year",
    semester: "First Semester",
    courses: [
      {
        subjectCode: "GES 1",
        courseName: "Chemistry for Engineering",
        units: 3,
        creditedUnits: 3,
        grade: 1.75,
        remarks: "Equivalent course found",
        confidenceScore: 85,
      },
      {
        subjectCode: "CPE 0",
        courseName: "Computer Engineering as a Discipline",
        units: 2,
        creditedUnits: 1,
        grade: 1.5,
        remarks: "Insufficient units",
        confidenceScore: 92,
      },
      {
        subjectCode: "PECC 1",
        courseName: "Computer Hardware and Troubleshooting",
        units: 1,
        creditedUnits: 1,
        grade: 1.0,
        remarks: "Equivalent course found",
        confidenceScore: 100,
      },
      {
        subjectCode: "PE 1",
        courseName: "Physical Fitness",
        units: 3,
        creditedUnits: 0,
        grade: 1.5,
        remarks: "Courses mismatch",
        confidenceScore: 72,
      },
    ],
  },
  {
    year: "First Year",
    semester: "Second Semester",
    courses: [
      {
        subjectCode: "CPE 2",
        courseName: "Object Oriented Programming",
        units: 2,
        creditedUnits: 2,
        grade: 1.75,
        remarks: "Equivalent course found",
        confidenceScore: 94,
      },
      {
        subjectCode: "GEC 3",
        courseName: "Mathematics in the Modern World",
        units: 3,
        creditedUnits: 3,
        grade: 3.0,
        remarks: "Failed grade",
        confidenceScore: 91,
      },
      {
        subjectCode: "PE 2",
        courseName: "Rhythmic Activities",
        units: 2,
        creditedUnits: 2,
        grade: 1.25,
        remarks: "Equivalent course found",
        confidenceScore: 88,
      },
      {
        subjectCode: "GEM 6",
        courseName: "Discrete Mathematics",
        units: 3,
        creditedUnits: 3,
        grade: 2.5,
        remarks: "Equivalent course found",
        confidenceScore: 85,
      },
      {
        subjectCode: "CE 2",
        courseName: "The Wesleyan Heartwarming Experience",
        units: 3,
        creditedUnits: 0,
        grade: 1.25,
        remarks: "Courses mismatch",
        confidenceScore: 99,
      },
    ],
  },
];

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: "right" | "center" | "left";
  format?: (value: any) => string;
}

interface CrediTrackResultTableProps {
  columns?: any[];
  data?: any;
}

const CrediTrackResultTable: React.FC<CrediTrackResultTableProps> = ({
  columns = CREDIT_TRACK_COLUMNS,
  data = CREDIT_TRACK_DATA,
}) => {

  const invalidRemarks = [
  "Insufficient units",
  "Failed grade",
  "Course mismatch",
  "Courses mismatch",
  "Low similarity",
  "No equivalent course found",
];

  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        padding: 1.5,
        borderRadius: 2,
        boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.2)",
      }}
    >
      <Paper sx={{ width: "100%", overflow: "visible" }}>
        <TableContainer
          sx={{ maxHeight: 500, overflowX: "auto", overflowY: "auto" }}
        >
          <Table stickyHeader aria-label="sticky table" size="small">
            <TableHead>
              <TableRow>
                {columns.map((column: Column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    sx={{
                      minWidth: column.minWidth,
                      fontWeight: 700,
                      textAlign: "center",
                      height: "30px",
                      padding: "10px 8px",
                      fontSize: "clamp(0.6rem, 1.5vw, 0.75rem)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((section: any, sectionIndex: number) => (
                <React.Fragment key={sectionIndex}>
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      sx={{
                        border: "none",
                        fontWeight: 700,
                        backgroundColor: "#ffffff",
                        height: "30px",
                        padding: "10px 3px 3px 3px",
                        fontSize: "clamp(0.6rem, 1.5vw, 0.75rem)",
                      }}
                    >
                      <p style={{ paddingLeft: "1em", margin: 0 }}>
                        {section.year}, {section.semester}
                      </p>
                    </TableCell>
                  </TableRow>
                  {section.courses.map((row: any, rowIndex: number) => {
                    const isInvalid = invalidRemarks.includes(row.remarks);
                    return (
                      <TableRow
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        key={`${sectionIndex}-${rowIndex}`}
                      >
                        {columns.map((column: Column) => {
                          const value = row[column.id];
                          return (
                            <TableCell
                              key={column.id}
                              align={column.align}
                              sx={{
                                border: "none",
                                height: "30px",
                                padding: "3px 8px",
                                fontSize: "clamp(0.55rem, 1.4vw, 0.72rem)",
                                color: isInvalid ? "#cc0000" : "inherit",
                              }}
                            >
                              <p
                                style={{
                                  paddingLeft: "1em",
                                  paddingRight: "1em",
                                  margin: 0,
                                }}
                              >
                                {column.format && typeof value === "number"
                                  ? column.format(value)
                                  : value}
                              </p>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default CrediTrackResultTable;
