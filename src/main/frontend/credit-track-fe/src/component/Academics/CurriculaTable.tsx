import React, { useEffect, useMemo, useState, useRef, useContext } from 'react'
import { DataGridPro, GRID_CHECKBOX_SELECTION_COL_DEF, GridSortDirection } from '@mui/x-data-grid-pro';
import { IconButton, Menu, MenuItem, Tooltip, Dialog, DialogTitle, DialogContent, Typography, Button, DialogActions } from '@mui/material';
import CurriculaTableCol from './CurriculaTableCol';
import CurriculaModal from './CurriculaModal';
import { useGetCurriculaserQueries } from '../../shared/services/Queries/CurriculaQueries';
import { CurriculaInterface } from '../../shared/interface/CurriculaInterface';
import EditSquareIcon from '@mui/icons-material/EditSquare';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import CurriculaService from '../../shared/services/CurriculaService';
import CustomSnackbar from '../../shared/component/CustomSnackbar';
import { AuthContext } from '../../shared/context/AuthContext';

interface CurriculaTableProps {
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

const CurriculaTable: React.FC<CurriculaTableProps> = ({
  filters,
  onFiltersChange,
  onRowSelectionChange,
}: CurriculaTableProps) => {
  const { currentUser } = useContext(AuthContext);
  const authorities = currentUser?.authorities || [];
  const isProgramHead = authorities.includes('ROLE_PROGRAM_HEAD');

  // console.log("Current User in CurriculaTable:", currentUser);
  // console.log("Is Program Head:", isProgramHead);

  // const [rows, setRows] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  // const [editingCurricula, setEditingCurricula] = useState<CurriculaInterface | null>(null);
  const [formData, setFormData] = useState<CurriculaInterface | null>(null);
  const [originalFormData, setOriginalFormData] = useState<CurriculaInterface | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [curriculaToDelete, setCurriculaToDelete] = useState<CurriculaInterface | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 30,
  });



  const [rowSelection, setRowSelection] = useState<SelectionState>({
    type: "include",
    ids: new Set(),
  });


  // useEffect(() => {
  //   onFiltersChange({
  //     ...filters,
  //     pageSize: paginationModel.pageSize,
  //     page: paginationModel.page
  //   });
  // }, [paginationModel.pageSize, paginationModel.page]);

  const prevFiltersRef = useRef<string>(JSON.stringify(filters));

  const convertedFilters = useMemo(() => ({
    ...filters,
    pageSize: paginationModel.pageSize,
    page: paginationModel.page
  }), [filters, paginationModel.pageSize, paginationModel.page]);


  const { data, refetch, isLoading } = useGetCurriculaserQueries(convertedFilters);
  // console.log("Curricula data:", data);

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
  // useEffect(() => {
  //   if (data?.content) {
  //     setRows(data?.content);
  //   }
  // }, [data]);

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

  // Handle menu open/close on hover
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, rowId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(rowId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  // Handle action commands
  const handleUpdateCurricula = (rowData: CurriculaInterface) => {
    // console.log("Update Curricula:", rowData);
    // setEditingCurricula(rowData);
    setFormData(rowData);
    setOriginalFormData(rowData);
    setOpenModal(true);
    handleMenuClose();
  };



  const handleModalClose = () => {
    setOpenModal(false);
    // setEditingCurricula(null);
    setFormData(null);
    setOriginalFormData(null);
    refetch();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData({
        ...formData,
        [name]: isNaN(Number(value)) ? value : Number(value),
      });
    }
  };

  const handleDeleteCurricula = (rowData: CurriculaInterface) => {
    // console.log("Delete Curricula:", rowData);
    setCurriculaToDelete(rowData);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (!curriculaToDelete || !curriculaToDelete.id) return;

    try {
      setIsDeleting(true);
      const response = await CurriculaService.deleteCurricula(curriculaToDelete.id);

      if (response.status === 200) {
        setSnackbarMessage("Curricula deleted successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setDeleteConfirmOpen(false);
        setCurriculaToDelete(null);
        refetch();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error: any) {
      setSnackbarMessage(error?.response?.data?.message || "Failed to delete curricula");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setCurriculaToDelete(null);
  };
  // Define columns for curricula table
  const actionTemplate = (rowData: CurriculaInterface) => {
    const actions = [
      {
        key: 1,
        label: "Update Curricula",
        icon: <EditSquareIcon sx={{ color: 'rgba(3, 99, 59, 1)' }} />,
        command: () => handleUpdateCurricula(rowData),
      },
      {
        key: 2,
        label: "Delete Curricula",
        icon: <DeleteIcon sx={{ color: 'rgba(3, 99, 59, 1)' }} />,
        command: () => handleDeleteCurricula(rowData),
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
                {<span style={{ fontSize: '12px' }}>{action.label}</span>}
              </MenuItem>
            ))}
          </Menu>
        </div>
      </Tooltip>
    );
  };

  const columns = CurriculaTableCol({ actionTemplate }).filter(col => {
    // Hide actions column if user is ROLE_PROGRAM_HEAD
    if (isProgramHead && col.field === 'action') {
      return false;
    }
    return true;
  });

  const PAGE_SIZE_OPTIONS = [20, 30, 40, 50];
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const [snackbarSeverity, setSnackbarSeverity] =
    useState<"success" | "error">("success");


  const handleSaveCurricula = async () => {
    if (!formData) return;

    try {
      setIsSaving(true);

      const payload = {
        ...formData,
        preRequisite: formData.preRequisite?.trim() || "None",
      };

      const response = await CurriculaService.updateCurricula(payload);

      if (response.status === 200) {
        setSnackbarMessage("Curricula updated successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        setShowConfirm(false);
        handleModalClose();
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      setSnackbarMessage("Failed to update curricula");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <DataGridPro
        rows={rows}
        columns={columns}
        rowCount={rowCount}
        loading={isLoading}
        multipleColumnsSortingMode="always"
        density="compact"
        paginationMode="server"
        filterMode="server"
        sortingMode="server"
        sortingOrder={["asc", "desc"]}
        pagination
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        paginationModel={paginationModel}
        checkboxSelection
        onPaginationModelChange={setPaginationModel}
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
          // Notify parent component about selected rows
          if (onRowSelectionChange) {
            // Handle select-all case: when type is "exclude" and ids is empty, it means all rows are selected
            let selectedIds: number[] = [];
            if (model.type === "exclude" && model.ids.size === 0) {
              // Select all: get all IDs from current rows
              selectedIds = rows.map((row: any) => row.id);
            } else {
              // Individual selections
              selectedIds = Array.from(newSelection.ids);
            }
            onRowSelectionChange(selectedIds);
          }
        }}
        initialState={{
          pinnedColumns: {
            left: [
              GRID_CHECKBOX_SELECTION_COL_DEF.field,
              "id",
              "programTitle",
            ],
            right: ["action"],
          },
        }}
        disableRowSelectionOnClick
        sortModel={sortModel}
        onSortModelChange={(newSortModel) => {
          const updatedFields = newSortModel.map((m) => m.field);
          const updatedDirections = newSortModel.map((m) => m.sort ?? "asc");

          onFiltersChange({
            ...filters,
            sortField: updatedFields,
            sortDirection: updatedDirections
          });
          setPaginationModel((prev: any) => ({ ...prev, page: 0 }));
        }}
        sx={{
          height: 500,
          width: '100%',
          '& .MuiDataGrid-columnHeader': {
            borderBottom: "0.3px solid #e0e0e0",
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold',
          },
          '& .MuiDataGrid-root': {
            border: 'none',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #f0f0f0',
          },
        }}
      />
      <CurriculaModal
        open={openModal}
        formData={formData}
        originalFormData={originalFormData}
        onClose={handleModalClose}
        onFormChange={handleFormChange}
        isSaving={isSaving}
        onSave={handleSaveCurricula}
        showConfirm={showConfirm}
        setShowConfirm={setShowConfirm}


      />
      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this Curricula with{" "}
            <strong>{curriculaToDelete?.courseTitle}</strong>?
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

export default CurriculaTable;