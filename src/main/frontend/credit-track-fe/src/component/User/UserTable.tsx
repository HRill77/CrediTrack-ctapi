import React, { useEffect, useMemo, useState, useRef, useContext } from "react";
import { DataGridPro, GridSortDirection } from "@mui/x-data-grid-pro";
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
} from "@mui/material";
import UserTableCol from "./UserTableCol";
import { UserInterface } from "../../shared/interface/UserInterface";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import { useUserFilters } from "../../shared/utils/useUserFilters";
import { useGetUserQueries } from "../../shared/services/Queries/UserQueries";
import AddUserModal from "./AddUserModal";
import { AuthContext } from "../../shared/context/AuthContext";
import ConfirmDialog from "../../shared/component/ConfirmDialog";
import AuthService from "../../shared/services/AuthService";

type User = { fullname: string; email: string };

const UserTable = () => {
  const { isAuthLoading, currentUser } = useContext(AuthContext);
  const [rows, setRows] = useState<UserInterface[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [openAddUserModal, setOpenAddUserModal] = useState(false);
  const { filters, updateFilters, batchUpdateFilters } = useUserFilters();
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [userData, setUserData] = useState<User>({ fullname: "", email: "" });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleGetEmailForReset = (email: string, fullname: string) => {
    setUserData({ ...userData, email, fullname });
    setOpenResetDialog(true);
  };

  const handleSendResetPassword = async (email: string) => {
    setResetLoading(true);
    try {
      const response = await AuthService.forgotPassword(email);
      if (response.status === 200) {
        setSnackbarMessage("Password reset email sent successfully.");
        setSnackbarOpen(true);
        setOpenResetDialog(false);
      }
    } catch (error) {
      setSnackbarMessage("Failed to send reset password email.");
      setSnackbarOpen(true);
    } finally {
      setResetLoading(false);
    }
  };

  const [paginationModel, setPaginationModel] = useState({
    page: filters.page || 0,
    pageSize:
      filters.pageSize && filters.pageSize >= 10 ? filters.pageSize : 10,
  });

  useEffect(() => {
    batchUpdateFilters({
      pageSize: paginationModel.pageSize,
      page: paginationModel.page,
    });
  }, [paginationModel.pageSize, paginationModel.page]);

  const prevFiltersRef = useRef<string>(JSON.stringify(filters));

  const convertedFilters = useMemo(
    () => ({
      ...filters,
      roleId: filters.roleId ? Number(filters.roleId) : null,
      programId: filters.programId ? Number(filters.programId) : null,
      pageSize: paginationModel.pageSize,
      page: paginationModel.page,
    }),
    [filters, paginationModel.pageSize, paginationModel.page],
  );

  const { data, refetch } = useGetUserQueries(convertedFilters);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const current = JSON.stringify(filters);
    if (prev !== current) {
      refetch();
      prevFiltersRef.current = current;
      if (paginationModel.page !== 0)
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }
  }, [filters]);

  useEffect(() => {
    if (data?.content) setRows(data?.content);
  }, [data]);

  const updateSearchedText = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters("searchText", e.target.value);
    if (typingTimeout) clearTimeout(typingTimeout);
    const newTimeout = setTimeout(() => {}, 500);
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

  const columns = UserTableCol({ onResetPassword: handleGetEmailForReset });
  const PAGE_SIZE_OPTIONS = [10, 25, 30, 50];

  return (
    <>
      <Box className="user-management-header">
        <Typography
          variant="h6"
          sx={{ color: "#064F1E", fontSize: "clamp(0.9rem, 2.5vw, 1.25rem)" }}
        >
          Users Management
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            color: "#494b4aff",
            fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
          }}
        >
          Manage and oversee all user accounts within the system.
        </Typography>
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
            <Button
              variant="contained"
              className="add-user-button"
              sx={{
                height: "36px",
                fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
                textTransform: "none",
              }}
              onClick={() => setOpenAddUserModal(true)}
              startIcon={<AddCircleIcon />}
            >
              Add New User
            </Button>
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
              placeholder="Search Users"
              inputProps={{ "aria-label": "search users" }}
              value={filters.searchText}
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
            elevation={3}
          >
            <DataGridPro
              rows={rows.filter((row) => row.email !== currentUser?.username)}
              columns={columns}
              rowCount={data?.totalElements || 0}
              multipleColumnsSortingMode="always"
              density="compact"
              paginationMode="server"
              filterMode="server"
              sortingMode="server"
              sortingOrder={["asc", "desc"]}
              pagination
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
              disableRowSelectionOnClick
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

      <ConfirmDialog
        open={openResetDialog}
        title="Reset Password"
        message={
          <Typography
            component="span"
            sx={{ fontSize: "clamp(0.75rem, 2vw, 1rem)" }}
          >
            Are you sure you want to send a password reset email to{" "}
            <Typography component="span" fontWeight="bold">
              {userData.fullname}
            </Typography>
            ?
          </Typography>
        }
        confirmText="Send"
        cancelText="Cancel"
        confirmColor="success"
        loading={resetLoading}
        onCancel={() => setOpenResetDialog(false)}
        onConfirm={() => handleSendResetPassword(userData.email)}
      />

      <AddUserModal
        open={openAddUserModal}
        handleClose={() => setOpenAddUserModal(false)}
      />

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
    </>
  );
};

export default UserTable;
