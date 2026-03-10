import React, { useEffect, useMemo, useState, useRef } from 'react'
import { DataGridPro, GridSortDirection } from '@mui/x-data-grid-pro';
import { Paper, Box } from '@mui/material';
import CurriculaTableCol from './CurriculaTableCol';
import { useGetCurriculaserQueries } from '../../shared/services/Queries/CurriculaQueries';


interface CurriculaTableProps {
  filters: {
    searchText: string;
    sortField: string[];
    sortDirection: string[];
    page: number;
    pageSize: number;
  };
  onFiltersChange: (filters: any) => void;

}

const CurriculaTable = ({
  filters,
  onFiltersChange,

}: CurriculaTableProps) => {
  const [rows, setRows] = useState<any[]>([]);


  const [paginationModel, setPaginationModel] = useState({
    page: filters.page || 0,
    pageSize: (filters.pageSize && filters.pageSize >= 20) ? filters.pageSize : 20,
  });

  useEffect(() => {
    onFiltersChange({
      ...filters,
      pageSize: paginationModel.pageSize,
      page: paginationModel.page
    });
  }, [paginationModel.pageSize, paginationModel.page]);

  const prevFiltersRef = useRef<string>(JSON.stringify(filters));

  const convertedFilters = useMemo(() => ({
    ...filters,
    pageSize: paginationModel.pageSize,
    page: paginationModel.page
  }), [filters, paginationModel.pageSize, paginationModel.page]);


  const { data, refetch } = useGetCurriculaserQueries(convertedFilters);

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
  }, [filters, refetch]);

  useEffect(() => {
    if (data?.content) {
      setRows(data?.content);
    }
  }, [data]);

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

  // Define columns for curricula table
  const columns = CurriculaTableCol({});

  const PAGE_SIZE_OPTIONS = [20, 30, 40, 50];

  return (
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

                onFiltersChange({
                  ...filters,
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
      );
    };

export default CurriculaTable;