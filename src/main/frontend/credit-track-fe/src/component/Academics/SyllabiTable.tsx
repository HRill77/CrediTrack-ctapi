import React, { useState, useMemo, useEffect, useRef, useContext } from "react";
import {
  DataGridPro,
  GRID_CHECKBOX_SELECTION_COL_DEF,
  GridSortDirection,
  GridToolbar,
} from "@mui/x-data-grid-pro";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  MenuItem,
  Tooltip,
  IconButton,
  Menu,
} from "@mui/material";
import SyllabiTableCol from "./SyllabiTableCol";
import { useGetCourseQueries } from "../../shared/services/Queries/CourseQueries";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import { SyllabiInterface } from "../../shared/interface/SyllabiInterface";
import CourseService from "../../shared/services/CourseService";
import CustomSnackbar from "../../shared/component/CustomSnackbar";
import { AuthContext } from "../../shared/context/AuthContext";

interface SyllabiTableProps {
  filters: {
    searchText: string;
    sortField: string[];
    sortDirection: string[];
    page: number;
    pageSize: number;
  };
  onFiltersChange: (filters: any) => void;
  onRowSelectionChange?: (selectedIds: number[]) => void;
}

type SelectionState = {
  type: "include" | "exclude";
  ids: Set<number>;
};

const SyllabiTable: React.FC<SyllabiTableProps> = ({
  filters,
  onFiltersChange,
  onRowSelectionChange,
}) => {
  const { currentUser } = useContext(AuthContext);
  const authorities = currentUser?.authorities || [];
  const isProgramHead = authorities.includes("ROLE_PROGRAM_HEAD");
  const isSystemAdmin = authorities.includes("ROLE_HIDDEN"); // 👈 added

  // console.log("Current User in SyllabiTable:", currentUser);
  // console.log("Is System Admin:", isSystemAdmin);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 30,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [syllabiToDelete, setSyllabiToDelete] =
    useState<SyllabiInterface | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success",
  );
  const [rowSelection, setRowSelection] = useState<SelectionState>({
    type: "include",
    ids: new Set(),
  });

  const prevFiltersRef = useRef<string>(JSON.stringify(filters));

  const convertedFilters = useMemo(
    () => ({
      ...filters,
      pageSize: paginationModel.pageSize,
      page: paginationModel.page,
    }),
    [filters, paginationModel.pageSize, paginationModel.page],
  );

  const { data, refetch, isLoading } = useGetCourseQueries(convertedFilters);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const current = JSON.stringify(filters);

    if (prev !== current) {
      refetch();
      prevFiltersRef.current = current;

      if (paginationModel.page !== 0) {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }
    }
  }, [filters]);

  const rows = useMemo(() => data?.content || [], [data?.content]);
  const rowCountRef = useRef(data?.totalElements || 0);
  const rowCount = useMemo(() => {
    if (data?.totalElements !== undefined) {
      rowCountRef.current = data.totalElements;
    }
    return rowCountRef.current;
  }, [data?.totalElements]);

  const sortModel = useMemo(() => {
    if (!Array.isArray(filters.sortField) || filters.sortField.length === 0) {
      return [];
    }
    return filters.sortField.map((field: string, i: number) => ({
      field,
      sort: (filters.sortDirection[i] || "asc") as GridSortDirection,
    }));
  }, [filters.sortField, filters.sortDirection]);

  const [openOutline, setOpenOutline] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // console.log("Selected Course:", selectedCourse);

  const handleViewOutline = (course: any) => {
    setSelectedCourse(course);
    setOpenOutline(true);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    rowId: number,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(rowId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  const handleDeleteSyllabi = (rowData: SyllabiInterface) => {
    // console.log("Delete Syllabi:", rowData);
    setSyllabiToDelete(rowData);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (!syllabiToDelete || !syllabiToDelete.id) return;

    try {
      setIsDeleting(true);
      const response = await CourseService.deleteCourse(syllabiToDelete.id);

      if (response.status === 200) {
        setSnackbarMessage("Syllabi deleted successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setDeleteConfirmOpen(false);
        setSyllabiToDelete(null);
        refetch();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error: any) {
      setSnackbarMessage(
        error?.response?.data?.message || "Failed to delete syllabi",
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setSyllabiToDelete(null);
  };

  const actionTemplate = (rowData: SyllabiInterface) => {
    const actions = [
      {
        key: 1,
        label: "Delete Syllabi",
        icon: <DeleteIcon sx={{ color: "rgba(3, 99, 59, 1)" }} />,
        command: () => handleDeleteSyllabi(rowData),
      },
    ];

    return (
      <Tooltip title="More options">
        <div>
          <IconButton
            id={`action-button-${rowData.id}`}
            onClick={(e) => handleMenuOpen(e, rowData.id)}
            size="small"
            sx={{ color: "#064f1e" }}
          >
            <SettingsIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={selectedRowId === rowData.id}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
          >
            {actions.map((action) => (
              <MenuItem
                key={action.key}
                onClick={action.command}
                sx={{ display: "flex", gap: 1 }}
              >
                {action.icon}
                {<span style={{ fontSize: "12px" }}>{action.label}</span>}
              </MenuItem>
            ))}
          </Menu>
        </div>
      </Tooltip>
    );
  };

  const columns = SyllabiTableCol({
    onViewOutline: handleViewOutline,
    actionTemplate,
  }).filter((col) => {
    if (isProgramHead && col.field === "actions") {
      return false;
    }
    return true;
  });

  const PAGE_SIZE_OPTIONS = [20, 30, 40, 50];

  const parseCourseOutline = (outline: string): string[] => {
    if (!outline) return [];
    try {
      const parsed = JSON.parse(outline);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getIndentLevel = (item: string): number => {
    if (/^\d+(\.\d+)+/.test(item)) {
      return item.split(".").length - 1;
    }
    if (/^[A-Z](\.[A-Z])+/.test(item)) {
      return item.split(".").length - 1;
    }
    return 0;
  };

  // 👇 Hides the entire table for non-ROLE_HIDDEN users
  if (!isSystemAdmin) return null;

  return (
    <>
      <Box sx={{ height: 600, width: "100%" }}>
        <DataGridPro
          rows={rows}
          columns={columns}
          loading={isLoading}
          rowCount={rowCount}
          multipleColumnsSortingMode="always"
          density="compact"
          paginationMode="server"
          filterMode="server"
          sortingMode="server"
          sortingOrder={["asc", "desc"]}
          pagination
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={{
            type: rowSelection.type,
            ids: rowSelection.ids,
          }}
          onRowSelectionModelChange={(model) => {
            const newSelection = {
              type: model.type,
              ids: new Set(Array.from(model.ids).map(Number)),
            };
            setRowSelection(newSelection);
            if (onRowSelectionChange) {
              let selectedIds: number[] = [];
              if (model.type === "exclude" && model.ids.size === 0) {
                selectedIds = rows.map((row: any) => row.id);
              } else {
                selectedIds = Array.from(newSelection.ids);
              }
              onRowSelectionChange(selectedIds);
            }
          }}
          initialState={{
            pinnedColumns: {
              left: [GRID_CHECKBOX_SELECTION_COL_DEF.field, "id", "courseName"],
              right: ["actions"],
            },
          }}
          sortModel={sortModel}
          onSortModelChange={(newSortModel) => {
            const updatedFields = newSortModel.map((m) => m.field);
            const updatedDirections = newSortModel.map((m) => m.sort ?? "asc");

            onFiltersChange({
              ...filters,
              sortField: updatedFields,
              sortDirection: updatedDirections,
            });
            setPaginationModel((prev: any) => ({ ...prev, page: 0 }));
          }}
          sx={{
            "& .MuiDataGrid-columnHeader": {
              borderBottom: "0.3px solid #e0e0e0",
              backgroundColor: "#f5f5f5",
              fontWeight: "bold",
            },
            height: 500,
            borderRadius: 5,
            "& .MuiDataGrid-root": {
              border: "none",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #f0f0f0",
            },
          }}
        />
      </Box>

      <Dialog
        open={openOutline}
        onClose={() => setOpenOutline(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Course</DialogTitle>
        <DialogContent dividers>
          {selectedCourse && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
                  {selectedCourse.courseName || "N/A"}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Unit:</strong> {selectedCourse.unit || "N/A"}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Pre-requisite:</strong>{" "}
                  {selectedCourse.prerequisite || "None"}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Description:</strong>{" "}
                  {selectedCourse.description || "N/A"}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "bold", mb: 1 }}
              >
                Course Outline:
              </Typography>
              <List sx={{ pl: 1 }}>
                {parseCourseOutline(selectedCourse.courseOutline).map(
                  (item, index) => {
                    const level = getIndentLevel(item);
                    return (
                      <ListItem
                        key={index}
                        disablePadding
                        sx={{
                          pl: level * 3,
                          alignItems: "flex-start",
                        }}
                      >
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{
                            sx: {
                              fontSize: "0.95rem",
                              lineHeight: 1.7,
                              fontWeight: level === 0 ? "bold" : "normal",
                            },
                          }}
                        />
                      </ListItem>
                    );
                  },
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOutline(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle sx={{ fontWeight: "bold" }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this Syllabi with{" "}
            <strong>{syllabiToDelete?.courseName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDelete}
            disabled={isDeleting}
            sx={{ color: "#064F1E" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            sx={{
              backgroundColor: "#d32f2f",
              "&:hover": { backgroundColor: "#b71c1c" },
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={handleSnackbarClose}
      />
    </>
  );
};

export default SyllabiTable;
