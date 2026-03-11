import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImageViewer from "../../shared/component/ImageViewer";
import TranscriptGrid from "./TranscriptGrid";
import { TranscriptRow } from "../../shared/interface/TranscriptRow";
import TranscriptService from "../../shared/services/TranscriptService";
import { TranscriptDto } from "../../shared/interface/TranscriptDto";

interface UploadedFiles {
  transcript: File[];
  courseDescription: File[];
}

interface UploadingCoursesProps {
  uploadedFiles: UploadedFiles;
  onFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "transcript" | "courseDescription",
  ) => void;
  transcriptData?: TranscriptRow[];
  onFilesRemove?: (fileType: "transcript" | "courseDescription") => void;
  onRemoveIndividualFile?: (
    fileType: "transcript" | "courseDescription",
    index: number,
  ) => void;
  studentEmail?: string;
  onTranscriptDataUpdate?: (data: TranscriptRow[]) => void;
}

const UploadingCourses: React.FC<UploadingCoursesProps> = ({
  uploadedFiles,
  onFileUpload,
  transcriptData = [],
  onFilesRemove,
  onRemoveIndividualFile,
  studentEmail = "",
  onTranscriptDataUpdate,
}) => {
  const [viewerFiles, setViewerFiles] = useState<File[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFileType, setModalFileType] = useState<
    "transcript" | "courseDescription"
  >("transcript");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const [gridData, setGridData] = useState<TranscriptRow[]>(transcriptData);

  const isImage = (file: File) =>
    file.type === "image/jpeg" || file.type === "image/png";
  const isPdf = (file: File) => file.type === "application/pdf";

  const getExistingFileType = (
    fileArray: File[],
  ): "image" | "pdf" | "other" | null => {
    if (fileArray.length === 0) return null;
    for (const file of fileArray) {
      if (isImage(file)) return "image";
      if (isPdf(file)) return "pdf";
    }
    return "other";
  };

  const openViewer = (files: File[]) => {
    const images = files.filter(isImage);
    if (!images.length) return;
    setViewerFiles(images);
    setViewerOpen(true);
  };

  const handleValidatedUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "transcript" | "courseDescription",
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const pdfs = files.filter(isPdf);
    const images = files.filter(isImage);
    const others = files.filter((f) => !isImage(f) && !isPdf(f));
    if (others.length > 0) {
      setValidationError("Only PDF and image files (JPG, PNG) are allowed.");
      e.target.value = "";
      return;
    }
    const existingFileType = getExistingFileType(uploadedFiles[fileType]);
    if (existingFileType !== null) {
      if (existingFileType === "pdf" && images.length > 0) {
        setValidationError(
          "Cannot mix PDF with images. You have already uploaded a PDF.",
        );
        e.target.value = "";
        return;
      }
      if (existingFileType === "image" && pdfs.length > 0) {
        setValidationError(
          "Cannot mix images with PDF. You have already uploaded images.",
        );
        e.target.value = "";
        return;
      }
    } else {
      if (pdfs.length > 1) {
        setValidationError("Only ONE PDF file is allowed.");
        e.target.value = "";
        return;
      }
      if (pdfs.length === 1 && images.length > 0) {
        setValidationError("PDF cannot be uploaded together with images.");
        e.target.value = "";
        return;
      }
    }
    onFileUpload(e, fileType);
  };

  const handleOpenModal = (type: "transcript" | "courseDescription") => {
    setModalFileType(type);
    setModalOpen(true);
  };

  const handleUploadTranscript = async () => {
    if (!studentEmail.trim()) {
      setUploadError("Student email is required to upload transcript.");
      return;
    }
    if (uploadedFiles.transcript.length === 0) {
      setUploadError("Please select at least one file to upload.");
      return;
    }
    setIsUploading(true);
    setUploadError("");
    setUploadSuccess("");
    try {
      const response = await TranscriptService.uploadTranscript(
        uploadedFiles.transcript,
        studentEmail,
      );
      if (response.data && Array.isArray(response.data)) {
        const transcriptRows: TranscriptRow[] = response.data.map(
          (dto: TranscriptDto, index: number) => ({
            id: String(gridData.length + index + 1),
            year: dto.year || "",
            subject: dto.subjectCode || "",
            name: dto.courseName || "",
            grade: dto.grade || "",
            credits: dto.credits?.toString() || "",
          }),
        );
        const updatedData = transcriptRows;
        setGridData(updatedData);
        onTranscriptDataUpdate?.(updatedData);
        setUploadSuccess(
          `Transcript uploaded successfully! ${transcriptRows.length} courses added.`,
        );
      }
    } catch (error: any) {
      setUploadError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload transcript. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      [...uploadedFiles.transcript, ...uploadedFiles.courseDescription].forEach(
        (file) => URL.revokeObjectURL(file as any),
      );
    };
  }, [uploadedFiles]);

  const btnSx = {
    backgroundColor: "#064F1E",
    "&:hover": { backgroundColor: "#053a16" },
    fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
  };

  const renderPreview = (files: File[]) => {
    const pdfFiles = files.filter(isPdf);
    const imageFiles = files.filter(isImage);
    if (
      files === uploadedFiles.transcript &&
      (pdfFiles.length > 0 || imageFiles.length > 0)
    ) {
      return (
        <>
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="caption"
              sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)" }}
            >
              <span
                style={{
                  fontStyle: "italic",
                  fontWeight: "bold",
                  color: "#064F1E",
                }}
              >
                Special Instruction:
              </span>{" "}
              Double click on the cells to edit the transcript data.
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Box sx={{ flex: 1 }}>
              {pdfFiles.map((file, i) => (
                <Box key={i} sx={{ mb: 2, border: "1px solid #ccc" }}>
                  <Box
                    sx={{
                      p: 1,
                      fontWeight: 500,
                      fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
                    }}
                  >
                    {file.name}
                  </Box>
                  <iframe
                    src={URL.createObjectURL(file)}
                    width="100%"
                    height="500"
                    style={{ border: "none" }}
                  />
                </Box>
              ))}
              {imageFiles.length > 0 && (
                <Box sx={{ border: "1px solid #ccc", borderRadius: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      fontWeight: 500,
                      fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
                    }}
                  >
                    Scanned Images ({imageFiles.length})
                  </Box>
                  <Box
                    sx={{
                      height: 500,
                      overflowY: "auto",
                      p: 2,
                      cursor: "zoom-in",
                    }}
                    onClick={() => openViewer(imageFiles)}
                  >
                    {imageFiles.map((f, i) => (
                      <Box key={i} sx={{ mb: 2 }}>
                        <img
                          src={URL.createObjectURL(f)}
                          style={{ width: "100%" }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
            <Box
              sx={{
                flex: { xs: "1", md: "0 0 55%" },
                minWidth: { xs: "unset", md: 350 },
              }}
            >
              <Box sx={{ maxHeight: 600, overflow: "auto" }}>
                <TranscriptGrid
                  initialRows={gridData}
                  onRowsChange={(updatedRows) => {
                    setGridData(updatedRows);
                    onTranscriptDataUpdate?.(updatedRows);
                  }}
                />
              </Box>
            </Box>
          </Box>
        </>
      );
    }
    return null;
  };

  const modalFiles =
    modalFileType === "transcript"
      ? uploadedFiles.transcript
      : uploadedFiles.courseDescription;

  return (
    <Box sx={{ background: "#fff", p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
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
          Uploading of Courses
        </Typography>
      </Box>

      <Typography
        variant="body2"
        align="center"
        color="text.secondary"
        mb={3}
        mt={-2}
        sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
      >
        PDF (single file) or multiple JPG/PNG images
      </Typography>

      {validationError && (
        <Alert
          severity="warning"
          onClose={() => setValidationError("")}
          sx={{ mb: 2, fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
        >
          {validationError}
        </Alert>
      )}
      {uploadError && (
        <Alert
          severity="error"
          onClose={() => setUploadError("")}
          sx={{ mb: 2, fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
        >
          {uploadError}
        </Alert>
      )}
      {uploadSuccess && (
        <Alert
          severity="success"
          onClose={() => setUploadSuccess("")}
          sx={{ mb: 2, fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
        >
          {uploadSuccess}
        </Alert>
      )}

      {/* TRANSCRIPT */}
      <Box mb={4}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={1}
          flexWrap="wrap"
        >
          <Typography
            sx={{
              minWidth: { xs: "unset", sm: 180 },
              fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
            }}
          >
            Transcript of Records:
          </Typography>
          <Button variant="contained" component="label" sx={btnSx}>
            Upload
            <input
              hidden
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onChange={(e) => handleValidatedUpload(e, "transcript")}
            />
          </Button>
          {uploadedFiles.transcript.length > 0 && (
            <>
              <Button
                variant="contained"
                onClick={handleUploadTranscript}
                disabled={isUploading}
                sx={{ ...btnSx, "&:disabled": { backgroundColor: "#ccc" } }}
              >
                {isUploading ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1, color: "#fff" }} />
                    Processing...
                  </>
                ) : (
                  "Process"
                )}
              </Button>
              <Button
                variant="text"
                onClick={() => handleOpenModal("transcript")}
                sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
              >
                Show all ({uploadedFiles.transcript.length})
              </Button>
            </>
          )}
        </Box>
        {uploadedFiles.transcript.length > 0 &&
          renderPreview(uploadedFiles.transcript)}
      </Box>

      {viewerOpen && (
        <ImageViewer
          images={viewerFiles}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* SHOW ALL MODAL */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth>
        <DialogTitle sx={{ fontSize: "clamp(0.9rem, 2.5vw, 1.25rem)" }}>
          Files
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 1 }}>
            <Button
              variant="outlined"
              component="label"
              size="small"
              fullWidth
              sx={{
                textTransform: "none",
                fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
              }}
            >
              + Upload More
              <input
                hidden
                type="file"
                accept=".pdf,.jpeg,.jpg,.png"
                multiple
                onChange={(e) => onFileUpload(e, modalFileType)}
              />
            </Button>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {(modalFileType === "transcript"
              ? uploadedFiles.transcript
              : uploadedFiles.courseDescription
            ).map((file, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 1,
                  border: "1px solid #e0e0e0",
                  borderRadius: "5px",
                  backgroundColor: "#fafafa",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#6366f1",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: 600,
                      flexShrink: 0,
                      textTransform: "uppercase",
                    }}
                  >
                    {file.type === "application/pdf"
                      ? "pdf"
                      : file.type === "image/png"
                        ? "png"
                        : "jpeg"}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
                      }}
                    >
                      {file.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)" }}
                    >
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => onRemoveIndividualFile?.(modalFileType, index)}
                  sx={{
                    flexShrink: 0,
                    color: "#666",
                    "&:hover": { color: "#f44336" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            {(modalFileType === "transcript"
              ? uploadedFiles.transcript
              : uploadedFiles.courseDescription
            ).length === 0 && (
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{
                  textAlign: "center",
                  py: 2,
                  fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
                }}
              >
                No files uploaded
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            onClick={() => onFilesRemove?.(modalFileType)}
            disabled={!modalFiles.length}
            sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
          >
            Remove All
          </Button>
          <Button
            onClick={() => setModalOpen(false)}
            sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UploadingCourses;
