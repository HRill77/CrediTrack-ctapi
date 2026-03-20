import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  DataGridPro,
  GridSortDirection,
  GridColDef,
  GRID_CHECKBOX_SELECTION_COL_DEF,
  GridRowSelectionModel,
} from "@mui/x-data-grid-pro";
import {
  Paper,
  Box,
  Tooltip,
  Button,
  InputBase,
  Divider,
  IconButton,
  Typography,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import { EvaluationInterface } from "../../shared/interface/EvaluationInterface";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EmailIcon from "@mui/icons-material/Email";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import { useEvaluationFilters } from "../../shared/utils/useEvalFilters";
import {
  useGetEvaluationQueries,
  useSearchTranscriptEvaluations,
} from "../../shared/services/Queries/EvalQueries";
import { AuthContext } from "../../shared/context/AuthContext";
import ConfirmDialog from "../../shared/component/ConfirmDialog";
import CustomSnackbar from "../../shared/component/CustomSnackbar";
import EvaluationDetailModal from "./EvaluationDetailModal";
import WhiteListService from "../../shared/services/WhiteListService";
import EvaluationEmailService from "../../shared/services/EvaluationEmailService";

const EvaluationTable = () => {
  const { isAuthLoading, currentUser } = useContext(AuthContext);

  const [rows, setRows] = useState<EvaluationInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [openAddEvaluationModal, setOpenAddEvaluationModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStudentEvaluations, setSelectedStudentEvaluations] = useState<
    any[]
  >([]);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<any>(null);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<number | "">("");
  const [whitelistedEmails, setWhitelistedEmails] = useState<any[]>([]);
  const [selectedStudentIdForEmail, setSelectedStudentIdForEmail] = useState<
    string | null
  >(null);
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({
      type: "include",
      ids: new Set(),
    });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [bulkSendMode, setBulkSendMode] = useState(false);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    rowId: string,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(rowId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  const { filters, updateFilters, batchUpdateFilters } = useEvaluationFilters();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [totalElements, setTotalElements] = useState(0);

  const [paginationModel, setPaginationModel] = useState({
    page: filters.page || 0,
    pageSize:
      filters.pageSize && filters.pageSize >= 10 ? filters.pageSize : 10,
  });

  const [fullStudentsData, setFullStudentsData] = useState<any[]>([]);

  useEffect(() => {
    batchUpdateFilters({
      pageSize: paginationModel.pageSize,
      page: paginationModel.page,
    });
  }, [paginationModel.pageSize, paginationModel.page]);

  const { data, isLoading, error, refetch } = useSearchTranscriptEvaluations(
    filters,
    paginationModel.pageSize,
    paginationModel.page,
  );

  useEffect(() => {
    if (data) {
      const isProgramHead = currentUser?.role === "ROLE_PROGRAM_HEAD";
      const programFilter = currentUser?.program;

      const filteredRows =
        isProgramHead && programFilter
          ? [...data.rows.filter((row: any) => row.toProgram === programFilter)]
          : [...data.rows];

      const filteredFullStudents =
        isProgramHead && programFilter
          ? [
              ...data.fullStudentsData.filter(
                (student: any) => student.toProgram === programFilter,
              ),
            ]
          : [...data.fullStudentsData];

      setRows(filteredRows);
      setFullStudentsData(filteredFullStudents);
      setTotalElements(filteredRows.length);
      setLoading(false);
    }
  }, [data, currentUser]);

  useEffect(() => {
    if (error) {
      console.error("Error fetching transcript evaluations:", error);
      setSnackbarMessage("Error loading evaluations");
      setSnackbarOpen(true);
    }
  }, [error]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  const updateSearchedText = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters("studentName", e.target.value);
    if (typingTimeout) clearTimeout(typingTimeout);
    const newTimeout = setTimeout(() => {
      refetch();
    }, 300);
    setTypingTimeout(newTimeout);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter")
      setTimeout(() => {
        refetch();
      }, 300);
  };

  const handleClearSort = () => {
    batchUpdateFilters({ sortField: [], sortDirection: [] });
  };

  const sortModel = useMemo(() => {
    if (!Array.isArray(filters.sortField) || filters.sortField.length === 0)
      return [];
    return filters.sortField.map((field: string, i: number) => ({
      field,
      sort: (filters.sortDirection[i] || "asc") as GridSortDirection,
    }));
  }, [filters.sortField, filters.sortDirection]);

  const handleDownloadPDF = (studentId: string) => {
    const studentData = fullStudentsData.find(
      (s) => String(s.studentId) === String(studentId),
    );
    if (!studentData) return;
    const doc = new jsPDF("landscape", "mm", "a4");
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let startY = margin;

    const pdfFirstName =
      studentData.firstName ||
      (studentData.studentName?.split(",")[1] || "").trim() ||
      "";
    const pdfLastName =
      studentData.lastName ||
      (studentData.studentName?.split(",")[0] || "").trim() ||
      "";

    doc.setFontSize(14);
    doc.setTextColor(6, 79, 30);
    doc.text("CrediTrack Evaluation Results", margin, startY);
    startY += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Name: ${pdfLastName}${pdfFirstName ? `, ${pdfFirstName}` : ""}`,
      margin,
      startY,
    );
    startY += 6;
    doc.text(
      `Email: ${studentData.studentEmail || studentData.email || "N/A"}`,
      margin,
      startY,
    );
    startY += 6;
    doc.text(`Year Level: ${studentData.yearLevel || "N/A"}`, margin, startY);
    startY += 8;
    doc.setFontSize(12);
    doc.setTextColor(6, 79, 30);
    doc.text("Transfer Details", margin, startY);
    startY += 6;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `From: ${studentData.fromUniversity || "N/A"} - ${studentData.fromProgram || "N/A"}`,
      margin,
      startY,
    );
    startY += 6;
    doc.text(
      `To: ${studentData.toUniversity || "Wesleyan University"} - ${studentData.toProgram || "N/A"}`,
      margin,
      startY,
    );
    startY += 8;

    const tableRows: RowInput[] = [];
    const evaluations = studentData.evaluation || [];

    if (evaluations.length === 0) {
      tableRows.push([
        {
          content: "No evaluation records found",
          colSpan: 7,
          styles: { textColor: [204, 0, 0] as [number, number, number] },
        },
      ]);
    } else {
      const grouped: Record<string, any[]> = {};
      evaluations.forEach((evaluation: any) => {
        const key = `${evaluation.curricula?.year}|${evaluation.curricula?.semester}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(evaluation);
      });
      const yearOrder: any = { First: 1, Second: 2, Third: 3, Fourth: 4 };
      const semesterOrder: any = { First: 1, Second: 2 };
      const sortedGroups = Object.entries(grouped).sort((a, b) => {
        const [yearA, semA] = a[0].split("|");
        const [yearB, semB] = b[0].split("|");
        const yA = yearOrder[yearA.split(" ")[0]] || 0;
        const yB = yearOrder[yearB.split(" ")[0]] || 0;
        if (yA !== yB) return yA - yB;
        return (
          (semesterOrder[semA.split(" ")[0]] || 0) -
          (semesterOrder[semB.split(" ")[0]] || 0)
        );
      });
      sortedGroups.forEach(([key, evalList]) => {
        const [year, semester] = key.split("|");
        tableRows.push([
          {
            content: `${year}, ${semester}`,
            colSpan: 7,
            styles: {
              fontStyle: "bold",
              fillColor: [240, 240, 240] as [number, number, number],
            },
          },
        ]);
        evalList.forEach((evaluation: any) => {
          const isInvalid = [
            "Insufficient units",
            "Failed grade",
            "Course mismatch",
          ].includes(evaluation.remarks);
          const color: [number, number, number] = isInvalid
            ? [204, 0, 0]
            : [0, 0, 0];
          tableRows.push([
            {
              content: evaluation.transcript.subjectCode,
              styles: { textColor: color },
            },
            {
              content: evaluation.transcript.courseName,
              styles: { textColor: color },
            },
            {
              content: evaluation.curricula?.units || 0,
              styles: { textColor: color },
            },
            {
              content: evaluation.finalApproved
                ? evaluation.curricula?.units || 0
                : 0,
              styles: { textColor: color },
            },
            {
              content: evaluation.transcript.grade,
              styles: { textColor: color },
            },
            {
              content: evaluation.remarks || "N/A",
              styles: { textColor: color },
            },
            {
              content: Math.round(evaluation.confidenceScore),
              styles: { textColor: color },
            },
          ]);
        });
      });
    }

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
          "Confidence %",
        ],
      ],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 1.5 },
      headStyles: { fillColor: [6, 79, 30], textColor: 255 },
      columnStyles: {
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
        6: { halign: "center" },
      },
    });

    const footerBlockHeight = 18;
    const minSpacing = 8;
    const normalSpacing = 15;
    let tableEndY = (doc as any).lastAutoTable.finalY;
    let availableSpace = pageHeight - margin - tableEndY;
    let footerSpacing =
      availableSpace >= footerBlockHeight + normalSpacing
        ? normalSpacing
        : minSpacing;
    let footerBaseY = tableEndY + footerSpacing;
    if (footerBaseY + footerBlockHeight > pageHeight - margin) {
      doc.addPage();
      footerBaseY = margin;
    }

    let totalUnits = 0;
    let totalCredited = 0;
    evaluations.forEach((evaluation: any) => {
      const units = evaluation.curricula?.units || 0;
      totalUnits += units;
      if (evaluation.finalApproved) totalCredited += units;
    });

    const calculateGraduationYear = () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const academicStartYear =
        currentMonth < 5 ? currentYear - 1 : currentYear;
      const graduationStartYear = academicStartYear + 3;
      return `A.Y ${graduationStartYear}-${graduationStartYear + 1}`;
    };

    doc.setFontSize(11);
    doc.setTextColor(6, 79, 30);
    doc.text(
      `Units Credited: ${totalCredited}/${totalUnits}`,
      pageWidth - margin,
      footerBaseY,
      {
        align: "right",
      },
    );
    doc.text(
      `Expected Year of Graduation: ${calculateGraduationYear()}`,
      pageWidth - margin,
      footerBaseY + 6,
      { align: "right" },
    );

    const approvalDate =
      studentData.approvedDate ||
      studentData.approvals?.approvedDate ||
      studentData.createdAt ||
      null;
    const signatureName = currentUser?.fullName || "Program Head";
    doc.setFontSize(11);
    if (approvalDate) {
      doc.setTextColor(204, 0, 0);
      doc.text("sgd.", margin, footerBaseY);
      doc.setTextColor(0, 0, 0);
      doc.text(signatureName, margin, footerBaseY + 6);
      doc.text("Program Head", margin, footerBaseY + 10);
      doc.text(
        new Date(approvalDate).toISOString().split("T")[0],
        margin,
        footerBaseY + 14,
      );
    } else {
      doc.setTextColor(0, 0, 0);
      doc.text("_________________________", margin, footerBaseY);
      doc.text(signatureName, margin, footerBaseY + 8);
      doc.text("Program Head", margin, footerBaseY + 12);
    }

    doc.save(
      `${studentData.lastName}, ${studentData.firstName} - Evaluation_Results.pdf`,
    );
    setSnackbarMessage("PDF downloaded successfully.");
    setSnackbarOpen(true);
  };

  const handleViewEdit = (studentId: string) => {
    const studentData = fullStudentsData.find(
      (s) => String(s.studentId) === String(studentId),
    );
    if (studentData) {
      setSelectedStudentInfo(studentData);
      setSelectedStudentEvaluations(studentData.evaluation || []);
      setDetailModalOpen(true);
    }
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedStudentEvaluations([]);
    setSelectedStudentInfo(null);
  };

  const handleResendEmail = async (studentId: string, studentEmail: string) => {
    setSelectedStudentIdForEmail(studentId);
    setSelectedEmailId("");
    setBulkSendMode(false);
    setSendEmailModalOpen(true);
    try {
      const response = await WhiteListService.getAllActiveWhitelisting();
      setWhitelistedEmails(response.data || []);
    } catch (error) {
      console.error("Error fetching whitelisted emails:", error);
      setSnackbarMessage("Error loading whitelisted emails.");
      setSnackbarOpen(true);
    }
  };

  const handleBulkSendEmail = async () => {
    const selectedIdsArray = Array.from(rowSelectionModel.ids);
    if (selectedIdsArray.length === 0) {
      setSnackbarMessage("Please select at least one student.");
      setSnackbarOpen(true);
      return;
    }
    setBulkSendMode(true);
    setSendEmailModalOpen(true);
    try {
      const response = await WhiteListService.getAllActiveWhitelisting();
      setWhitelistedEmails(response.data || []);
    } catch (error) {
      console.error("Error fetching whitelisted emails:", error);
      setSnackbarMessage("Error loading whitelisted emails.");
      setSnackbarOpen(true);
    }
  };

  const handleSendEmailConfirm = async () => {
    if (!selectedEmailId) {
      setSnackbarMessage("Please select an email.");
      setSnackbarOpen(true);
      return;
    }
    try {
      setSendingEmail(true);
      const selectedEmail = whitelistedEmails.find(
        (e) => e.id === selectedEmailId,
      );
      if (!selectedEmail) {
        setSnackbarMessage("Selected email not found.");
        setSnackbarOpen(true);
        return;
      }
      const studentIds = bulkSendMode
        ? Array.from(rowSelectionModel.ids).map((id) => parseInt(String(id)))
        : [parseInt(selectedStudentIdForEmail || "0")];
      await EvaluationEmailService.sendEvaluationEmail(
        studentIds,
        selectedEmail.email,
        currentUser?.id,
      );
      setSnackbarMessage(
        `Email sent successfully to ${studentIds.length} student(s).`,
      );
      setSnackbarOpen(true);
      setSendEmailModalOpen(false);
      setRowSelectionModel({ type: "include", ids: new Set() });
    } catch (error) {
      console.error("Error sending email:", error);
      setSnackbarMessage("Error sending email.");
      setSnackbarOpen(true);
    } finally {
      setSendingEmail(false);
    }
  };

  const columns: GridColDef<any>[] = [
    { ...GRID_CHECKBOX_SELECTION_COL_DEF, disableColumnMenu: true },
    {
      field: "studentId",
      headerName: "ID",
      flex: 0.8,
      headerAlign: "center",
      align: "center",
      minWidth: 80,
      filterable: false,
      pinnable: false,
    },
    {
      field: "studentName",
      headerName: "Student Name",
      flex: 1.5,
      minWidth: 180,
      valueFormatter: (value: any) => value ?? "",
    },
    {
      field: "fromUniversity",
      headerName: "From University",
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: "fromProgram",
      headerName: "From Program",
      flex: 1.2,
      minWidth: 200,
    },
    { field: "toProgram", headerName: "To Program", flex: 1.2, minWidth: 150 },
    {
      field: "createdAt",
      headerName: "Date",
      flex: 1,
      minWidth: 180,
      valueFormatter: (value: any) =>
        value
          ? new Date(value).toLocaleDateString("en-US", {
              month: "long",
              day: "2-digit",
              year: "numeric",
            })
          : "",
    },
    {
      field: "approvedDate",
      headerName: "Approved Date",
      flex: 1,
      minWidth: 180,
      valueFormatter: (value: any) =>
        value
          ? new Date(value).toLocaleDateString("en-US", {
              month: "long",
              day: "2-digit",
              year: "numeric",
            })
          : "",
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.2,
      minWidth: 150,
      sortable: false,
      align: "center" as const,
      headerAlign: "center" as const,
      renderCell: (params: any) => (
        <Tooltip title="More options">
          <div>
            <IconButton
              id={`action-button-${params.row.studentId}`}
              onClick={(e) => handleMenuOpen(e, params.row.studentId)}
              size="small"
              sx={{ color: "#064f1e" }}
            >
              <SettingsIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={selectedRowId === params.row.studentId}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
              <MenuItem
                onClick={() => {
                  handleDownloadPDF(params.row.studentId);
                  handleMenuClose();
                }}
                sx={{ display: "flex", gap: 1 }}
              >
                <PictureAsPdfIcon
                  sx={{ color: "rgba(6, 79, 30, 1)", fontSize: "20px" }}
                />
                <span style={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}>
                  Download PDF
                </span>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleViewEdit(params.row.studentId);
                  handleMenuClose();
                }}
                sx={{ display: "flex", gap: 1 }}
              >
                <EditIcon
                  sx={{ color: "rgba(6, 79, 30, 1)", fontSize: "20px" }}
                />
                <span style={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}>
                  View & Approve
                </span>
              </MenuItem>
              {params.row.approvedDate && (
                <MenuItem
                  onClick={() => {
                    handleResendEmail(
                      params.row.studentId,
                      params.row.studentEmail,
                    );
                    handleMenuClose();
                  }}
                  sx={{ display: "flex", gap: 1 }}
                >
                  <EmailIcon
                    sx={{ color: "rgba(6, 79, 30, 1)", fontSize: "20px" }}
                  />
                  <span style={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}>
                    Send To Email
                  </span>
                </MenuItem>
              )}
            </Menu>
          </div>
        </Tooltip>
      ),
    },
  ];

  const PAGE_SIZE_OPTIONS = [10, 25, 30, 50];

  return (
    <>
      <Box className="user-management-header">
        <Typography
          variant="h6"
          sx={{ color: "#064F1E", fontSize: "clamp(0.9rem, 2.5vw, 1.25rem)" }}
        >
          Recent Evaluation
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            color: "#494b4aff",
            fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
          }}
        >
          Track all evaluated transfer students.
        </Typography>
      </Box>

      <Box
        sx={{
          backgroundColor: "#fff",
          borderRadius: "15px",
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
          padding: { xs: "16px", sm: "24px", md: "30px" },
        }}
      >
        {/* TOOLBAR */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Tooltip title="Clear Sort">
              <Button
                variant="contained"
                className="add-user-button"
                sx={{
                  height: 36,
                  minWidth: 36,
                  padding: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onClick={handleClearSort}
              >
                <FilterAltOffIcon fontSize="small" />
              </Button>
            </Tooltip>
            {rowSelectionModel.ids.size > 0 && (
              <Button
                variant="contained"
                sx={{
                  height: "36px",
                  backgroundColor: "#064F1E",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 500,
                  borderRadius: "8px",
                  px: 2,
                  fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
                  "&:hover": { backgroundColor: "#053A16" },
                }}
                onClick={handleBulkSendEmail}
                startIcon={<EmailIcon />}
              >
                Send Email ({rowSelectionModel.ids.size})
              </Button>
            )}
          </Box>

          {/* SEARCH */}
          <Paper
            component="form"
            sx={{
              p: "2px 4px",
              display: "flex",
              alignItems: "center",
              width: { xs: "100%", sm: 300, md: 400 },
            }}
          >
            <InputBase
              sx={{
                ml: 1,
                flex: 1,
                height: "10px",
                fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
              }}
              placeholder="Search Student"
              inputProps={{ "aria-label": "search student" }}
              value={filters.studentName || ""}
              onChange={updateSearchedText}
              onKeyDown={handleKeyDown}
            />
            <Divider sx={{ height: 15, m: 0.5 }} orientation="vertical" />
            <IconButton
              type="button"
              sx={{ p: "10px", height: "15px" }}
              aria-label="search"
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          </Paper>
        </Box>

        {/* DATA GRID */}
        <Box sx={{ width: "100%", height: 500, overflow: "auto" }}>
          <Paper
            sx={{ width: "100%", overflow: "hidden" }}
            square={false}
            elevation={0}
          >
            <DataGridPro
              rows={rows}
              columns={columns}
              rowCount={totalElements}
              loading={loading}
              getRowId={(row: any) => row.studentId}
              multipleColumnsSortingMode="always"
              density="compact"
              paginationMode="server"
              filterMode="server"
              sortingMode="server"
              sortingOrder={["asc", "desc"]}
              pagination
              checkboxSelection
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              paginationModel={paginationModel}
              onPaginationModelChange={(model) => {
                const safePageSize = PAGE_SIZE_OPTIONS.includes(model.pageSize)
                  ? model.pageSize
                  : 10;
                setPaginationModel({
                  page: model.page,
                  pageSize: safePageSize,
                });
              }}
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={(newModel) =>
                setRowSelectionModel(newModel)
              }
              isRowSelectable={(params: any) => !!params?.row?.approvedDate}
              initialState={{
                pinnedColumns: {
                  left: [
                    GRID_CHECKBOX_SELECTION_COL_DEF.field,
                    "studentId",
                    "studentName",
                  ],
                  right: ["actions"],
                },
              }}
              disableRowSelectionOnClick={false}
              sortModel={sortModel}
              onSortModelChange={(newSortModel) => {
                batchUpdateFilters({
                  sortField: newSortModel.map((m) => m.field),
                  sortDirection: newSortModel.map((m) => m.sort ?? "asc"),
                });
                setPaginationModel((prev: any) => ({ ...prev, page: 0 }));
              }}
              sx={{
                "& .MuiDataGrid-columnHeader": {
                  borderBottom: "0.3px solid #e0e0e0",
                  backgroundColor: "#f5f5f5",
                  fontWeight: "bold",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontSize: "clamp(0.7rem, 1.5vw, 0.875rem)",
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid #f0f0f0",
                  fontSize: "clamp(0.65rem, 1.5vw, 0.8rem)",
                },
                height: 500,
                borderRadius: 5,
                "& .MuiDataGrid-root": { border: "none" },
              }}
            />
          </Paper>
        </Box>
      </Box>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%", fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <EvaluationDetailModal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        studentInfo={selectedStudentInfo}
        evaluations={selectedStudentEvaluations}
        onSave={(updatedEvaluations) => {
          setSnackbarMessage("Evaluations updated successfully.");
          setSnackbarOpen(true);
        }}
      />

      {/* SEND EMAIL DIALOG */}
      <Dialog
        open={sendEmailModalOpen}
        onClose={() => {
          setSendEmailModalOpen(false);
          setSelectedEmailId("");
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: "clamp(0.9rem, 2.5vw, 1.25rem)" }}>
          {bulkSendMode
            ? `Send Evaluation to ${rowSelectionModel.ids.size} Student(s)`
            : "Send Evaluation via Email"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: "#666",
              mb: 2,
              fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
            }}
          >
            {bulkSendMode
              ? `You are about to send evaluations to ${rowSelectionModel.ids.size} selected student(s). Select the email address to use.`
              : "Select the email address to send this evaluation to."}
          </Typography>
          <FormControl fullWidth>
            <InputLabel sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}>
              Select Email
            </InputLabel>
            <Select
              value={selectedEmailId}
              onChange={(e) => setSelectedEmailId(e.target.value as number)}
              label="Select Email"
              sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
            >
              {whitelistedEmails.map((email) => (
                <MenuItem
                  key={email.id}
                  value={email.id}
                  sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
                >
                  {email.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSendEmailModalOpen(false);
              setSelectedEmailId("");
            }}
            sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmailConfirm}
            variant="contained"
            disabled={sendingEmail}
            sx={{
              backgroundColor: "#064F1E",
              fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
            }}
          >
            {sendingEmail ? "Sending..." : "Send"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EvaluationTable;
