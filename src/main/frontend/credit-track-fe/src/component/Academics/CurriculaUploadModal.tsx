import React, { useState } from 'react'
import { BootstrapDialog } from '../../shared/utils/uiUtility';
import { Box, Button, DialogActions, DialogContent, DialogTitle, IconButton, Typography, Alert, TextField, FormControl, InputLabel, Select, MenuItem, Snackbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CurriculaService from '../../shared/services/CurriculaService';
import { useQueryClient } from '@tanstack/react-query';
import CustomSnackbar from '../../shared/component/CustomSnackbar';
import CourseService from '../../shared/services/CourseService';
import { Axios, AxiosResponse } from 'axios';

interface CurriculaUploadModalProps {
    open: boolean;
    handleClose: () => void;
    uploadType?: 'curricula' | 'syllabi';
}

const CurriculaUploadModal: React.FC<CurriculaUploadModalProps> = ({ open, handleClose, uploadType }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const queryClient = useQueryClient();

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
            if (!validTypes.includes(file.type)) {
                setError('Please select a valid Excel (.xlsx, .xls) or CSV file');
                setSelectedFile(null);
                return;
            }
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            let response: any;
            if (uploadType === 'curricula') {
                response = await CurriculaService.uploadCurricula(formData);
            } else if (uploadType === 'syllabi') {
                response = await CourseService.uploadCourses(formData);
            }

            console.log('Upload response:', response);

            if (response.status === 200 || response.status === 201) {
                setSnackbarOpen(true);
                setSnackbarMessage('File uploaded successfully');
                
            } else {
                setError('Failed to upload file. Please try again.');
            }


            setSelectedFile(null);
              setLoading(false);
            // Clear success message after 3 seconds and close modal
            setTimeout(() => {
                setSnackbarOpen(false);
                handleClose();
            }, 3000);
            // Refresh the curricula table
            queryClient.invalidateQueries({ queryKey: ['get'] });
        } catch (err: any) {
            setLoading(false);
            setError(err.response?.data?.message || 'Failed to upload file. Please try again.');
        }
    };

    const handleCloseModal = () => {
        setSelectedFile(null);
        setSnackbarMessage('');
        setError(null);
        handleClose();
    };

    return (
        <BootstrapDialog onClose={handleCloseModal} open={open} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, color: '#064F1E', fontWeight: 'bold' }}>
                Upload Curricula
                <IconButton
                    aria-label="close"
                    onClick={handleCloseModal}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: '#494b4a' }}>
                        Supported file types: Excel (.xlsx, .xls)
                    </Typography>

                    <Box
                        sx={{
                            border: '2px dashed #064F1E',
                            borderRadius: '8px',
                            padding: '40px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s',
                            backgroundColor: selectedFile ? '#f0f7f0' : '#ffffff',
                            '&:hover': {
                                backgroundColor: '#f0f7f0',
                            }
                        }}
                        component="label"
                    >
                        <input
                            hidden
                            accept=".xlsx,.xls"
                            type="file"
                            onChange={handleFileSelect}
                            disabled={loading}
                        />
                        <CloudUploadIcon sx={{ fontSize: 48, color: '#064F1E', mb: 1 }} />
                        <Typography variant="body1" sx={{ color: '#064F1E', fontWeight: 'bold', mb: 1 }}>
                            Click to select file
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#994b4a' }}>
                            or drag and drop your file here
                        </Typography>
                        {selectedFile && (
                            <Typography variant="body2" sx={{ mt: 2, color: '#064F1E', fontWeight: 'bold' }}>
                                Selected: {selectedFile.name}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleCloseModal} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleUpload}
                    variant="contained"
                    // loading={loading}
                    // loadingPosition="end"
                    sx={{
                        color: '#fff',
                        backgroundColor: '#064F1E',
                        // '&.MuiLoadingButton-loading': {
                        //     color: '#fff !important',
                        // },
                        // '& .MuiLoadingButton-loadingIndicator': {
                        //     color: '#fff !important',
                        // },
                    }}
                //   disabled={!selectedFile || loading}
                >
                    
                    {loading ? 'Uploading...' : 'Upload'}
                </Button>
            </DialogActions>

            <CustomSnackbar
                        open={snackbarOpen}
                        message={snackbarMessage}
                        severity='success'
                        onClose={handleSnackbarClose}
                    />
        </BootstrapDialog>
    );
};

export default CurriculaUploadModal;
