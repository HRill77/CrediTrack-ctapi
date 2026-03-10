import React, { useEffect, useMemo, useState, useRef } from 'react'
import { DataGridPro, GridSortDirection } from '@mui/x-data-grid-pro';
import { Paper, Box, Tooltip, Button, InputBase, Divider, IconButton, Typography } from '@mui/material';
import UserTableCol from './UserTableCol';
import { UserInterface } from '../../shared/interface/UserInterface';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUserFilters } from '../../shared/utils/useUserFilters';
import { useGetUserQueries } from '../../shared/services/Queries/UserQueries';
import AddUserModal from './AddUserModal';


const UserTable = () => {

  const [rows, setRows] = useState<UserInterface[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [openAddUserModal, setOpenAddUserModal] = useState(false);

  const handleOpenAddUserModal = () => {
    setOpenAddUserModal(true);
  };
  const handleCloseAddUserModal = () => {
    setOpenAddUserModal(false);
  };
  const { filters, updateFilters, batchUpdateFilters } = useUserFilters();

  // Ensure pageSize is valid, default to 10
  const [paginationModel, setPaginationModel] = useState({
    page: filters.page || 0,
    pageSize: (filters.pageSize && filters.pageSize >= 10) ? filters.pageSize : 10,
  });

  useEffect(() => {
    batchUpdateFilters({
      pageSize: paginationModel.pageSize,
      page: paginationModel.page
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel.pageSize, paginationModel.page]);

  const prevFiltersRef = useRef<string>(JSON.stringify(filters)); // track previous filter object

  const convertedFilters = useMemo(() => ({
    ...filters,
    roleId: filters.roleId ? Number(filters.roleId) : null,
    programId: filters.programId ? Number(filters.programId) : null,
    pageSize: paginationModel.pageSize,
    page: paginationModel.page
  }), [filters, paginationModel.pageSize, paginationModel.page]);

  const { data, refetch } = useGetUserQueries(convertedFilters);

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
      // refetch data here if needed
    }, 500);
    setTypingTimeout(newTimeout);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter")
      setTimeout(() => {
        refetch();
      }, 300);
  };

  const handleClearSort = () => {
    batchUpdateFilters({
      sortField: [],
      sortDirection: []
    });
  };
  const sortModel = useMemo(
    () => {
      if (!Array.isArray(filters.sortField) || filters.sortField.length === 0) {
        return [];
      }
      return filters.sortField.map((field: string, i: number) => ({
        field,
        sort: (filters.sortDirection[i] || "asc") as GridSortDirection,
      }));
    },
    [filters.sortField, filters.sortDirection]
  );

  // Get columns from UserTableCol component
  const columns = UserTableCol({});
  const PAGE_SIZE_OPTIONS = [10, 25, 30, 50];
  return (
    <>
      <Box className="user-management-header">

        <Typography variant="h6"  sx={{ color: "#064F1E" }}>User Management</Typography>
        <Typography variant="body2"  sx={{ mb: 2, color: "#494b4aff" }}>
          Manage and oversee all user accounts within the system.
        </Typography>
      </Box>
      <Box sx={{ backgroundColor: "#fff", borderRadius: "15px", boxShadow: 2, padding: "20px" }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Clear Sort">
              <Button
                variant="contained" className='add-user-button'
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
            <Button variant="contained" className="add-user-button" sx={{ height: "40px" }} onClick={handleOpenAddUserModal} startIcon={<AddCircleIcon />}>
              Add New User
            </Button>
          </Box>
          <Paper
            component="form"
            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400 }}
          >
            <InputBase
              sx={{ ml: 1, flex: 1, height: "10px" }}
              placeholder="Search Users"
              inputProps={{ 'aria-label': 'search users' }}
              value={filters.searchText}
              onChange={updateSearchedText}
              onKeyDown={handleKeyDown}
            />
            <Divider sx={{ height: 15, m: 0.5 }} orientation="vertical" />
            <IconButton type="button" sx={{ p: '10px', height: "15px" }} aria-label="search">
              <SearchIcon />
            </IconButton>

          </Paper>

        </Box>

        <Box sx={{ width: '100%', height: 500, overflow: 'auto' }}>
          <Paper sx={{ width: '100%', overflow: 'hidden' }} square={false} elevation={3}>
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
                const updatedDirections = newSortModel.map((m) => m.sort ?? "asc");

                batchUpdateFilters({
                  sortField: updatedFields,
                  sortDirection: updatedDirections
                });
                setPaginationModel((prev: any) => ({ ...prev, page: 0 }));
              }}
              sx={{
                '& .MuiDataGrid-columnHeader': {
                  borderBottom: "0.3px solid #e0e0e0",
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',

                },
                height: 500,
                borderRadius: 5,
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0',
                },

              }}
            />
          </Paper>
        </Box>
      </Box>

      <AddUserModal open={openAddUserModal} handleClose={handleCloseAddUserModal} />
    </>
  )
}

export default UserTable