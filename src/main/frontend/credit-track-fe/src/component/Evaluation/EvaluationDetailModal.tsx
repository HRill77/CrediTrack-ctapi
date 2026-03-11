import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Paper,
    Autocomplete,
    TextField,
    CircularProgress,
    Alert,
    Snackbar,
    Tabs,
    Tab,
} from "@mui/material";
import { DataGridPro, GridColDef } from "@mui/x-data-grid-pro";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { IconButton } from "@mui/material";
import CurriculaService from "../../shared/services/CurriculaService";
import FileUploadService from "../../shared/services/FileUploadService";
import ImageViewer from "../../shared/component/ImageViewer";
import TranscriptEvaluationService from "../../shared/services/TranscriptEvaluationService";

interface EvaluationDetailModalProps {
    open: boolean;
    onClose: () => void;
    studentInfo: any;
    evaluations: any[];
    onSave?: (updatedEvaluations: any[]) => void;
}

const EvaluationDetailModal: React.FC<EvaluationDetailModalProps> = ({
    open,
    onClose,
    studentInfo,
    evaluations,
    onSave,
}) => {
    const queryClient = useQueryClient();
    console.log("EvaluationDetailModal rendered with studentInfo:", studentInfo, "evaluations:", evaluations);

    const [originalRows, setOriginalRows] = useState<any[]>([]);
    const [editableRows, setEditableRows] = useState<any[]>(evaluations);
    const [curriculaList, setCurriculaList] = useState<any[]>([]);
    const [loadingCurricula, setLoadingCurricula] = useState(false);

    // File viewing states
    const [tabValue, setTabValue] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState<{ transcript: File[]; courseDescription: File[] }>({
        transcript: [],
        courseDescription: [],
    });
    console.log("Uploaded Files State:", uploadedFiles);
    const [viewerFiles, setViewerFiles] = useState<File[]>([]);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [fileError, setFileError] = useState<string>("");

    // Confirmation & Snackbar States
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>("");
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
    const [deletedRows, setDeletedRows] = useState<any[]>([]);

    const handleDeleteRow = (rowId: any) => {
        const rowToDelete = editableRows.find(r => r.id === rowId);

        if (!rowToDelete) return;

        // If existing DB record
        if (typeof rowToDelete.id === "number") {
            setDeletedRows(prev => [...prev, rowToDelete]);
        }

        setEditableRows(prev => prev.filter(r => r.id !== rowId));
    };

    useEffect(() => {
        setEditableRows(evaluations);
        setOriginalRows(evaluations); // backup copy
    }, [evaluations]);

    // Load files from service
    useEffect(() => {
        const loadFiles = async () => {
            console.log("loadFiles triggered - studentInfo:", studentInfo, "open:", open);

            if (!open) {
                console.log("Modal not open, skipping file load");
                return;
            }

            if (!studentInfo?.studentId) {
                console.log("No studentId found, skipping file load");
                return;
            }

            setLoadingFiles(true);
            setFileError("");

            try {
                console.log("Fetching files for studentId:", studentInfo?.studentId);
                const response = await FileUploadService.getFilesByStudentId(studentInfo?.studentId);
                console.log("Files response:", response);
                console.log("Files response data:", response.data);

                // Handle both possible response structures
                const filesData = Array.isArray(response.data?.files)
                    ? response.data.files
                    : [];
                console.log("Processed filesData:", filesData, "Length:", filesData?.length);

                const transcriptFiles: File[] = [];
                const courseDescriptionFiles: File[] = [];

                filesData.forEach((fileRecord: any) => {
                    console.log("Processing file record:", fileRecord);

                    // === TRANSCRIPT FILE ===
                    if (fileRecord.torFileData && fileRecord.torFilename) {

                        const byteCharacters = atob(fileRecord.torFileData);
                        const byteNumbers = new Array(byteCharacters.length);

                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }

                        const byteArray = new Uint8Array(byteNumbers);

                        const file = new File(
                            [byteArray],
                            fileRecord.torFilename,
                            { type: fileRecord.torFileType }
                        );

                        transcriptFiles.push(file);
                    }

                    // === COURSE DESCRIPTION FILE ===
                    if (fileRecord.cdFileData && fileRecord.cdFilename) {

                        const byteCharacters = atob(fileRecord.cdFileData);
                        const byteNumbers = new Array(byteCharacters.length);

                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }

                        const byteArray = new Uint8Array(byteNumbers);

                        const file = new File(
                            [byteArray],
                            fileRecord.cdFilename,
                            { type: fileRecord.cdFileType }
                        );

                        courseDescriptionFiles.push(file);
                    }

                });

                setUploadedFiles({
                    transcript: transcriptFiles,
                    courseDescription: courseDescriptionFiles,
                });
                console.log("Uploaded files set:", {
                    transcript: transcriptFiles.length,
                    courseDescription: courseDescriptionFiles.length,
                });

            } catch (error: any) {
                const errorMsg =
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to load files.";
                console.error("File loading error:", error);
                setFileError(errorMsg);
            } finally {
                console.log("File loading completed");
                setLoadingFiles(false);
            }
        };

        loadFiles();
    }, [open, studentInfo]);

    // Load all curricula on mount
    useEffect(() => {
        const loadAllCurricula = async () => {
            setLoadingCurricula(true);
            try {
                const response = await CurriculaService.getCurriculaList(
                    studentInfo?.toProgram,
                    ""
                );
                const rawList = response.data?.data || [];

                const cleanedList = rawList
                    .filter((item: any) => item && item.id)
                    .map((item: any) => ({
                        ...item,
                        courseTitle: item.courseTitle ?? "",
                    }));

                setCurriculaList(cleanedList);
            } catch (error) {
                console.error("Error fetching curricula:", error);
                setCurriculaList([]);
            } finally {
                setLoadingCurricula(false);
            }
        };

        if (open) {
            loadAllCurricula();
        }
    }, [open, studentInfo?.toProgram]);

    const isImage = (file: File) =>
        file.type === "image/jpeg" || file.type === "image/png";

    const isPdf = (file: File) => file.type === "application/pdf";

    const openViewer = (files: File[]) => {
        const images = files.filter(isImage);
        if (!images.length) return;
        setViewerFiles(images);
        setViewerOpen(true);
    };



    const handleCurriculaSelect = (rowId: any, selectedCurricula: any) => {
        setEditableRows((prevRows) =>
            prevRows.map((row) => {
                if (row.id !== rowId) return row;

                //  IF CLEARED → RESTORE ORIGINAL VALUE
                if (!selectedCurricula) {
                    const original = originalRows.find(r => r.id === rowId);
                    return original ? { ...original } : row;
                }

                //  IF NEW VALUE SELECTED
                return {
                    ...row,
                    curricula: {
                        ...row.curricula,
                        id: selectedCurricula.id,
                        courseTitle: selectedCurricula.courseTitle,
                        year: selectedCurricula.year,
                        courseCode: selectedCurricula.courseCode,
                        units: selectedCurricula.units,
                    },
                    remarks: "Edited",
                    confidenceScore: 0,
                    isEdited: true,
                };
            })
        );
    };

    const handleOpenConfirmModal = () => {
        setConfirmModalOpen(true);
    };

    const handleCloseConfirmModal = () => {
        setConfirmModalOpen(false);
    };

    const handleAddRow = () => {
        const newRow = {
            id: `temp-${Date.now()}`,   // UI only
            transcript: {
                id: null,
                courseName: "",
                subjectCode: "",
                credits: 0,
                grade: "",
            },
            curricula: null,
            remarks: "",
            confidenceScore: 0,
            isEdited: true,
        };

        setEditableRows([...editableRows, newRow]);
    };

    const handleConfirmSave = async () => {
        setIsSaving(true);

        try {
            const payload = {
                studentId: studentInfo.studentId,
                evaluations: [
                    ...editableRows.map((row: any) => ({
                        evaluationId: typeof row.id === "number" ? row.id : null,
                        transcriptId: row.transcript?.id ?? null,
                        courseName: row.transcript?.courseName ?? "",
                        subjectCode: row.transcript?.subjectCode ?? "",
                        units: row.transcript?.credits ?? 0,
                        grade: row.transcript?.grade ?? "",
                        curriculaId: row.curricula?.id ?? null,
                        remarks: row.remarks,
                        confidenceScore: row.isEdited ? 0 : row.confidenceScore,
                        finalApproved: !!row.curricula?.id,
                        deleted: false
                    })),

                    ...deletedRows
                        .filter((row: any) => typeof row.id === "number")
                        .map((row: any) => ({
                            evaluationId: row.id,
                            transcriptId: row.transcript?.id,
                            deleted: true
                        }))
                ]
            };

            await TranscriptEvaluationService.upsertEvaluations(payload);

            setSnackbarMessage("Evaluations saved successfully!");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
            setConfirmModalOpen(false);

            // Invalidate and refresh the search transcript evaluations query
            await queryClient.invalidateQueries({ queryKey: ["searchTranscriptEvaluations"] });

            // Close modal after 3.5 seconds to let user see the alert
            setTimeout(() => {
                onClose();
                setSnackbarOpen(false);
            }, 1500);

        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || error?.message || "Failed to save evaluations. Please try again.";
            setSnackbarMessage(errorMsg);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            console.error("Update failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = () => {
        handleOpenConfirmModal();
    };

    // Check if there are any changes
    const hasChanges = () => {
        if (originalRows.length !== editableRows.length) return true;

        return editableRows.some((row, index) => {
            const original = originalRows[index];
            if (!original) return true;

            return (
                row.curricula?.id !== original.curricula?.id ||
                row.remarks !== original.remarks ||
                row.isEdited !== original.isEdited
            );
        });
    };

    // Handle cell edits
    const handleProcessRowUpdate = (newRow: any) => {
        const rowIndex = editableRows.findIndex((r) => r.id === newRow.id);
        if (rowIndex === -1) return newRow;

        const updatedRow = { ...editableRows[rowIndex] };
        let hasChanges = false;

        // Update transcript fields
        if (!updatedRow.transcript) {
            updatedRow.transcript = {};
        }
        if (newRow.courseName !== updatedRow.transcript.courseName) {
            updatedRow.transcript.courseName = newRow.courseName;
            updatedRow.isEdited = true;
            updatedRow.remarks = "Edited";
            updatedRow.confidenceScore = 0;
            hasChanges = true;
        }
        if (newRow.subjectCode !== updatedRow.transcript.subjectCode) {
            updatedRow.transcript.subjectCode = newRow.subjectCode;
            updatedRow.isEdited = true;
            updatedRow.remarks = "Edited";
            updatedRow.confidenceScore = 0;
            hasChanges = true;
        }
        if (newRow.units !== updatedRow.transcript.credits) {
            updatedRow.transcript.credits = newRow.units;
            updatedRow.isEdited = true;
            updatedRow.remarks = "Edited";
            updatedRow.confidenceScore = 0;
            hasChanges = true;
        }
        if (newRow.grade !== updatedRow.transcript.grade) {
            updatedRow.transcript.grade = newRow.grade;
            updatedRow.isEdited = true;
            updatedRow.remarks = "Edited";
            updatedRow.confidenceScore = 0;
            hasChanges = true;
        }

        // Update the state
        const newEditableRows = [...editableRows];
        newEditableRows[rowIndex] = updatedRow;
        setEditableRows(newEditableRows);

        // Return the updated row with remarks and confidence fields
        if (hasChanges) {
            return {
                ...newRow,
                remarks: "Edited",
                confidence: "--",
            };
        }

        return newRow;
    };

    // Render file preview similar to UploadingCourses
    const renderFilePreview = (files: File[]) => {
        const pdfFiles = files.filter(isPdf);
        const imageFiles = files.filter(isImage);

        if (pdfFiles.length === 0 && imageFiles.length === 0) {
            return null;
        }

        return (
            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                {/* LEFT - PDF and Images */}
                <Box sx={{ flex: 1 }}>
                    {pdfFiles.map((file, i) => (
                        <Box key={i} sx={{ mb: 2, border: "1px solid #ccc", borderRadius: 1 }}>
                            <Box sx={{ p: 1, fontWeight: 500, backgroundColor: "#f5f5f5" }}>
                                {file.name}
                            </Box>
                            <iframe
                                title={`PDF Preview - ${file.name}`}
                                src={URL.createObjectURL(file)}
                                width="100%"
                                height="400"
                                style={{ border: "none", borderRadius: "0 0 4px 4px" }}
                            />
                        </Box>
                    ))}

                    {imageFiles.length > 0 && (
                        <Box sx={{ border: "1px solid #ccc", borderRadius: 1, overflow: "hidden" }}>
                            <Box sx={{ p: 1, fontWeight: 500, backgroundColor: "#f5f5f5" }}>
                                Transcript Images ({imageFiles.length})
                            </Box>
                            <Box
                                sx={{
                                    height: 400,
                                    overflowY: "auto",
                                    p: 2,
                                    cursor: "zoom-in",
                                    backgroundColor: "#fff",
                                }}
                                onClick={() => openViewer(imageFiles)}
                            >
                                {imageFiles.map((f, i) => (
                                    <Box key={i} sx={{ mb: 2 }}>
                                        <img
                                            src={URL.createObjectURL(f)}
                                            style={{ width: "100%", borderRadius: 4 }}
                                            alt={`transcript-${i}`}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        );
    };

    // Transform evaluations data for the table
    const tableRows = editableRows.map((evaluation: any, index: number) => ({
        id: evaluation.id || index,
        courseName: evaluation.transcript?.courseName || "",
        subjectCode: evaluation.transcript?.subjectCode || "",
        units: evaluation.transcript?.credits || 0,
        curriculaUnits: evaluation.curricula?.units || 0,
        grade: evaluation.transcript?.grade || "",
        curriculaCourseTitle: evaluation.curricula?.courseTitle || "",
        curriculaId: evaluation.curricula?.id || null,
        curriculaYear: evaluation.curricula?.year || "",
        curriculaSubjectCode: evaluation.curricula?.courseCode || "",
        remarks: evaluation.remarks || "",
        confidence:
            evaluation.isEdited || evaluation.remarks === "Edited"
                ? "--"
                : evaluation.confidenceScore
                    ? `${evaluation.confidenceScore.toFixed(2)}%`
                    : "0%",
    }));


    const columns: GridColDef[] = [
        {
            field: "courseName",
            headerName: "Course Name",
            flex: 3,
            minWidth: 250,
            editable: true,
        },
        {
            field: "subjectCode",
            headerName: "Subject Code",
            headerAlign: "center",
            align: "center",
            flex: 0.8,
            minWidth: 100,
            editable: true,
        },
        {
            field: "units",
            headerName: "Units",
            headerAlign: "center",
            align: "center",
            flex: 0.6,
            minWidth: 80,
            type: "number",
            editable: true,
        },

        {
            field: "grade",
            headerName: "Grade",
            headerAlign: "center",
            align: "center",
            flex: 0.6,
            minWidth: 80,
            editable: true,
        },
        {
            field: "curriculaCourseTitle",
            headerName: "Curricula Course Title",
            flex: 2,
            minWidth: 420,
            renderCell: (params: any) => {
                const selectedOption =
                    curriculaList.find((c) => c.id === params.row.curriculaId) || null;

                return (
                    <Autocomplete
                        size="small"
                        options={curriculaList || []}
                        loading={loadingCurricula}
                        value={selectedOption}
                        getOptionLabel={(option: any) =>
                            typeof option === "string"
                                ? option
                                : option?.courseTitle ?? ""
                        }
                        isOptionEqualToValue={(option, value) =>
                            option?.id === value?.id
                        }
                        filterOptions={(options, state) =>
                            options.filter((option: any) =>
                                (option?.courseTitle ?? "")
                                    .toLowerCase()
                                    .includes(state.inputValue.toLowerCase())
                            )
                        }
                        onChange={(_, newValue) => {
                            handleCurriculaSelect(params.row.id, newValue);
                        }}
                        fullWidth
                        renderInput={(paramsInput) => (
                            <TextField
                                {...paramsInput}
                                variant="standard"
                                placeholder="Select course..."
                            />
                        )}
                    />
                );
            },
        },
        {
            field: "curriculaYear",
            headerName: "Curricula Year",
            headerAlign: "center",
            align: "center",
            flex: 0.9,
            minWidth: 120,
            editable: false,
        },
        {
            field: "curriculaSubjectCode",
            headerName: "Curricula Subject Code",
            headerAlign: "center",
            align: "center",
            flex: 1,
            minWidth: 230,
            editable: false,
        },
        {
            field: "curriculaUnits",
            headerName: "Curricula Units",
            headerAlign: "center",
            align: "center",
            flex: 0.6,
            minWidth: 80,
            type: "number",
            // editable: true,
        },
        {
            field: "remarks",
            headerName: "Remarks",
            flex: 2,
            resizable: false,
            minWidth: 230,
            editable: false,
        },
        {
            field: "confidence",
            headerName: "Confidence",
            align: "center",
            headerAlign: "center",
            flex: 0.8,
            minWidth: 100,
            editable: false,
        },
        {
            field: "actions",
            headerName: "Actions",
            width: 100,
            renderCell: (params: any) => (
                <Button
                    color="error"
                    size="small"
                    onClick={() => handleDeleteRow(params.row.id)}
                >
                    Delete
                </Button>
            )
        }
    ];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: "10px",

                },
            }}
        >
            <DialogTitle
                sx={{
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #e0e0e0",
                }}
            >
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "#064F1E" }}>
                        Evaluation Details
                    </Typography>
                    {studentInfo && (

                        <Typography variant="body1" sx={{ color: "#000", fontWeight: 600 }}>
                            {studentInfo.firstName} {studentInfo.middleName} {studentInfo.lastName}
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, backgroundColor: "#fafafa" }}>
                {/* TABS */}
                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(e, newValue) => setTabValue(newValue)}
                        sx={{
                            "& .MuiTab-root": {
                                color: "#666",
                                "&.Mui-selected": {
                                    color: "#064F1E",
                                    fontWeight: 600,
                                },
                            },
                        }}
                    >
                        <Tab label="Evaluation Details" />
                        <Tab label="Uploaded Files" />
                    </Tabs>
                </Box>

                {/* TAB 1: EVALUATION DETAILS */}
                {tabValue === 0 && (
                    <>
                        {studentInfo && (
                            <Box sx={{ mb: 3 }}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        backgroundColor: "#f9f9f9",
                                        border: "1px solid #e0e0e0",
                                    }}
                                >
                                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: "#666", fontWeight: 500 }}>
                                                From University
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "#000", fontWeight: 600 }}>
                                                {studentInfo.fromUniversity || "N/A"}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: "#666", fontWeight: 500 }}>
                                                To University
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "#000", fontWeight: 600 }}>
                                                {studentInfo.toUniversity || "N/A"}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: "#666", fontWeight: 500 }}>
                                                From Program
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "#000", fontWeight: 600 }}>
                                                {studentInfo.fromProgram || "N/A"}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: "#666", fontWeight: 500 }}>
                                                To Program
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "#000", fontWeight: 600 }}>
                                                {studentInfo.toProgram || "N/A"}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Box>
                        )}

                        <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddRow}
                                sx={{
                                    backgroundColor: "#064F1E",
                                    color: "#fff",
                                    "&:hover": {
                                        backgroundColor: "#053A16",
                                    },
                                }}
                            >
                                Add Row
                            </Button>
                        </Box>

       
                                <DataGridPro
                                    rows={tableRows}
                                    columns={columns}
                                    density="compact"
                                    disableRowSelectionOnClick
                                    processRowUpdate={handleProcessRowUpdate}
                                    onProcessRowUpdateError={(error) => {
                                        console.error("Row update error:", error);
                                    }}
                                    initialState={{
                                        pinnedColumns: {
                                            left: [
                                                "courseName",
                                            ],
                                            right: ["remarks", "confidence", "actions"],
                                        },
                                    }}
                                    sx={{
                                        height: 350,
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
                          
                    </>
                )}

                {/* TAB 2: UPLOADED FILES */}
                {tabValue === 1 && (
                    <Box>
                        {fileError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {fileError}
                            </Alert>
                        )}

                        {loadingFiles ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : uploadedFiles.transcript.length === 0 && uploadedFiles.courseDescription.length === 0 ? (
                            <Box sx={{ textAlign: "center", py: 4 }}>
                                <Typography color="textSecondary">
                                    No files uploaded for this student.
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                {/* TRANSCRIPT FILES */}
                                {uploadedFiles.transcript.length > 0 && (
                                    <Box sx={{ mb: 4 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 600,
                                                color: "#064F1E",
                                                mb: 2,
                                            }}
                                        >
                                            Transcript of Records
                                        </Typography>
                                        {renderFilePreview(uploadedFiles.transcript)}
                                    </Box>
                                )}

                                {/* COURSE DESCRIPTION FILES */}
                                {uploadedFiles.courseDescription.length > 0 && (
                                    <Box sx={{ mb: 4 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 600,
                                                color: "#064F1E",
                                                mb: 2,
                                            }}
                                        >
                                            Course Description
                                        </Typography>
                                        {renderFilePreview(uploadedFiles.courseDescription)}
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                )}

                {/* IMAGE VIEWER */}
                {viewerOpen && (
                    <ImageViewer
                        images={viewerFiles}
                        open={viewerOpen}
                        onClose={() => setViewerOpen(false)}
                    />
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    p: 2,
                    backgroundColor: "#f5f5f5",
                    borderTop: "1px solid #e0e0e0",
                }}
            >
                <Button onClick={onClose} variant="outlined" sx={{ color: "#666" }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    // disabled={isSaving || !hasChanges()}
                    sx={{
                        backgroundColor: "#064F1E",
                        color: "#fff",
                        "&:hover": {
                            backgroundColor: "#053A16",
                        },
                        "&:disabled": {
                            backgroundColor: "#ccc",
                            color: "#999",
                        },
                    }}
                >
                    {isSaving ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Saving...
                        </>
                    ) : (
                        "Approve"
                    )}
                </Button>
            </DialogActions>

            {/* CONFIRMATION MODAL */}
            <Dialog
                open={confirmModalOpen}
                onClose={handleCloseConfirmModal}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 600, color: "#064F1E" }}>
                    Confirm Approve
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mt: 2 }}>
                        Are you sure you want to approve the evaluation? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={handleCloseConfirmModal}
                        variant="outlined"  
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmSave}
                        variant="contained"
                        disabled={isSaving}
                        sx={{
                            backgroundColor: "#064F1E",
                            "&:hover": {
                                backgroundColor: "#053A16",
                            },
                            "&:disabled": {
                                backgroundColor: "#ccc",
                            },
                        }}
                    >
                        {isSaving ? (
                            <>
                                <CircularProgress size={20} sx={{ mr: 1 }} />
                                Saving...
                            </>
                        ) : (
                            "Submit"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                anchorOrigin={{
                    vertical: "bottom" as const,
                    horizontal: "right" as const,
                }}
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default EvaluationDetailModal;
