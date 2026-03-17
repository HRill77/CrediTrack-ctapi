import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import "../../shared/css/Dashboard.css";
import NavBar from "../../shared/component/NavigationBar/NavBar";
import dayjs from "dayjs";
import {
  StudentFormData,
  StudentFormDataRequest,
} from "../../shared/interface/StudentFormData";
import StudentDetails from "./StudentDetails";
import TransferDetails from "./TransferDetails";
import UploadingCourses from "./UploadingCourses";
import StudentService from "../../shared/services/StudentService";
import GuestCreditTrackResult from "./GuestCreditTrackResult";
import TranscriptGrid from "./TranscriptGrid";
import { TranscriptRow } from "../../shared/interface/TranscriptRow";
import TranscriptService from "../../shared/services/TranscriptService";
import { ITranscriptRequest } from "../../shared/interface/ITranscriptRequest";

const GuestDashboard = () => {
  const [formData, setFormData] = useState<StudentFormData>({
    firstname: "",
    middlename: "",
    lastname: "",
    suffix: "",
    email: "",
    yearLevel: "",
  });

  const [transferData, setTransferData] = useState({
    fromUniversity: "",
    fromCollege: "",
    fromProgram: "",
    toUniversity: "Wesleyan University-Philippines",
    toCollege: "",
    toProgram: "",
  });

  const [transcriptData, setTranscriptData] = useState<TranscriptRow[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState({
    transcript: [] as File[],
    courseDescription: [] as File[],
  });
  const [startCreditTractLoading, setStartCreditTractLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<StudentFormData>>({});
  const [transferErrors, setTransferErrors] = useState<
    Partial<typeof transferData>
  >({});
  const [showResultModal, setShowResultModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [evaluationResult, setEvaluationResult] = useState<any[]>([]);
  const [savedStudentId, setSavedStudentId] = useState<number | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target as
      | HTMLInputElement
      | { name?: string; value: unknown };
    if (!name) return;
    let finalValue: any = value;
    if (name === "dob" && value) finalValue = dayjs(value as string);
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name as keyof StudentFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const email = formData.email;
    if (!email.trim()) return;
    try {
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) {
        setErrors((prev) => ({
          ...prev,
          email: "Please enter a valid email address",
        }));
      }
    } catch (err) {
      console.error("Email check failed", err);
    }
  };

  const handleTransferChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target as { name?: string; value: unknown };
    if (!name) return;
    setTransferData((prev) => ({ ...prev, [name]: value }));
    if (transferErrors[name as keyof typeof transferData]) {
      setTransferErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "transcript" | "courseDescription",
  ) => {
    const files = Array.from(e.target.files || []);
    const hasPdf = files.some((f) => f.type === "application/pdf");
    if (hasPdf && files.length > 1) {
      alert("PDF files must be uploaded one at a time.");
      e.target.value = "";
      return;
    }
    setUploadedFiles((prev) => ({
      ...prev,
      [fileType]: [...prev[fileType], ...files],
    }));
  };

  const handleFilesRemove = (fileType: "transcript" | "courseDescription") => {
    setUploadedFiles((prev) => ({ ...prev, [fileType]: [] }));
  };

  const handleRemoveIndividualFile = (
    fileType: "transcript" | "courseDescription",
    index: number,
  ) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index),
    }));
  };

  const handleStartCrediTrack = async () => {
    setErrorMessage("");
    const newErrors: Partial<StudentFormData> = {};
    const newTransferErrors: Partial<typeof transferData> = {};

    if (!formData.firstname.trim())
      newErrors.firstname = "First name is required";
    if (!formData.lastname.trim()) newErrors.lastname = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formData.email))
      newErrors.email = "Please enter a valid email address";
    if (!formData.yearLevel.trim())
      newErrors.yearLevel = "Year level is required";
    if (!transferData.fromUniversity.trim())
      newTransferErrors.fromUniversity = "University name is required";
    if (!transferData.fromProgram.trim())
      newTransferErrors.fromProgram = "Program is required";
    if (!transferData.fromCollege.trim())
      newTransferErrors.fromCollege = "College is required";
    if (!transferData.toProgram.trim())
      newTransferErrors.toProgram = "Program is required";

    if (uploadedFiles.transcript.length === 0) {
      setErrorMessage("Please upload transcript files");
      return;
    }
    if (transcriptData.length === 0) {
      setErrorMessage("Please process the transcript files to add courses");
      return;
    }

    if (Object.keys(newErrors).length > 0) setErrors(newErrors);
    if (Object.keys(newTransferErrors).length > 0)
      setTransferErrors(newTransferErrors);
    if (
      Object.keys(newErrors).length > 0 ||
      Object.keys(newTransferErrors).length > 0
    )
      return;

    try {
      setStartCreditTractLoading(true);
      const payload: StudentFormDataRequest = {
        firstname: formData.firstname,
        middlename: formData.middlename,
        lastname: formData.lastname,
        suffix: formData.suffix,
        email: formData.email,
        yearLevel: formData.yearLevel,
        fromUniversity: transferData.fromUniversity,
        fromCollege: transferData.fromCollege,
        fromProgram: transferData.fromProgram,
        toUniversity: transferData.toUniversity,
        toCollege: transferData.toCollege,
        toProgram: transferData.toProgram,
      };
      const response = await StudentService.saveStudentData(
        payload,
        uploadedFiles.transcript,
        uploadedFiles.courseDescription,
      );

      if (response.status === 200 || response.status === 201) {
        const studentId = response.data.studentId ?? response.data.id ?? null;
        if (studentId) {
          setSavedStudentId(Number(studentId));
        }
        const mapTranscriptToRequest = (
          studentId: number,
          transcriptData: TranscriptRow[],
        ): ITranscriptRequest => ({
          studentId,
          transcripts: transcriptData.map((row) => ({
            year: row.year,
            subjectCode: row.subject,
            courseName: row.name,
            grade: Number(row.grade),
            credits: Number(row.credits ?? 0),
          })),
        });
        const requestBody = mapTranscriptToRequest(studentId, transcriptData);
        const evaluationResponse = await TranscriptService.evaluateTranscript(
          requestBody,
          transferData.toProgram,
        );
        setEvaluationResult(evaluationResponse.data || []);
        setErrorMessage("");
        setShowResultModal(true);
        if (!savedStudentId && response.data.studentId) {
          setSavedStudentId(Number(response.data.studentId));
        }

      } else {
        setErrorMessage(
          "Failed to save student data. Please check your inputs and try again.",
        );
      }
    } catch (error) {
      console.error("Error saving student data:", error);
      setErrorMessage(
        "An error occurred while saving your data. Please try again.",
      );
    } finally {
      setStartCreditTractLoading(false);
    }
  };

  return (
    <Box className="dashboard-root">
      <NavBar />

      <Box className="hero-dashboard2">
        <Container
          maxWidth="lg"
          disableGutters
          sx={{ px: { xs: 2, sm: 3, md: 4 } }}
        >
          <Box className="user-management-header">
            <Typography
              variant="h6"
              className="hero-dashboard-title"
              sx={{
                color: "#064F1E",
                fontSize: "clamp(0.875rem, 2.5vw, 1.1rem)",
              }}
            >
              Welcome, Student Guest!
            </Typography>
          </Box>

          {/* Error Message */}
          {errorMessage && (
            <Box
              sx={{
                backgroundColor: "#ffebee",
                color: "#c62828",
                padding: { xs: "10px 12px", sm: "12px 16px" },
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid #ef5350",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.8rem)" }}
              >
                {errorMessage}
              </Typography>
            </Box>
          )}

          <StudentDetails
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            onEmailBlur={handleEmailBlur}
          />

          <TransferDetails
            transferData={transferData}
            onTransferChange={handleTransferChange}
            errors={transferErrors}
          />

          <UploadingCourses
            uploadedFiles={uploadedFiles}
            onFileUpload={handleFileUpload}
            transcriptData={transcriptData}
            onFilesRemove={handleFilesRemove}
            onRemoveIndividualFile={handleRemoveIndividualFile}
            studentEmail={formData.email}
            onTranscriptDataUpdate={(data) => setTranscriptData(data)}
          />

          {/* START CrediTrack Button */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3, mt: 4 }}>
            <Button
              variant="contained"
              onClick={handleStartCrediTrack}
              sx={{
                backgroundColor: "#064F1E",
                color: "#fff",
                padding: { xs: "10px 32px", sm: "12px 48px" },
                fontSize: "clamp(0.75rem, 2vw, 0.9rem)",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "8px",
                "&:hover": { backgroundColor: "#053a16" },
                "&:disabled": { backgroundColor: "#ccc" },
              }}
              disabled={startCreditTractLoading}
            >
              {startCreditTractLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: "#fff" }} />
                  START CrediTrack...
                </>
              ) : (
                "START CrediTrack"
              )}
            </Button>
          </Box>

          <GuestCreditTrackResult
            open={showResultModal}
            onClose={() => setShowResultModal(false)}
            evaluationData={evaluationResult}
            studentData={formData}
            studentId={savedStudentId ?? undefined}
            transferData={transferData}
          />
        </Container>
      </Box>

      <Box className="dashboard-footer" sx={{ textAlign: "center" }}>
        <Typography
          variant="body2"
          sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)" }}
        >
          Copyright © 2026 CrediTrack. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default GuestDashboard;
