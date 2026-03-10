import { Box, Typography, Paper, InputBase, Divider, IconButton, Button, Tooltip, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import React, { useState, useEffect, useMemo } from 'react'
import CurriculaTable from './CurriculaTable'
import CurriculaUploadModal from './CurriculaUploadModal'
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import { semesterOptions, yearLevelOptions } from '../../shared/Constant/UsersOptions';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import CurriculaService from '../../shared/services/CurriculaService';
import "../../shared/css/Academics.css";
import { useGetCurriculaProgramCodes } from '../../shared/services/Queries/CurriculaQueries';

const Academics = () => {
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [programCodes, setProgramCodes] = useState<any[]>([]);
  const [openUploadModal, setOpenUploadModal] = useState(false);

  const normalizeArray = (value: any) =>
    Array.isArray(value) ? value : value ? [value] : [];

  const getFiltersFromSessionStorage = () => {
    const filters = sessionStorage.getItem("curriculaFilters");
    const parsedFilters = filters ? JSON.parse(filters) : {};

    return {
      searchText: parsedFilters.searchText || '',
      years: normalizeArray(parsedFilters.year),
      semesters: normalizeArray(parsedFilters.semester),
      programCodes: normalizeArray(parsedFilters.programCode),
      sortField: Array.isArray(parsedFilters.sortField) ? parsedFilters.sortField : [],
      sortDirection: Array.isArray(parsedFilters.sortDirection) ? parsedFilters.sortDirection : [],
      page: parsedFilters.page || 0,
      pageSize: parsedFilters.pageSize || 20
    };
  };

  const [filters, setFilters] = useState(() => getFiltersFromSessionStorage());
  const programCodesData = useGetCurriculaProgramCodes();

  // Memoize the transformed program codes to prevent infinite loop
  const transformedProgramCodes = useMemo(() => {
    if (!Array.isArray(programCodesData?.data)) return [];
    
    return programCodesData.data.map((code: any) => ({
      value: code.value || code.programCode || code,
      label: code.label || code.programName || code
    }));
  }, [programCodesData?.data]);

  useEffect(() => {
    setProgramCodes(transformedProgramCodes);
  }, [transformedProgramCodes]);

  const handleClearSort = () => {
    const updatedFilters = {
      searchText: '',
      years: [],
      semesters: [],
      programCodes: [],
      sortField: [],
      sortDirection: [],
      page: 0,
      pageSize: 20
    };
    setFilters(updatedFilters);
    sessionStorage.setItem("curriculaFilters", JSON.stringify(updatedFilters));
  };

  const handleOpenAddModal = () => {
    setOpenUploadModal(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedFilters = { ...filters, searchText: e.target.value };
    setFilters(updatedFilters);
    sessionStorage.setItem("curriculaFilters", JSON.stringify(updatedFilters));
    if (typingTimeout) clearTimeout(typingTimeout);

    const newTimeout = setTimeout(() => {
      // refetch data here if needed
    }, 500);
    setTypingTimeout(newTimeout);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // TODO: Trigger refetch
    }
  };

  const handleYearChange = (e: any) => {
    const updatedFilters = { ...filters, years: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value };
    setFilters(updatedFilters);
    sessionStorage.setItem("curriculaFilters", JSON.stringify(updatedFilters));
  };

  const handleSemesterChange = (e: any) => {
    const updatedFilters = { ...filters, semesters: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value };
    setFilters(updatedFilters);
    sessionStorage.setItem("curriculaFilters", JSON.stringify(updatedFilters));
  };

  const handleProgramCodeChange = (e: any) => {
    const updatedFilters = { ...filters, programCodes: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value };
    setFilters(updatedFilters);
    sessionStorage.setItem("curriculaFilters", JSON.stringify(updatedFilters));
  };

  const renderMultiValue = (selected: string[], options: any[]) => {
    if (!selected.length) return '';

    const labels = options
      .filter(opt => selected.includes(opt.value))
      .map(opt => opt.label);

    const first = labels[0];
    const extraCount = labels.length - 1;

    return (
      <Tooltip title={labels.join(', ')}>
        <span className='selected-labels'>
          {first}
          {extraCount > 0 && ` +${extraCount}`}
        </span>
      </Tooltip>
    );
  };




  return (
    <>
      <Box className="user-management-header">
        <Typography variant="h6" sx={{ color: "#064F1E" }}>Academics</Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "#494b4aff" }}>
          Manage curricula and syllabi across all academic programs.
        </Typography>
      </Box>

      <Box sx={{ backgroundColor: "#fff", borderRadius: "15px", boxShadow: 2, padding: "20px" }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Clear Sort & Filters">
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
            <Tooltip title="Upload Curricula">
              <Button
                variant="contained" className='add-user-button'
                sx={{
                  height: 40,
                  minWidth: 40,
                  padding: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }} onClick={handleOpenAddModal}>
                <UploadFileRoundedIcon />
              </Button>
            </Tooltip>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="year-label" sx={{fontSize: "14px"}}>Year</InputLabel>
              <Select
                labelId="year-label"
                value={filters.years}
                label="Year"
                multiple
                onChange={handleYearChange}
                sx={{ height: 40 }}
                renderValue={(selected) =>
                  renderMultiValue(selected as string[], yearLevelOptions)
                }
              >
                {yearLevelOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="semester-label" sx={{fontSize: "14px"}}>Semester</InputLabel>
              <Select
                labelId="semester-label"
                value={filters.semesters}
                label="Semester"
                multiple
                onChange={handleSemesterChange}
                sx={{ height: 40 }}
                renderValue={(selected) =>
                  renderMultiValue(selected as string[], semesterOptions)
                }
              >
                {semesterOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="programcode-label" sx={{fontSize: "14px"}}>Program Code</InputLabel>
              <Select
                labelId="programcode-label"
                value={filters.programCodes}
                label="Program Code"
                multiple
                onChange={handleProgramCodeChange}
                sx={{ height: 40,  }}
                renderValue={(selected) =>
                  renderMultiValue(selected as string[], programCodes)
                }
              >
                {programCodes.map((option, index) => (
                  <MenuItem key={option.value || index} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

          </Box>
          <Paper
            component="form"
            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400 }}
          >
            <InputBase
              sx={{ ml: 1, flex: 1, height: "10px", fontSize: "14px" }}
              placeholder="Search Course Code, Course Title,"
              inputProps={{ 'aria-label': 'search curricula' }}
              value={filters.searchText}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
            />
            <Divider sx={{ height: 15, m: 0.5 }} orientation="vertical" />
            <IconButton type="button" sx={{ p: '10px', height: "15px" }} aria-label="search">
              <SearchIcon />
            </IconButton>
          </Paper>
        </Box>

        <CurriculaTable
          filters={filters}
          onFiltersChange={setFilters}

        />
      </Box>

      <CurriculaUploadModal 
        open={openUploadModal} 
        handleClose={() => setOpenUploadModal(false)} 
      />
    </>
  )
}

export default Academics