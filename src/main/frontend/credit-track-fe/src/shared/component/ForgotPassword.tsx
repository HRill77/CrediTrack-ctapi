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
import { GhostButton, MainButton, SecondaryButton } from "../utils/buttonsUtility";
import AuthService from "../services/AuthService";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState("");

  // Email passed from login
  const email = location.state?.email;

  const [form, setForm] = useState({
    email: "",
  });



  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // // Prevent direct access - only on mount
  // useEffect(() => {
  //   if (!email) {
  //     navigate("/", { replace: true });
  //   }
  // }, [email, navigate]);

  const handleChange =
    (field: keyof typeof form) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [field]: e.target.value });
      };

  const validate = () => {
    //     if (!form.tempPassword || !form.newPassword || !form.confirmPassword) {
    //       setError("All fields are required.");
    //       return false;
    //     }

    //     if (form.newPassword !== form.confirmPassword) {
    //       setError("New passwords do not match.");
    //       return false;
    //     }

    //     if (form.newPassword.length < 8) {
    //       setError("Password must be at least 8 characters long.");
    //       return false;
    //     }

    //     if(!/[A-Z]/.test(form.newPassword)){
    //       setError("Password must contain at least one uppercase letter.");
    //       return false;
    //     }
    //     if(!/[a-z]/.test(form.newPassword)){
    //       setError("Password must contain at least one lowercase letter.");
    //       return false;
    //     }
    //     if(!/[0-9]/.test(form.newPassword)){
    //       setError("Password must contain at least one number.");
    //       return false;
    //     }

    //     if (!/[!@#$%^&*(),.?\"':{}|<>~`]/.test(form.newPassword)) {
    //   setError("Password must contain at least one special character.");
    //   return false;
    // }


    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      const response = await AuthService.forgotPassword(form.email);

      setSuccessMessage(response.data.message);

      // Navigate after showing success message
      console.log("Response data:", response.status);
      if (response.status === 200) {
            setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);}

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

  return (
    <Box
      className="update-password-container"
    >
      <Card sx={{ maxWidth: 420, width: "100%", p: 1 }}>
        <GhostButton
          variant="text"
          size="large"
          sx={{ fontWeight: 600 }}
          disabled={loading}
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/", { replace: true })}
        >
          Back to Home
        </GhostButton>
        <CardContent>

          <Typography variant="h6" fontWeight={700} textAlign="center">
            Forgot Password
          </Typography>

          {/* <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={1}
            mb={2}
          >
            Don't worry! Enter your institutional email and we'll send you a password reset link.
          </Typography> */}

          {error && (
            <Alert severity="warning" sx={{
              fontSize: "0.75rem",
              py: 0.5,
              px: 1,
              minHeight: "auto",
              alignItems: "center",
              "& .MuiAlert-icon": {
                fontSize: "1rem",
                mr: 0.5,
              },
              "& .MuiAlert-message": {
                padding: 0,
              },
            }}>
              {error}
            </Alert>
          )}

          {successMessage &&
            <Alert severity="success" sx={{
              fontSize: "0.75rem",
              py: 0.5,
              px: 1,
              minHeight: "auto",
              alignItems: "center",
              "& .MuiAlert-icon": {
                fontSize: "1rem",
                mr: 0.5,
              },
              "& .MuiAlert-message": {
                padding: 0,
              },
            }}>
              {successMessage}
            </Alert>}

          {/* Temporary Password */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Institutional Email</InputLabel>
            <OutlinedInput
              type={"email"}
              value={form.email}
              onChange={handleChange("email")}
              autoComplete="email"
              placeholder="name@wesleyan.edu.ph"
              label="Institutional Email"
            />
            <FormHelperText>Enter your institutional email to reset your password</FormHelperText>
          </FormControl>

          {/* New Password */}


          <MainButton
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 3, fontWeight: 600 }}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Submitting..." : "Submit"}
          </MainButton>

        </CardContent>
      </Card>

      {/* <Snackbar
        anchorOrigin={{
          vertical: "bottom" as const,
          horizontal: "right" as const,
        }}
        open={openSnack.isSuccess}
        autoHideDuration={3000}
        onClose={closeSnack}
        message={openSnack.message}
      >
        <Alert
          onClose={closeSnack}
          severity={openSnack.isSuccess ? "success" : "warning"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {openSnack.message}
        </Alert>
      </Snackbar> */}
    </Box>
  );
};

export default ForgotPassword;
