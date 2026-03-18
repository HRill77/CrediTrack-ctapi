import React from "react";
import {
  Autocomplete,
  Box,
  FormControl,
  OutlinedInput,
  TextField,
  Typography,
} from "@mui/material";
import {
  courseOptions,
  UniversityFromOptions,
} from "../../shared/Constant/UsersOptions";
import { TransferData } from "../../shared/interface/TransferData";
import { collegesList } from "../../shared/utils/programSectionUtil";

interface TransferDetailsProps {
  transferData: TransferData;
  onTransferChange: (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => void;
  errors?: Partial<TransferData>;
}

const TransferDetails: React.FC<TransferDetailsProps> = ({
  transferData,
  onTransferChange,
  errors = {},
}) => {
  const handleToProgramChange = (event: any, newValue: any) => {
    const programChangeEvent = {
      target: { name: "toProgram", value: newValue || "" },
    } as React.ChangeEvent<{ name?: string; value: unknown }>;
    onTransferChange(programChangeEvent);

    if (newValue) {
      const college = collegesList.find((col) =>
        col.programs.includes(newValue),
      );
      if (college) {
        const collegeChangeEvent = {
          target: { name: "toCollege", value: college.name },
        } as React.ChangeEvent<{ name?: string; value: unknown }>;
        onTransferChange(collegeChangeEvent);
      }
    } else {
      const collegeChangeEvent = {
        target: { name: "toCollege", value: "" },
      } as React.ChangeEvent<{ name?: string; value: unknown }>;
      onTransferChange(collegeChangeEvent);
    }
  };

  const labelSx = {
    mb: 0.5,
    fontWeight: 500,
    color: "#333",
    fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
  };
  const errorSx = {
    color: "#d32f2f",
    mt: 0.5,
    fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)",
  };
  const inputSx = {
    fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#064F1E",
    },
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
          Transfer Details
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: { xs: 2, sm: 4 },
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        {/* Transfer From Column */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              color: "#064F1E",
              mb: 2,
              fontWeight: 600,
              fontSize: "clamp(0.875rem, 2.5vw, 1.25rem)",
            }}
          >
            Transfer from:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* ✅ Fixed: University field — Autocomplete with proper renderInput */}
            <FormControl fullWidth variant="outlined">
              <Typography variant="body2" sx={labelSx}>
                University :
              </Typography>
              <Autocomplete
                freeSolo
                options={UniversityFromOptions.map((u) => u.label)}
                value={transferData.fromUniversity || ""}
                onChange={(event, newValue) => {
                  const syntheticEvent = {
                    target: { name: "fromUniversity", value: newValue || "" },
                  } as React.ChangeEvent<{ name?: string; value: unknown }>;
                  onTransferChange(syntheticEvent);
                }}
                onInputChange={(event, newInputValue) => {
                  const syntheticEvent = {
                    target: { name: "fromUniversity", value: newInputValue },
                  } as React.ChangeEvent<{ name?: string; value: unknown }>;
                  onTransferChange(syntheticEvent);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Enter university name"
                    error={!!errors.fromUniversity}
                    InputProps={{ ...params.InputProps, sx: inputSx }}
                  />
                )}
              />
              {errors.fromUniversity && (
                <Typography variant="caption" sx={errorSx}>
                  {errors.fromUniversity}
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth>
              <Typography variant="body2" sx={labelSx}>
                Program :
              </Typography>
              <Autocomplete
                freeSolo
                options={courseOptions.map((course) => course.label)}
                value={transferData.fromProgram || ""}
                onChange={(event, newValue) => {
                  const syntheticEvent = {
                    target: { name: "fromProgram", value: newValue || "" },
                  } as React.ChangeEvent<{ name?: string; value: unknown }>;
                  onTransferChange(syntheticEvent);
                }}
                onInputChange={(event, newInputValue) => {
                  const syntheticEvent = {
                    target: { name: "fromProgram", value: newInputValue },
                  } as React.ChangeEvent<{ name?: string; value: unknown }>;
                  onTransferChange(syntheticEvent);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Enter or select program"
                    error={!!errors.fromProgram}
                    InputProps={{ ...params.InputProps, sx: inputSx }}
                  />
                )}
              />
              {errors.fromProgram && (
                <Typography variant="caption" sx={errorSx}>
                  {errors.fromProgram}
                </Typography>
              )}
            </FormControl>
          </Box>
        </Box>

        {/* Vertical Divider – hidden on mobile */}
        <Box
          sx={{
            width: "2px",
            backgroundColor: "#e0e0e0",
            alignSelf: "stretch",
            display: { xs: "none", sm: "block" },
          }}
        />

        {/* Transfer To Column */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              color: "#064F1E",
              mb: 2,
              fontWeight: 600,
              fontSize: "clamp(0.875rem, 2.5vw, 1.25rem)",
            }}
          >
            Transfer to:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth variant="outlined">
              <Typography variant="body2" sx={labelSx}>
                University :
              </Typography>
              <OutlinedInput
                id="toUniversity"
                size="small"
                name="toUniversity"
                type="text"
                value={transferData.toUniversity}
                disabled
                placeholder="Wesleyan University-Philippines"
                sx={{ backgroundColor: "#f5f5f5", ...inputSx }}
              />
            </FormControl>

            <FormControl fullWidth>
              <Typography variant="body2" sx={labelSx}>
                Program :
              </Typography>
              <Autocomplete
                freeSolo
                options={courseOptions.map((course) => course.label)}
                value={transferData.toProgram || ""}
                onChange={handleToProgramChange}
                onInputChange={(event, newInputValue) => {
                  const syntheticEvent = {
                    target: { name: "toProgram", value: newInputValue },
                  } as React.ChangeEvent<{ name?: string; value: unknown }>;
                  onTransferChange(syntheticEvent);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Enter or select program"
                    error={!!errors.toProgram}
                    InputProps={{ ...params.InputProps, sx: inputSx }}
                  />
                )}
              />
              {errors.toProgram && (
                <Typography variant="caption" sx={errorSx}>
                  {errors.toProgram}
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth variant="outlined">
              <Typography variant="body2" sx={labelSx}>
                College :
              </Typography>
              <OutlinedInput
                disabled
                id="toCollege"
                size="small"
                name="toCollege"
                type="text"
                value={transferData.toCollege}
                onChange={onTransferChange}
                placeholder=""
                sx={{ backgroundColor: "#f5f5f5", ...inputSx }}
                error={!!errors.toCollege}
              />
              {errors.toCollege && (
                <Typography variant="caption" sx={errorSx}>
                  {errors.toCollege}
                </Typography>
              )}
            </FormControl>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TransferDetails;
