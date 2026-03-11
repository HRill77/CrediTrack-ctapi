import React, { useState, useEffect } from "react";
import { Box, Typography, Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from "@mui/material";
import {
  DataGridPro,
  GridColDef,
  GridRowId,
} from "@mui/x-data-grid-pro";
import { TranscriptRow } from "../../shared/interface/TranscriptRow";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";


interface Props {
  initialRows: TranscriptRow[];
  onRowsChange?: (rows: TranscriptRow[]) => void;
}

const TranscriptGrid: React.FC<Props> = ({ initialRows, onRowsChange }) => {
  const [rows, setRows] = useState<TranscriptRow[]>(initialRows);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<{ rowId: string | null; message: string | null }>({ rowId: null, message: null });
  const [creditsError, setCreditsError] = useState<{ rowId: string | null; message: string | null }>({ rowId: null, message: null });

  // Sync rows when initialRows prop changes
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

 

  // Validate grade format: 10-99 or 1.00-5.00
  const isValidGrade = (value: string): boolean => {
    if (!value) return true; // Allow empty values
    
    const trimmedValue = value.trim();
    
    // Check for integer format (10-99)
    const intPattern = /^\d+$/;
    if (intPattern.test(trimmedValue)) {
      const num = parseInt(trimmedValue);
      return num >= 10 && num <= 99;
    }
    
    // Check for decimal format (1.00-5.00)
    const decimalPattern = /^\d+\.\d{1,2}$/;
    if (decimalPattern.test(trimmedValue)) {
      const num = parseFloat(trimmedValue);
      return num >= 1.00 && num <= 5.00;
    }
    
    return false;
  };

  // Validate credits: only positive integers
  const isValidCredits = (value: string): boolean => {
    if (!value) return true; // Allow empty values
    
    const trimmedValue = value.trim();
    
    // Only allow positive integers
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
    const maxId = rows.length > 0 ? Math.max(...rows.map(r => parseInt(r.id))) : 0;
    const newRow: TranscriptRow = {
      id: String(maxId + 1),
      year: "",
      subject: "",
      name: "",
      grade: "",
      credits: "",
    };
    const newRows = [...rows, newRow];
    handleRowsUpdate(newRows);
  };

  const handleDeleteRow = (id: string) => {
    setRowToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (rowToDelete) {
      const newRows = rows.filter(r => r.id !== rowToDelete);
      handleRowsUpdate(newRows);
    }
    setDeleteConfirmOpen(false);
    setRowToDelete(null);
  };

  const handleDeleteAll = () => {
    handleRowsUpdate([]);
  };

  const actionColumn: GridColDef = {
    field: "actions",
    headerName: "Actions",
    width: 80,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Tooltip title="Delete Row">
        <IconButton
          size="small"
          onClick={() => handleDeleteRow(params.row.id)}
          sx={{
            color: "#f44336",
            "&:hover": {
              backgroundColor: "#ffebee"
            }
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),
  };

  const columns: GridColDef[] = [
    { field: "year", headerName: "Year", width: 80, editable: true },
    { field: "subject", headerName: "Subject", width: 110, editable: true },
    { field: "name", headerName: "Course Name", flex: 1, editable: true },
    {
      field: "grade",
      headerName: "Grade",
      width: 90,
      editable: true,
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
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
      width: 90,
      editable: true,
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
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
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Tooltip title="Add New Row">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddRow}
            size="small"
            sx={{
              backgroundColor: "#064F1E",
              color: "#fff",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#053a16",
              },
            }}
          >
            Add Row
          </Button>
        </Tooltip>

        {rows.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteAll}
            size="small"
            sx={{
              textTransform: "none",
            }}
          >
            Delete All
          </Button>
        )}

        {rows.length === 0 && (
          <Typography variant="caption" sx={{ color: "#999", mt: 1 }}>
            No transcript data added yet. Click "Add Row" to start.
          </Typography>
        )}
      </Box>

      {gradeError.message && (
        <Box sx={{ mb: 1 }}>
          <Alert severity="warning">{gradeError.message}</Alert>
          {/* <Typography sx={{ color: '#fff', backgroundColor: '#f44336', borderRadius: 1, px: 2, py: 1, fontWeight: 'bold', border: '1px solid #d32f2f' }}>
            {gradeError.message}
          </Typography> */}
        </Box>
      )}

      {creditsError.message && (
        <Box sx={{ mb: 1 }}>
          <Alert severity="warning">{creditsError.message}</Alert>
        </Box>
      )}

      <DataGridPro
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        rowSelection={false}
        multipleColumnsSortingMode="always"
        density="compact"
        // sortingOrder={["asc", "desc"]}8
        processRowUpdate={(newRow) => {
          // Auto-format grades
          if (newRow.grade) {
            const trimmedGrade = newRow.grade.trim();
            
            // Format 1-5 to 1.00-5.00
            const singleDigitPattern = /^[1-5]$/;
            if (singleDigitPattern.test(trimmedGrade)) {
              newRow.grade = `${trimmedGrade}.00`;
            }
            
            // Format 1.5 to 1.50 (one decimal place to two decimal places)
            const oneDecimalPattern = /^\d+\.\d{1}$/;
            if (oneDecimalPattern.test(trimmedGrade)) {
              newRow.grade = `${trimmedGrade}0`;
            }
          }
          
          // Validate grade if it was edited
          if (newRow.grade && !isValidGrade(newRow.grade)) {
            setGradeError({ rowId: newRow.id, message: `Invalid grade format. Please check the highlighted row.` });
            return rows.find(r => r.id === newRow.id) || newRow;
          }
          setGradeError({ rowId: null, message: null });

          // Validate credits if it was edited
          if (newRow.credits && !isValidCredits(newRow.credits)) {
            setCreditsError({ rowId: newRow.id, message: `Credits must be a positive number only. No letters, special characters, or negative numbers allowed.` });
            return rows.find(r => r.id === newRow.id) || newRow;
          }
          setCreditsError({ rowId: null, message: null });
          
          const newRows = rows.map((r) => (r.id === newRow.id ? newRow : r));
          handleRowsUpdate(newRows);
          return newRow;
        }}
        sx={{
          '& .MuiDataGrid-columnHeader': {
            borderBottom: "0.3px solid #e0e0e0",
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold',
          },
          minHeight: 300,
          maxHeight: 500,
          borderRadius: 2,
          '& .MuiDataGrid-root': {
            border: 'none',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #f0f0f0',
          },
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Row?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this row? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TranscriptGrid;
