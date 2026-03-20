import {
  Box,
  Typography,
  Paper,
  InputBase,
  Divider,
  IconButton,
  Button,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import React, { useState, useEffect, useMemo } from "react";
import CurriculaTable from "./CurriculaTable";
import SyllabiTable from "./SyllabiTable";
import CurriculaUploadModal from "./CurriculaUploadModal";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import {
  semesterOptions,
  yearLevelOptions,
} from "../../shared/Constant/UsersOptions";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import CurriculaService from "../../shared/services/CurriculaService";
import CustomSnackbar from "../../shared/component/CustomSnackbar";
import "../../shared/css/Academics.css";
import { useGetCurriculaProgramCodes } from "../../shared/services/Queries/CurriculaQueries";
import { AuthContext } from "../../shared/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import CourseService from "../../shared/services/CourseService";

const Academics = () => {
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [programCodes, setProgramCodes] = useState<any[]>([]);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [academicType, setAcademicType] = useState<"Curricula" | "Syllabi">(
    "Curricula",
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success",
  );
  const { currentUser } = React.useContext(AuthContext);
  const isSystemAdmin = currentUser?.authorities.includes("ROLE_SUPER_ADMIN");
  const queryClient = useQueryClient();

  const normalizeArray = (value: any) =>
    Array.isArray(value) ? value : value ? [value] : [];

  const getFiltersCurriculaFromSessionStorage = () => {
    const filters = sessionStorage.getItem("curriculaFilters");
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return {
      searchText: parsedFilters.searchText || "",
      years: normalizeArray(parsedFilters.year),
      semesters: normalizeArray(parsedFilters.semester),
      programCodes: normalizeArray(parsedFilters.programCode),
      sortField: Array.isArray(parsedFilters.sortField)
        ? parsedFilters.sortField
        : [],
      sortDirection: Array.isArray(parsedFilters.sortDirection)
        ? parsedFilters.sortDirection
        : [],
      page: parsedFilters.page || 0,
      pageSize: parsedFilters.pageSize || 20,
    };
  };

  const getFiltersSyllabiFromSessionStorage = () => {
    const filters = sessionStorage.getItem("syllabiFilters");
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return {
      searchText: parsedFilters.searchText || "",
      sortField: Array.isArray(parsedFilters.sortField)
        ? parsedFilters.sortField
        : [],
      sortDirection: Array.isArray(parsedFilters.sortDirection)
        ? parsedFilters.sortDirection
        : [],
      page: parsedFilters.page || 0,
      pageSize: parsedFilters.pageSize || 20,
    };
  };

  const [filtersCurricula, setFiltersCurricula] = useState(() =>
    getFiltersCurriculaFromSessionStorage(),
  );
  const [filtersSyllabi, setFiltersSyllabi] = useState(() =>
    getFiltersSyllabiFromSessionStorage(),
  );
  const programCodesData = useGetCurriculaProgramCodes();

  const transformedProgramCodes = useMemo(() => {
    if (!Array.isArray(programCodesData?.data)) return [];
    return programCodesData.data
      .filter((code: any) => code !== null && code !== undefined)
      .map((code: any) => ({
        value: code?.value || code?.programCode || code,
        label: code?.label || code?.programName || code,
      }));
  }, [programCodesData?.data]);

  useEffect(() => {
    setProgramCodes(transformedProgramCodes);
  }, [transformedProgramCodes]);

  const handleClearSort = () => {
    if (academicType === "Curricula") {
      const updatedFilters = {
        searchText: "",
        years: [],
        semesters: [],
        programCodes: [],
        sortField: [],
        sortDirection: [],
        page: 0,
        pageSize: 20,
      };
      setFiltersCurricula(updatedFilters);
      sessionStorage.setItem(
        "curriculaFilters",
        JSON.stringify(updatedFilters),
      );
    } else {
      const updatedFilters = {
        searchText: "",
        sortField: [],
        sortDirection: [],
        page: 0,
        pageSize: 20,
      };
      setFiltersSyllabi(updatedFilters);
      sessionStorage.setItem("syllabiFilters", JSON.stringify(updatedFilters));
    }
  };

  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleDeleteMultipleCurricula = () => {
    if (selectedIds.length > 1) setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteMultiple = async () => {
    try {
      setIsDeleting(true);
      const response =
        academicType === "Curricula"
          ? await CurriculaService.deleteMultipleCurricula(selectedIds)
          : await CourseService.deleteMultipleCourses(selectedIds);

      if (response.status === 200) {
        setSnackbarMessage(
          `${selectedIds.length} ${academicType.toLowerCase()} deleted successfully`,
        );
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setDeleteConfirmOpen(false);
        setSelectedIds([]);
      } else {
        throw new Error("Delete failed");
      }
    } catch (error: any) {
      setSnackbarMessage(
        error?.response?.data?.message ||
          `Failed to delete selected ${academicType.toLowerCase()}`,
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsDeleting(false);
      queryClient.invalidateQueries({
        queryKey: [
          academicType === "Curricula"
            ? "getCurriculaPagination"
            : "getCoursePagination",
        ],
      });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    if (academicType === "Curricula") {
      const updated = { ...filtersCurricula, searchText: searchValue };
      setFiltersCurricula(updated);
      sessionStorage.setItem("curriculaFilters", JSON.stringify(updated));
    } else {
      const updated = { ...filtersSyllabi, searchText: searchValue };
      setFiltersSyllabi(updated);
      sessionStorage.setItem("syllabiFilters", JSON.stringify(updated));
    }
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => {}, 500));
  };

  const handleYearChange = (e: any) => {
    const updated = {
      ...filtersCurricula,
      years:
        typeof e.target.value === "string"
          ? e.target.value.split(",")
          : e.target.value,
    };
    setFiltersCurricula(updated);
    sessionStorage.setItem("curriculaFilters", JSON.stringify(updated));
  };

  const handleSemesterChange = (e: any) => {
    const updated = {
      ...filtersCurricula,
      semesters:
        typeof e.target.value === "string"
          ? e.target.value.split(",")
          : e.target.value,
    };
    setFiltersCurricula(updated);
    sessionStorage.setItem("curriculaFilters", JSON.stringify(updated));
  };

  const handleProgramCodeChange = (e: any) => {
    const updated = {
      ...filtersCurricula,
      programCodes:
        typeof e.target.value === "string"
          ? e.target.value.split(",")
          : e.target.value,
    };
    setFiltersCurricula(updated);
    sessionStorage.setItem("curriculaFilters", JSON.stringify(updated));
  };

  const renderMultiValue = (selected: string[], options: any[]) => {
    if (!selected.length) return "";
    const labels = options
      .filter((opt) => selected.includes(opt.value))
      .map((opt) => opt.label);
    return (
      <Tooltip title={labels.join(", ")}>
        <span className="selected-labels">
          {labels[0]}
          {labels.length > 1 && ` +${labels.length - 1}`}
        </span>
      </Tooltip>
    );
  };

  const iconBtnSx = {
    height: 36,
    minWidth: 36,
    padding: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  return (
    <>
      {/* HEADER */}
      <Box
        className="user-management-header"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ color: "#064F1E", fontSize: "clamp(0.9rem, 2.5vw, 1.25rem)" }}
          >
            Academics
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#494b4aff",
              fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
            }}
          >
            Manage curricula across all academic programs.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          backgroundColor: "#fff",
          borderRadius: "15px",
          boxShadow: 2,
          padding: { xs: "16px", sm: "20px" },
        }}
      >
        {/* TOOLBAR */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {/* LEFT: action buttons + filters */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {isSystemAdmin && (
              <Tooltip
                title={
                  selectedIds.length < 2
                    ? "Select more than 1 to delete"
                    : `Delete ${selectedIds.length} selected`
                }
              >
                <span>
                  <Button
                    variant="contained"
                    className={
                      selectedIds.length < 2
                        ? "disabled-button"
                        : "add-user-button"
                    }
                    disabled={selectedIds.length < 2}
                    sx={iconBtnSx}
                    onClick={handleDeleteMultipleCurricula}
                  >
                    <DeleteForeverIcon fontSize="small" />
                  </Button>
                </span>
              </Tooltip>
            )}

            <Tooltip title="Clear Sort & Filters">
              <Button
                variant="contained"
                className="add-user-button"
                sx={iconBtnSx}
                onClick={handleClearSort}
              >
                <FilterAltOffIcon fontSize="small" />
              </Button>
            </Tooltip>

            {isSystemAdmin && (
              <Tooltip
                title={
                  academicType === "Curricula"
                    ? "Upload Curricula"
                    : "Upload Syllabi"
                }
              >
                <Button
                  variant="contained"
                  className="add-user-button"
                  sx={iconBtnSx}
                  onClick={() => setOpenUploadModal(true)}
                >
                  <UploadFileRoundedIcon fontSize="small" />
                </Button>
              </Tooltip>
            )}

            {academicType === "Curricula" && (
              <>
                <FormControl
                  size="small"
                  sx={{ minWidth: { xs: 90, sm: 110 } }}
                >
                  <InputLabel
                    sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.875rem)" }}
                  >
                    Year
                  </InputLabel>
                  <Select
                    value={filtersCurricula.years}
                    label="Year"
                    multiple
                    onChange={handleYearChange}
                    sx={{
                      height: 36,
                      fontSize: "clamp(0.65rem, 1.5vw, 0.875rem)",
                    }}
                    renderValue={(selected) =>
                      renderMultiValue(selected as string[], yearLevelOptions)
                    }
                  >
                    {yearLevelOptions.map((opt) => (
                      <MenuItem
                        key={opt.value}
                        value={opt.value}
                        sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.875rem)" }}
                      >
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl
                  size="small"
                  sx={{ minWidth: { xs: 100, sm: 120 } }}
                >
                  <InputLabel
                    sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.875rem)" }}
                  >
                    Semester
                  </InputLabel>
                  <Select
                    value={filtersCurricula.semesters}
                    label="Semester"
                    multiple
                    onChange={handleSemesterChange}
                    sx={{
                      height: 36,
                      fontSize: "clamp(0.65rem, 1.5vw, 0.875rem)",
                    }}
                    renderValue={(selected) =>
                      renderMultiValue(selected as string[], semesterOptions)
                    }
                  >
                    {semesterOptions.map((opt) => (
                      <MenuItem
                        key={opt.value}
                        value={opt.value}
                        sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.875rem)" }}
                      >
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl
                  size="small"
                  sx={{ minWidth: { xs: 120, sm: 160 } }}
                >
                  <InputLabel
                    sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.875rem)" }}
                  >
                    Program Code
                  </InputLabel>
                  <Select
                    value={filtersCurricula.programCodes}
                    label="Program Code"
                    multiple
                    onChange={handleProgramCodeChange}
                    sx={{
                      height: 36,
                      fontSize: "clamp(0.65rem, 1.5vw, 0.875rem)",
                    }}
                    renderValue={(selected) =>
                      renderMultiValue(selected as string[], programCodes)
                    }
                  >
                    {programCodes.map((opt, i) => (
                      <MenuItem
                        key={opt.value || i}
                        value={opt.value}
                        sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.875rem)" }}
                      >
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Box>

          {/* RIGHT: search */}
          <Paper
            component="form"
            sx={{
              p: "2px 4px",
              display: "flex",
              alignItems: "center",
              width: { xs: "100%", sm: 280, md: 380 },
            }}
          >
            <InputBase
              sx={{
                ml: 1,
                flex: 1,
                height: "10px",
                fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
              }}
              placeholder={
                academicType === "Curricula"
                  ? "Search Course Code, Course Title..."
                  : "Search Course Name"
              }
              inputProps={{
                "aria-label":
                  academicType === "Curricula"
                    ? "search curricula"
                    : "search syllabi",
              }}
              value={
                academicType === "Curricula"
                  ? filtersCurricula.searchText
                  : filtersSyllabi.searchText
              }
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                }
              }}
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

        {academicType === "Curricula" && (
          <CurriculaTable
            filters={filtersCurricula}
            onFiltersChange={setFiltersCurricula}
            onRowSelectionChange={setSelectedIds}
          />
        )}
        {academicType === "Syllabi" && (
          <SyllabiTable
            filters={filtersSyllabi}
            onFiltersChange={setFiltersSyllabi}
            onRowSelectionChange={setSelectedIds}
          />
        )}
      </Box>

      <CurriculaUploadModal
        open={openUploadModal}
        handleClose={() => setOpenUploadModal(false)}
        uploadType={academicType === "Curricula" ? "curricula" : "syllabi"}
      />

      {/* DELETE CONFIRM DIALOG */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle
          sx={{ fontWeight: "bold", fontSize: "clamp(0.9rem, 2.5vw, 1.25rem)" }}
        >
          Confirm Delete Multiple {academicType}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "clamp(0.75rem, 2vw, 1rem)" }}>
            Are you sure you want to delete {selectedIds.length} selected{" "}
            {academicType.toLowerCase()}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            disabled={isDeleting}
            sx={{
              color: "#064F1E",
              fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDeleteMultiple}
            disabled={isDeleting}
            sx={{
              backgroundColor: "#d32f2f",
              "&:hover": { backgroundColor: "#b71c1c" },
              fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
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

export default Academics;
