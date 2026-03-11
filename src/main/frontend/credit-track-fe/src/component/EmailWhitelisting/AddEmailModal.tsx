import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import WhiteListService from "../../shared/services/WhiteListService";

interface AddEmailModalProps {
  open: boolean;
  handleClose: () => void;
}

const AddEmailModal: React.FC<AddEmailModalProps> = ({ open, handleClose }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError("");
    setError("");

    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    }
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await WhiteListService.addEmail(email);
      if (response.status === 200) {
        handleClose();
        setEmail("");
        setEmailError("");
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("This email already exists in the whitelist");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to add email. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEmail("");
    setEmailError("");
    setError("");
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "600", color: "064F1E" }}>
        Add New Email to Whitelist
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Email Address"
            type="email"
            variant="outlined"
            value={email}
            onChange={handleEmailChange}
            error={!!emailError}
            helperText={emailError}
            disabled={loading}
            placeholder="example@domain.com"
            sx={{
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": {
                  borderColor: "#064F1E",
                },
              },
              "& .MuiInputLabel-root": {
                "&.Mui-focused": {
                  color: "#064F1E",
                },
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleCancel} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !!emailError || !email.trim()}
          sx={{
            backgroundColor: "#064F1E",
            "&:hover": { backgroundColor: "#053A16" },
          }}
        >
          {loading ? <CircularProgress size={24} /> : "Add Email"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEmailModal;
