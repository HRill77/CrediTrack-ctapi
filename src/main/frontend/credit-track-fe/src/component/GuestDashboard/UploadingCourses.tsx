import React from "react";
import { Box, Button, Typography } from "@mui/material";

interface UploadedFiles {
  transcript: File | null;
  courseDescription: File | null;
}

interface UploadingCoursesProps {
  uploadedFiles: UploadedFiles;
  onFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "transcript" | "courseDescription"
  ) => void;
}

const UploadingCourses: React.FC<UploadingCoursesProps> = ({
  uploadedFiles,
  onFileUpload,
}) => {
  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        borderRadius: "15px",
        boxShadow: 2,
        padding: "30px",
        mb: 3,
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
          Uploading of Courses
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 3,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        {/* Transcript of Records */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            variant="body1"
            sx={{ fontWeight: 500, minWidth: "180px" }}
          >
            Transcript of Records:
          </Typography>
          <Button
            variant="outlined"
            component="label"
            sx={{
              textTransform: "none",
              borderColor: "#d0d0d0",
              color: "#666",
              backgroundColor: "#f5f5f5",
              px: 3,
              "&:hover": {
                borderColor: "#064F1E",
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            {uploadedFiles.transcript
              ? uploadedFiles.transcript.name
              : "Upload"}
            <input
              type="file"
              hidden
              accept=".pdf,.doc,.docx"
              onChange={(e) => onFileUpload(e, "transcript")}
            />
          </Button>
        </Box>

        {/* Course Description */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            variant="body1"
            sx={{ fontWeight: 500, minWidth: "180px" }}
          >
            Courses Description:
          </Typography>
          <Button
            variant="outlined"
            component="label"
            sx={{
              textTransform: "none",
              borderColor: "#d0d0d0",
              color: "#666",
              backgroundColor: "#f5f5f5",
              px: 3,
              "&:hover": {
                borderColor: "#064F1E",
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            {uploadedFiles.courseDescription
              ? uploadedFiles.courseDescription.name
              : "Upload"}
            <input
              type="file"
              hidden
              accept=".pdf,.doc,.docx"
              onChange={(e) => onFileUpload(e, "courseDescription")}
            />
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default UploadingCourses;