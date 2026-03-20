import React from "react";
import {
  Box,
  FormControl,
  FormHelperText,
  IconButton,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { ClearIcon } from "@mui/x-date-pickers";
import { StudentFormData } from "../../shared/interface/StudentFormData";
import {
  userSuffixOptions,
  yearLevelOptions,
} from "../../shared/Constant/UsersOptions";

interface StudentInformationProps {
  formData: StudentFormData;
  errors: Partial<StudentFormData>;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => void;
  onEmailBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const labelSx = {
  mb: 0.5,
  fontWeight: 500,
  color: "#333",
  fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
};
const inputSx = {
  backgroundColor: "#fff",
  fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#064F1E" },
};
const helperSx = { fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)" };

const StudentDetails: React.FC<StudentInformationProps> = ({
  formData,
  errors,
  onInputChange,
  onEmailBlur,
}) => {
  const handleClearYearLevel = () => {
    const clearEvent = {
      target: { name: "yearLevel", value: "" },
    } as React.ChangeEvent<{ name?: string; value: unknown }>;
    onInputChange(clearEvent);
  };

  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        borderRadius: "15px",
        boxShadow: 2,
        padding: { xs: "16px", sm: "24px", md: "30px" },
        mb: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 3,
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: "2px",
            backgroundColor: "#064F1E",
          }}
        />
        <Typography
          variant="h5"
          sx={{
            color: "#064F1E",
            fontWeight: 600,
            backgroundColor: "#fff",
            px: 3,
            position: "relative",
            zIndex: 1,
            fontSize: "clamp(1rem, 3vw, 1.5rem)",
          }}
        >
          Student Information
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* First Row: Last Name, First Name, Middle Name, Suffix */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: { xs: "wrap", sm: "nowrap" },
          }}
        >
          <FormControl
            fullWidth
            variant="outlined"
            error={Boolean(errors.lastname)}
            sx={{ minWidth: { xs: "calc(50% - 8px)", sm: "unset" } }}
          >
            <Typography variant="body2" sx={labelSx}>
              Last Name :
            </Typography>
            <OutlinedInput
              id="last-name"
              name="lastname"
              size="small"
              type="text"
              value={formData.lastname}
              onChange={onInputChange}
              placeholder="Enter last name"
              sx={inputSx}
            />
            {errors.lastname && (
              <FormHelperText sx={helperSx}>{errors.lastname}</FormHelperText>
            )}
          </FormControl>

          <FormControl
            fullWidth
            variant="outlined"
            error={Boolean(errors.firstname)}
            sx={{ minWidth: { xs: "calc(50% - 8px)", sm: "unset" } }}
          >
            <Typography variant="body2" sx={labelSx}>
              First Name :
            </Typography>
            <OutlinedInput
              id="firstname"
              size="small"
              name="firstname"
              type="text"
              value={formData.firstname}
              onChange={onInputChange}
              placeholder="Enter first name"
              sx={inputSx}
            />
            {errors.firstname && (
              <FormHelperText sx={helperSx}>{errors.firstname}</FormHelperText>
            )}
          </FormControl>

          <FormControl
            fullWidth
            variant="outlined"
            sx={{ minWidth: { xs: "calc(50% - 8px)", sm: "unset" } }}
          >
            <Typography variant="body2" sx={labelSx}>
              Middle Name :
            </Typography>
            <OutlinedInput
              id="middle-name"
              name="middlename"
              size="small"
              type="text"
              value={formData.middlename}
              onChange={onInputChange}
              placeholder="Enter middle name"
              sx={inputSx}
            />
          </FormControl>

          <FormControl
            size="small"
            variant="outlined"
            sx={{ minWidth: { xs: "calc(50% - 8px)", sm: "80px" } }}
          >
            <Typography variant="body2" sx={labelSx}>
              Suffix :
            </Typography>
            <OutlinedInput
              id="suffix"
              name="suffix"
              size="small"
              type="text"
              value={formData.suffix}
              onChange={onInputChange}
              placeholder="suffix"
              sx={inputSx}
            />
          </FormControl>
        </Box>

        {/* Second Row: Year Level, Email */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: { xs: "wrap", sm: "nowrap" },
          }}
        >
          <FormControl
            variant="outlined"
            error={Boolean(errors.yearLevel)}
            fullWidth
          >
            <Typography variant="body2" sx={labelSx}>
              Year Level:
            </Typography>
            <Select
              id="yearLevel"
              name="yearLevel"
              size="small"
              value={formData.yearLevel}
              onChange={onInputChange as any}
              displayEmpty
              sx={{
                fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
                "& .MuiSelect-iconOutlined": {
                  display: formData.yearLevel ? "none" : "",
                },
                "&.Mui-focused .MuiIconButton-root": { color: "primary.main" },
              }}
              endAdornment={
                <IconButton
                  onClick={handleClearYearLevel}
                  sx={{
                    visibility: formData.yearLevel ? "visible" : "hidden",
                    "&:hover": { backgroundColor: "transparent" },
                    "&:active": { backgroundColor: "transparent" },
                  }}
                >
                  <ClearIcon
                    sx={{ color: "inherit", "&:hover": { color: "red" } }}
                  />
                </IconButton>
              }
            >
              <MenuItem
                value=""
                disabled
                sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
              >
                Enter year
              </MenuItem>
              {yearLevelOptions.map((year) => (
                <MenuItem
                  key={year.value}
                  value={year.value}
                  sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
                >
                  {year.label}
                </MenuItem>
              ))}
            </Select>
            {errors.yearLevel && (
              <FormHelperText sx={helperSx}>{errors.yearLevel}</FormHelperText>
            )}
          </FormControl>

          <FormControl
            fullWidth
            variant="outlined"
            error={Boolean(errors.email)}
          >
            <Typography variant="body2" sx={labelSx}>
              Email Address :
            </Typography>
            <OutlinedInput
              id="email"
              size="small"
              name="email"
              type="text"
              value={formData.email}
              onChange={onInputChange}
              onBlur={onEmailBlur}
              autoComplete="email"
              placeholder="Enter email address"
              sx={inputSx}
            />
            {errors.email && (
              <FormHelperText sx={helperSx}>{errors.email}</FormHelperText>
            )}
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

export default StudentDetails;
