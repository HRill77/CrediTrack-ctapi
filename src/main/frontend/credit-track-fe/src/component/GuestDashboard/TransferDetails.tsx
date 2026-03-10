import React from "react";
import {
  Box,
  FormControl,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { courseOptions } from "../../shared/Constant/UsersOptions";
import { TransferData } from "../../shared/interface/TransferData";

interface TransferDetailsProps {
  transferData: TransferData;
  onTransferChange: (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => void;
}

const TransferDetails: React.FC<TransferDetailsProps> = ({
  transferData,
  onTransferChange,
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
          Transfer Details
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 4 }}>
        {/* Transfer From Column */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{ color: "#064F1E", mb: 2, fontWeight: 600 }}
          >
            Transfer from:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth variant="outlined">
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
              >
                University :
              </Typography>
              <OutlinedInput
                id="fromUniversity"
                size="small"
                name="fromUniversity"
                type="text"
                value={transferData.fromUniversity}
                onChange={onTransferChange}
                placeholder="Enter university name"
                sx={{ backgroundColor: "#fff" }}
              />
            </FormControl>

            <FormControl fullWidth variant="outlined">
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
              >
                College :
              </Typography>
              <OutlinedInput
                id="fromCollege"
                size="small"
                name="fromCollege"
                type="text"
                value={transferData.fromCollege}
                onChange={onTransferChange}
                placeholder="Enter college department"
                sx={{ backgroundColor: "#fff" }}
              />
            </FormControl>

            <FormControl fullWidth variant="outlined">
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
              >
                Program :
              </Typography>
              <OutlinedInput
                id="fromProgram"
                size="small"
                name="fromProgram"
                type="text"
                value={transferData.fromProgram}
                onChange={onTransferChange}
                placeholder="Enter program"
                sx={{ backgroundColor: "#fff" }}
              />
            </FormControl>
          </Box>
        </Box>

        {/* Vertical Divider */}
        <Box
          sx={{
            width: "2px",
            backgroundColor: "#e0e0e0",
            alignSelf: "stretch",
          }}
        />

        {/* Transfer To Column */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{ color: "#064F1E", mb: 2, fontWeight: 600 }}
          >
            Transfer to:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth variant="outlined">
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
              >
                University :
              </Typography>
              <OutlinedInput
                id="toUniversity"
                size="small"
                name="toUniversity"
                type="text"
                value={"Wesleyan University-Philippines"}
                disabled
                // onChange={onTransferChange}
                placeholder="Wesleyan University-Philippines"
                sx={{ backgroundColor: "#f5f5f5" }}
              />
            </FormControl>

            <FormControl fullWidth variant="outlined">
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
              >
                Program :
              </Typography>
              <Select
                id="toProgram"
                name="toProgram"
                size="small"
                value={transferData.toProgram}
                onChange={onTransferChange as any}
                displayEmpty
                sx={{ backgroundColor: "#fff" }}
              >
                <MenuItem value="" disabled>
                  Enter program
                </MenuItem>
                {courseOptions.map((course) => (
                  <MenuItem key={course.value} value={course.value}>
                    {course.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth variant="outlined">
              <Typography
                variant="body2"
                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
              >
                College :
              </Typography>
              <OutlinedInput
                id="toCollege"
                size="small"
                name="toCollege"
                type="text"
                value={transferData.toCollege}
                onChange={onTransferChange}
                placeholder=""
                sx={{ backgroundColor: "#fff" }}
              />
            </FormControl>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TransferDetails;