import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import { DataGridPro, GridColDef } from "@mui/x-data-grid-pro";
import { TranscriptRow } from "../../shared/interface/TranscriptRow";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface Props {
  initialRows: TranscriptRow[];
  onRowsChange?: (rows: TranscriptRow[]) => void;
  isProcessed?: boolean; // ← add this prop
}

const TranscriptGrid: React.FC<Props> = ({
  initialRows,
  onRowsChange,
  isProcessed = false,
}) => {
  const [rows, setRows] = useState<TranscriptRow[]>(initialRows);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<{
    rowId: string | null;
    message: string | null;
  }>({ rowId: null, message: null });
  const [creditsError, setCreditsError] = useState<{
    rowId: string | null;
    message: string | null;
  }>({ rowId: null, message: null });

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const isValidGrade = (value: string): boolean => {
    if (!value) return true;
    const trimmedValue = value.trim();
    const intPattern = /^\d+$/;
    if (intPattern.test(trimmedValue)) {
      const num = parseInt(trimmedValue);
      return num >= 10 && num <= 99;
    }
    const decimalPattern = /^\d+\.\d{1,2}$/;
    if (decimalPattern.test(trimmedValue)) {
      const num = parseFloat(trimmedValue);
      return num >= 1.0 && num <= 5.0;
    }
    return false;
  };

  const isValidCredits = (value: string): boolean => {
    if (!value) return true;
    const trimmedValue = value.trim();
    const intPattern = /^\d+$/;
    if (intPattern.test(trimmedValue)) {
      const num = parseInt(trimmedValue);
      return num >= 0;
    }
    return false;
  };

  const handleRowsUpdate = (newRows: TranscriptRow[]) => {
    setRows(newRows);
    onRowsChange?.(newRows);
  };

  const handleAddRow = () => {
    if (!isProcessed) return;
    const maxId =
      rows.length > 0 ? Math.max(...rows.map((r) => parseInt(r.id))) : 0;
    const newRow: TranscriptRow = {
      id: String(maxId + 1),
      year: "",
      subject: "",
      name: "",
      grade: "",
      credits: "",
    };
    handleRowsUpdate([...rows, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    setRowToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (rowToDelete) {
      handleRowsUpdate(rows.filter((r) => r.id !== rowToDelete));
    }
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  const handleDeleteAll = () => {
    handleRowsUpdate([]);
  };

  const cellFontSx = { fontSize: "clamp(0.6rem, 1.5vw, 0.8rem)" };

  const actionColumn: GridColDef = {
    field: "actions",
    headerName: "Actions",
    width: 80,
    headerAlign: "center",
    align: "center",
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Tooltip title="Delete Row">
        <IconButton
          size="small"
          onClick={() => handleDeleteRow(params.row.id)}
          sx={{ color: "#f44336", "&:hover": { backgroundColor: "#ffebee" } }}
        >
          <DeleteIcon sx={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)" }} />
        </IconButton>
      </Tooltip>
    ),
  };

  const columns: GridColDef[] = [
    {
      field: "year",
      headerName: "Year",
      flex: 0.8,
      minWidth: 90,
      editable: true,
      renderCell: (params) => <span style={cellFontSx}>{params.value}</span>,
    },
    {
      field: "subject",
      headerName: "Subject",
      flex: 1,
      minWidth: 75,
      editable: true,
      renderCell: (params) => <span style={cellFontSx}>{params.value}</span>,
    },
    {
      field: "name",
      headerName: "Course Name",
      flex: 2,
      minWidth: 120,
      editable: true,
      renderCell: (params) => <span style={cellFontSx}>{params.value}</span>,
    },
    {
      field: "grade",
      headerName: "Grade",
      flex: 0.7,
      minWidth: 60,
      headerAlign: "center",
      align: "center",
      editable: true,
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            ...cellFontSx,
            ...(gradeError.rowId === params.row.id && {
              border: "2px solid #f44336",
              backgroundColor: "#ffebee",
              borderRadius: 1,
            }),
          }}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: "credits",
      headerName: "Credits",
      flex: 0.7,
      minWidth: 60,
      headerAlign: "center",
      align: "center",
      editable: true,
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            ...cellFontSx,
            ...(creditsError.rowId === params.row.id && {
              border: "2px solid #f44336",
              backgroundColor: "#ffebee",
              borderRadius: 1,
            }),
          }}
        >
          {params.value}
        </Box>
      ),
    },
    actionColumn,
  ];

  return (
    <>
      {/* Instruction banner — only shown after processing */}
      {isProcessed && (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            mb: 2,
            p: 1.5,
            backgroundColor: "#fff8e1",
            borderRadius: 2,
            border: "1px solid #ffe082",
          }}
        >
          <InfoOutlinedIcon
            sx={{ color: "#f9a825", fontSize: "1.1rem", mt: "2px" }}
          />
          <Typography
            sx={{
              fontSize: "clamp(0.65rem, 1.5vw, 0.78rem)",
              color: "#5d4037",
            }}
          >
            Please double-check the courses below. AI can make mistakes — use{" "}
            <strong>Add Row</strong> to manually add any missing courses, and{" "}
            <strong>double-click</strong> a cell to edit its value.
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          gap: 1,
          mb: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Add Row button — grayed out if not processed */}
        <Tooltip
          title={
            !isProcessed ? "You need to click Process first" : "Add New Row"
          }
          arrow
        >
          <span>
            {" "}
            {/* span wrapper needed for Tooltip to work on disabled button */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddRow}
              size="small"
              disabled={!isProcessed}
              sx={{
                backgroundColor: isProcessed ? "#064F1E" : "#bdbdbd",
                color: "#fff",
                textTransform: "none",
                fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
                "&:hover": {
                  backgroundColor: isProcessed ? "#053a16" : "#bdbdbd",
                },
                "&.Mui-disabled": {
                  backgroundColor: "#bdbdbd",
                  color: "#fff",
                },
              }}
            >
              Add Row
            </Button>
          </span>
        </Tooltip>

        {rows.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteAll}
            size="small"
            sx={{
              textTransform: "none",
              fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
            }}
          >
            Delete All
          </Button>
        )}

        {!isProcessed && rows.length === 0 && (
          <Typography
            variant="caption"
            sx={{ color: "#999", fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)" }}
          >
            Click "Process" first to proceed for manual entry.
          </Typography>
        )}
      </Box>

      {gradeError.message && (
        <Box sx={{ mb: 1 }}>
          <Alert
            severity="warning"
            sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
          >
            {gradeError.message}
          </Alert>
        </Box>
      )}

      {creditsError.message && (
        <Box sx={{ mb: 1 }}>
          <Alert
            severity="warning"
            sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
          >
            {creditsError.message}
          </Alert>
        </Box>
      )}

      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <DataGridPro
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          rowSelection={false}
          multipleColumnsSortingMode="always"
          density="compact"
          processRowUpdate={(newRow) => {
            if (newRow.grade) {
              const trimmedGrade = newRow.grade.trim();
              const singleDigitPattern = /^[1-5]$/;
              if (singleDigitPattern.test(trimmedGrade)) {
                newRow.grade = `${trimmedGrade}.00`;
              }
              const oneDecimalPattern = /^\d+\.\d{1}$/;
              if (oneDecimalPattern.test(trimmedGrade)) {
                newRow.grade = `${trimmedGrade}0`;
              }
            }
            if (newRow.grade && !isValidGrade(newRow.grade)) {
              setGradeError({
                rowId: newRow.id,
                message: `Invalid grade format. Please check the highlighted row.`,
              });
              return rows.find((r) => r.id === newRow.id) || newRow;
            }
            setGradeError({ rowId: null, message: null });
            if (newRow.credits && !isValidCredits(newRow.credits)) {
              setCreditsError({
                rowId: newRow.id,
                message: `Credits must be a positive number only. No letters, special characters, or negative numbers allowed.`,
              });
              return rows.find((r) => r.id === newRow.id) || newRow;
            }
            setCreditsError({ rowId: null, message: null });
            const newRows = rows.map((r) => (r.id === newRow.id ? newRow : r));
            handleRowsUpdate(newRows);
            return newRow;
          }}
          sx={{
            "& .MuiDataGrid-columnHeader": {
              borderBottom: "0.3px solid #e0e0e0",
              backgroundColor: "#f5f5f5",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontSize: "clamp(0.65rem, 1.5vw, 0.8rem)",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #f0f0f0",
              fontSize: "clamp(0.6rem, 1.5vw, 0.8rem)",
            },
            minHeight: 300,
            maxHeight: 500,
            borderRadius: 2,
            "& .MuiDataGrid-root": { border: "none" },
          }}
        />
      </Box>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle sx={{ fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)" }}>
          Delete Row?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "clamp(0.75rem, 2vw, 0.9rem)" }}>
            Are you sure you want to delete this row? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TranscriptGrid;
