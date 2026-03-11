import React, { useEffect, useMemo, useState, useRef, useContext } from "react";
import { DataGridPro, GridSortDirection } from "@mui/x-data-grid-pro";
import {
  Paper,
  Box,
  InputBase,
  Divider,
  IconButton,
  Typography,
  Snackbar,
  Alert,
  Button,
  Tooltip,
} from "@mui/material";
import WhitelistingTable from "../../component/EmailWhitelisting/WhitelistingTable";
import { UserInterface } from "../../shared/interface/UserInterface";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import { useUserFilters } from "../../shared/utils/useUserFilters";
import { AuthContext } from "../../shared/context/AuthContext";
import { useGetEmailWhiteListQueries } from "../../shared/services/Queries/WhiteListQueries";
import AddEmailModal from "../../component/EmailWhitelisting/AddEmailModal";

const EmailWhitelisting = () => {
  const { currentUser } = useContext(AuthContext);
  const [rows, setRows] = useState<UserInterface[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openAddEmailModal, setOpenAddEmailModal] = useState(false);

  const { filters, updateFilters, batchUpdateFilters } = useUserFilters();

  const [paginationModel, setPaginationModel] = useState({
    page: filters.page || 0,
    pageSize:
      filters.pageSize && filters.pageSize >= 10 ? filters.pageSize : 10,
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

  const { data, refetch } = useGetEmailWhiteListQueries(convertedFilters);

  const sortModel = useMemo(() => {
    if (!Array.isArray(filters.sortField) || filters.sortField.length === 0) {
      return [];
    }
    return filters.sortField.map((field: string, i: number) => ({
      field,
      sort: (filters.sortDirection[i] || "asc") as GridSortDirection,
    }));
  }, [filters.sortField, filters.sortDirection]);

  const handleWhitelistChange = (userId: number, status: boolean) => {
    setSnackbarMessage(
      status
        ? "Email access enabled successfully"
        : "Email access blocked successfully",
    );
    setSnackbarOpen(true);
    refetch();
  };

  const columns = WhitelistingTable({
    onWhitelistChange: handleWhitelistChange,
  });

  const isSystemAdmin = currentUser?.authorities?.includes("ROLE_SUPER_ADMIN");

  useEffect(() => {
    batchUpdateFilters({
      pageSize: paginationModel.pageSize,
      page: paginationModel.page,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel.pageSize, paginationModel.page]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (data?.content) {
      setRows(data?.content);
    }
  }, [data]);

  const updateSearchedText = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters("searchText", e.target.value);
    if (typingTimeout) clearTimeout(typingTimeout);

    const newTimeout = setTimeout(() => {
      refetch();
    }, 500);
    setTypingTimeout(newTimeout);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setTimeout(() => {
        refetch();
      }, 300);
    }
  };

  const handleClearSort = () => {
    batchUpdateFilters({
      sortField: [],
      sortDirection: [],
    });
  };

  const handleOpenAddEmailModal = () => {
    setOpenAddEmailModal(true);
  };

  const handleCloseAddEmailModal = () => {
    setOpenAddEmailModal(false);
    refetch();
  };

  const PAGE_SIZE_OPTIONS = [10, 25, 30, 50];

  if (!isSystemAdmin) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You do not have permission to access this page.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box className="user-management-header">
        <Typography variant="h6" sx={{ color: "#064F1E" }}>
          Email Whitelisting
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "#494b4aff" }}>
          Manage and control which email addresses are authorized to receive
          CrediTrack results.
        </Typography>
      </Box>

      <Box
        sx={{
          backgroundColor: "#fff",
          borderRadius: "15px",
          boxShadow: 2,
          padding: "20px",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Clear Sort">
              <Button
                variant="contained"
                className="add-user-button"
                sx={{
                  height: 40,
                  minWidth: 40,
                  padding: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onClick={handleClearSort}
              >
                <DeleteIcon />
              </Button>
            </Tooltip>

            <Button
              variant="contained"
              className="add-user-button"
              sx={{ height: "40px" }}
              onClick={handleOpenAddEmailModal}
              startIcon={<AddCircleIcon />}
            >
              Add New Email
            </Button>
          </Box>

          <Paper
            component="form"
            sx={{
              p: "2px 4px",
              display: "flex",
              alignItems: "center",
              width: 400,
            }}
          >
            <InputBase
              sx={{ ml: 1, flex: 1, height: "36px", fontSize: "14px" }}
              placeholder="Search Emails"
              inputProps={{ "aria-label": "search emails" }}
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
              <SearchIcon />
            </IconButton>
          </Paper>
        </Box>

        <Box sx={{ width: "100%", height: 500, overflow: "auto" }}>
          <Paper
            sx={{ width: "100%", overflow: "hidden" }}
            square={false}
            elevation={3}
          >
            <DataGridPro
              rows={rows}
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
                const updatedFields = newSortModel.map((m) => m.field);
                const updatedDirections = newSortModel.map(
                  (m) => m.sort ?? "asc",
                );

                batchUpdateFilters({
                  sortField: updatedFields,
                  sortDirection: updatedDirections,
                });
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
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
          </Paper>
        </Box>
      </Box>

      <AddEmailModal
        open={openAddEmailModal}
        handleClose={handleCloseAddEmailModal}
      />

      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EmailWhitelisting;
