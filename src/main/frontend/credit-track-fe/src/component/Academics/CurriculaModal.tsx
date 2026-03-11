import React, { useState } from "react";
import {
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    OutlinedInput,
    Button,
    Box,
    IconButton,
    Typography,
    FormHelperText,
    Dialog,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { BootstrapDialog } from "../../shared/utils/uiUtility";
import { CurriculaInterface } from "../../shared/interface/CurriculaInterface";
import CurriculaService from "../../shared/services/CurriculaService";
import CustomSnackbar from "../../shared/component/CustomSnackbar";

interface CurriculaModalProps {
    open: boolean;
    formData: CurriculaInterface | null;
    originalFormData: CurriculaInterface | null;
    onClose: () => void;
    onFormChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => void;
    showConfirm: boolean;
    setShowConfirm: (open: boolean) => void;
    onSave: () => void;
    isSaving: boolean;
  

}


const CurriculaModal: React.FC<CurriculaModalProps> = ({
    open,
    formData,
    originalFormData,
    onClose,
    onFormChange,
    showConfirm,
    setShowConfirm,
    onSave,
    isSaving,

}) => {
    // Check if there are any changes from the original data
    const hasChanges = (): boolean => {
        if (!formData || !originalFormData) return false;
        
        return (
            formData.programTitle !== originalFormData.programTitle ||
            formData.programCode !== originalFormData.programCode ||
            formData.year !== originalFormData.year ||
            formData.semester !== originalFormData.semester ||
            formData.courseCode !== originalFormData.courseCode ||
            formData.courseTitle !== originalFormData.courseTitle ||
            formData.preRequisite !== originalFormData.preRequisite ||
            formData.lec !== originalFormData.lec ||
            formData.lab !== originalFormData.lab ||
            formData.units !== originalFormData.units
        );
    };


    const validateForm = (): boolean => {
        const newErrors: Partial<any> = {};
        if (!formData || !String(formData.programTitle || "").trim())
            newErrors.programTitle = "Program title is required";
        if (!formData || !String(formData.programCode || "").trim())
            newErrors.programCode = "Program code is required";
        if (!formData || !String(formData.year || "").trim())
            newErrors.year = "Year is required";
        if (!formData || !String(formData.semester || "").trim())
            newErrors.semester = "Semester is required";
        if (!formData || !String(formData.courseCode || "").trim())
            newErrors.courseCode = "Course code is required";
        if (!formData || !String(formData.courseTitle || "").trim())
            newErrors.courseTitle = "Course title is required";
        if (!formData || formData.lec === null || formData.lec === undefined)
            newErrors.lec = "Lecture hours is required";
        if (!formData || formData.lab === null || formData.lab === undefined)
            newErrors.lab = "Lab hours is required";
        if (!formData || formData.units === null || formData.units === undefined)
            newErrors.units = "Units is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = () => {
        if (!validateForm()) return;
        if (!hasChanges()) {
            // alert("No changes were made");
            return;
        }
      setShowConfirm(true);
    };


    const [errors, setErrors] = useState<Partial<CurriculaInterface>>({});
   
   

    return (
        <BootstrapDialog
            onClose={onClose}
            open={open}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle sx={{ m: 0, p: 2, fontSize: "20px" }}>
                Edit Curricula
            </DialogTitle>

            <IconButton
                aria-label="close"
                onClick={onClose}
                sx={(theme) => ({
                    position: "absolute",
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
            >
                <CloseIcon />
            </IconButton>

            <DialogContent dividers>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {/* Row 1 */}
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <FormControl fullWidth variant="outlined">
                            <Typography
                                variant="body2"
                                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
                            >
                                Program Title :
                            </Typography>
                            <OutlinedInput
                                size="small"
                                name="programTitle"
                                type="text"
                                value={formData?.programTitle || ""}
                                onChange={onFormChange}
                                placeholder="Enter program title"
                                sx={{ backgroundColor: "#fff" }}
                                required
                            />
                            {errors.programTitle && (
                                <FormHelperText error>{errors.programTitle}</FormHelperText>
                            )}
                        </FormControl>

                        <FormControl fullWidth variant="outlined">
                            <Typography
                                variant="body2"
                                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
                            >
                                Program Code :
                            </Typography>
                            <OutlinedInput
                                size="small"
                                name="programCode"
                                value={formData?.programCode || ""}
                                onChange={onFormChange}
                                required
                            />
                            {errors.programCode && (
                                <FormHelperText error>{errors.programCode}</FormHelperText>
                            )}
                        </FormControl>
                    </Box>

                    {/* Row 2 */}
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <FormControl fullWidth variant="outlined">
                            <Typography
                                variant="body2"
                                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
                            >
                                Year :
                            </Typography>
                            <OutlinedInput
                                size="small"
                                name="year"
                                value={formData?.year || ""}
                                onChange={onFormChange}
                                required
                            />
                            {errors.year && (
                                <FormHelperText error>{errors.year}</FormHelperText>
                            )}
                        </FormControl>

                        <FormControl fullWidth variant="outlined">
                            <Typography
                                variant="body2"
                                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
                            >
                                Semester :
                            </Typography>
                            <OutlinedInput
                                size="small"
                                name="semester"
                                value={formData?.semester || ""}
                                onChange={onFormChange}
                                required
                            />
                            {errors.semester && (
                                <FormHelperText error>{errors.semester}</FormHelperText>
                            )}
                        </FormControl>
                    </Box>

                    {/* Row 3 */}
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <FormControl fullWidth variant="outlined">
                            <Typography
                                variant="body2"
                                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
                            >
                                Course Code :
                            </Typography>
                            <OutlinedInput
                                size="small"
                                name="courseCode"
                                value={formData?.courseCode || ""}
                                onChange={onFormChange}
                                required
                            />
                            {errors.courseCode && (
                                <FormHelperText error>{errors.courseCode}</FormHelperText>
                            )}
                        </FormControl>

                        <FormControl fullWidth variant="outlined">
                            <Typography
                                variant="body2"
                                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
                            >
                                Course Title :
                            </Typography>
                            <OutlinedInput
                                size="small"
                                name="courseTitle"
                                value={formData?.courseTitle || ""}
                                onChange={onFormChange}
                                required
                            />
                            {errors.courseTitle && (
                                <FormHelperText error>{errors.courseTitle}</FormHelperText>
                            )}
                        </FormControl>
                    </Box>

                    {/* Row 4 */}
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <FormControl fullWidth variant="outlined">
                            <Typography
                                variant="body2"
                                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
                            >
                                Pre-Requisite :
                            </Typography>
                            <OutlinedInput
                                size="small"
                                name="preRequisite"
                                value={formData?.preRequisite || ""}
                                onChange={onFormChange}
                            />
                        </FormControl>
                    </Box>

                    {/* Row 5 */}
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <FormControl fullWidth variant="outlined">
                            <Typography
                                variant="body2"
                                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
                            >
                                Lecture Hours :
                            </Typography>
                            <OutlinedInput
                                size="small"
                                name="lec"
                                type="number"
                                value={formData?.lec || ""}
                                onChange={onFormChange}
                                inputProps={{ min: 0 }}
                                required
                            />
                            {errors.lec && (
                                <FormHelperText error>{errors.lec}</FormHelperText>
                            )}
                        </FormControl>

                        <FormControl fullWidth variant="outlined">
                            <Typography
                                variant="body2"
                                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
                            >
                                Lab Hours :
                            </Typography>
                            <OutlinedInput
                                size="small"
                                name="lab"
                                type="number"
                                value={formData?.lab || ""}
                                onChange={onFormChange}
                                inputProps={{ min: 0 }}
                                required
                            />
                            {errors.lab && (
                                <FormHelperText error>{errors.lab}</FormHelperText>
                            )}
                        </FormControl>

                        <FormControl fullWidth variant="outlined">
                            <Typography
                                variant="body2"
                                sx={{ mb: 0.5, fontWeight: 500, color: "#333" }}
                            >
                                Units :
                            </Typography>
                            <OutlinedInput
                                size="small"
                                name="units"
                                type="number"
                                value={formData?.units || ""}
                                onChange={onFormChange}
                                inputProps={{ min: 0 }}
                                required
                            />
                            {errors.units && (
                                <FormHelperText error>{errors.units}</FormHelperText>
                            )}
                        </FormControl>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} sx={{ color: "#064F1E" }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!hasChanges()}
                    sx={{
                        backgroundColor: hasChanges() ? "#064F1E" : "#ccc",
                        "&:hover": { backgroundColor: hasChanges() ? "#053A16" : "#ccc" },
                    }}
                >
                    Submit
                </Button>
            </DialogActions>

            <Dialog open={showConfirm} onClose={() => !isSaving && setShowConfirm(false)}>
                <DialogTitle>Confirm Update</DialogTitle>

                <DialogContent>
                    <Typography>
                        Are you sure you want to update this curricula{" "}
                        <strong>{formData?.courseTitle}</strong>?
                    </Typography>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => setShowConfirm(false)}
                        disabled={isSaving}
                        sx={{ color: "#064F1E" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={onSave}
                        disabled={isSaving}
                        sx={{
                            backgroundColor: "#064F1E",
                            "&:hover": { backgroundColor: "#053A16" },
                        }}
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            
        </BootstrapDialog>
    );
};

export default CurriculaModal;
