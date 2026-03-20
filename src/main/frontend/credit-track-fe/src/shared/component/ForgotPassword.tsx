import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
  Alert,
  Snackbar,
} from "@mui/material";

import { useLocation, useNavigate } from "react-router-dom";
import "../css/UpdatePassword.css";

import { SnackbarContext } from "../context/SnackbarContext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  GhostButton,
  MainButton,
  SecondaryButton,
} from "../utils/buttonsUtility";
import AuthService from "../services/AuthService";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState("");
  const email = location.state?.email;
  const [form, setForm] = useState({ email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [field]: e.target.value });
    };

  const validate = () => true;

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const response = await AuthService.forgotPassword(form.email);
      setSuccessMessage(response.data.message);
      if (response.status === 200) {
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 2000);
      }
    } catch (err: any) {
      let errorMsg = "Something went wrong. Please try again.";
      if (err.response) {
        switch (err.response.status) {
          case 404:
            errorMsg = "Email address not found.";
            break;
          case 429:
            errorMsg = "Too many requests. Please try again later.";
            break;
          case 500:
            errorMsg = "Server error. Please try again later.";
            break;
          default:
            errorMsg = err.response.data?.message || errorMsg;
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const alertSx = {
    fontSize: "clamp(0.65rem, 1.8vw, 0.75rem)",
    py: 0.5,
    px: 1,
    minHeight: "auto",
    alignItems: "center",
    "& .MuiAlert-icon": { fontSize: "1rem", mr: 0.5 },
    "& .MuiAlert-message": { padding: 0 },
  };

  return (
    <Box
      className="update-password-container"
      sx={{ px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 4 } }}
    >
      <Card sx={{ maxWidth: 420, width: "100%", mx: 2, p: { xs: 2, sm: 3 } }}>
        <GhostButton
          variant="text"
          size="medium"
          sx={{ fontWeight: 600, fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}
          disabled={loading}
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/", { replace: true })}
        >
          Back to Home
        </GhostButton>

        <CardContent sx={{ px: { xs: 1, sm: 2 }, pb: 2 }}>
          <Typography
            variant="h6"
            fontWeight={700}
            textAlign="center"
            sx={{ fontSize: "clamp(1rem, 3vw, 1.25rem)" }}
          >
            Forgot Password
          </Typography>

          {error && (
            <Alert severity="warning" sx={alertSx}>
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={alertSx}>
              {successMessage}
            </Alert>
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>
              Institutional Email
            </InputLabel>
            <OutlinedInput
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              autoComplete="email"
              placeholder="name@wesleyan.edu.ph"
              label="Institutional Email"
              sx={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}
            />
            <FormHelperText sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)" }}>
              Enter your institutional email to reset your password
            </FormHelperText>
          </FormControl>

          <MainButton
            variant="contained"
            fullWidth
            size="large"
            sx={{
              mt: 3,
              fontWeight: 600,
              fontSize: "clamp(0.8rem, 2.2vw, 1rem)",
            }}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Submitting..." : "Submit"}
          </MainButton>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
