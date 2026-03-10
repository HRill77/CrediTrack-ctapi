import React from "react";
import {
  Box,
  FormControl,
  FormHelperText,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { StudentFormData } from "../../shared/interface/StudentFormData";
import {
  userSuffixOptions,
  yearLevelOptions,
} from "../../shared/Constant/UsersOptions";
import { phPhoneNumberFormat } from "../../shared/utils/uiUtility";

interface StudentInformationProps {
  formData: StudentFormData;
  errors: Partial<StudentFormData>;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const StudentDetails: React.FC<StudentInformationProps> = ({
  formData,
  errors,
  onInputChange,
  onPhoneChange,
}) => {
  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        borderRadius: "15px",
        boxShadow: 2,
        padding: "30px",
        mb: 2,
      }}
    >
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
          }}
        >
          Student Information
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* First Row: Last Name, First Name, Middle Name */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl
            fullWidth
            variant="outlined"
            error={Boolean(errors.lastname)}
          >
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
            >
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
              sx={{ backgroundColor: "#fff" }}
            />
            {errors.lastname && (
              <FormHelperText>{errors.lastname}</FormHelperText>
            )}
          </FormControl>

          <FormControl
            fullWidth
            variant="outlined"
            error={Boolean(errors.firstname)}
          >
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
            >
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
              sx={{ backgroundColor: "#fff" }}
            />
            {errors.firstname && (
              <FormHelperText>{errors.firstname}</FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth variant="outlined">
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
            >
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
              sx={{ backgroundColor: "#fff" }}
            />
          </FormControl>
        </Box>

        {/* Second Row: DOB, Contact Number, Home Address */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl fullWidth variant="outlined">
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
            >
              Date of Birth :
            </Typography>
            <OutlinedInput
              id="dob"
              size="small"
              name="dob"
              type="date"
              value={formData.dob ? formData.dob.format("YYYY-MM-DD") : ""}
              onChange={onInputChange}
              placeholder="Enter date"
              sx={{ backgroundColor: "#fff" }}
            />
          </FormControl>

          <FormControl fullWidth variant="outlined">
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
            >
              Contact Number :
            </Typography>
            <OutlinedInput
              id="phone"
              size="small"
              name="phone"
              type="tel"
              value={phPhoneNumberFormat(formData.phone)}
              onChange={onPhoneChange}
              placeholder="Enter contact number"
              sx={{ backgroundColor: "#fff" }}
              inputProps={{
                inputMode: "numeric",
                pattern: "[0-9 ]*",
              }}
            />
          </FormControl>

          <FormControl fullWidth variant="outlined">
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
            >
              Home Address :
            </Typography>
            <OutlinedInput
              id="address"
              size="small"
              name="address"
              type="text"
              value={formData.address}
              onChange={onInputChange}
              placeholder="Enter home address"
              sx={{ backgroundColor: "#fff" }}
            />
          </FormControl>
        </Box>

        {/* Third Row: Year Level */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl variant="outlined" sx={{ width: "250px" }}>
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
            >
              Year Level:
            </Typography>
            <Select
              id="yearLevel"
              name="yearLevel"
              size="small"
              value={formData.yearLevel}
              onChange={onInputChange as any}
              displayEmpty
              sx={{ backgroundColor: "#fff" }}
            >
              <MenuItem value="" disabled>
                Enter year
              </MenuItem>
              {yearLevelOptions.map((year) => (
                <MenuItem key={year.value} value={year.value}>
                  {year.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

export default StudentDetails;