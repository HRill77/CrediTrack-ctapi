import React, { useState, useContext } from "react";
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
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/UpdatePassword.css";
import AuthService from "../../shared/services/AuthService";
import { SnackbarContext } from "../../shared/context/SnackbarContext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { GhostButton, MainButton, SecondaryButton } from "../utils/buttonsUtility";

const UpdatePassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openSnack, closeSnack, showSuccess, showError } = useContext(SnackbarContext);
  const [successMessage, setSuccessMessage] = useState("");

  // Email passed from login
  const email = location.state?.email;

  const [form, setForm] = useState({
    tempPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [show, setShow] = useState({
    temp: false,
    new: false,
    confirm: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // // Prevent direct access
  // if (!email) {
  //   navigate("/", { replace: true });
  // }

  const handleChange =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [field]: e.target.value });
    };

  const validate = () => {
    if (!form.tempPassword || !form.newPassword || !form.confirmPassword) {
      setError("All fields are required.");
      return false;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return false;
    }

    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }

    if(!/[A-Z]/.test(form.newPassword)){
      setError("Password must contain at least one uppercase letter.");
      return false;
    }
    if(!/[a-z]/.test(form.newPassword)){
      setError("Password must contain at least one lowercase letter.");
      return false;
    }
    if(!/[0-9]/.test(form.newPassword)){
      setError("Password must contain at least one number.");
      return false;
    }

    if (!/[!@#$%^&*(),.?\"':{}|<>~`]/.test(form.newPassword)) {
  setError("Password must contain at least one special character.");
  return false;
}


    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      await AuthService.updateTemporaryPassword({
        email,
        currentPassword: form.tempPassword,
        newPassword: form.newPassword,
      });
setSuccessMessage("Password updated successfully!");
      
      // Navigate after showing success message
            setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
  
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Unable to update password. Please try again.";
      setError(errorMsg);
      showError(errorMsg);
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
            Update Your Password
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={1}
            mb={2}
          >
            For security reasons, you must change your temporary password.
          </Typography>

          {error && (
            <Alert severity="warning"   sx={{
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
           <Alert severity="success"   sx={{
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
            </Alert> }

          {/* Temporary Password */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Temporary Password</InputLabel>
            <OutlinedInput
              type={show.temp ? "text" : "password"}
              value={form.tempPassword}
              onChange={handleChange("tempPassword")}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton onClick={() => setShow({ ...show, temp: !show.temp })}>
                    {show.temp ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Temporary Password"
            />
            <FormHelperText>Password sent to your email</FormHelperText>
          </FormControl>

          {/* New Password */}
          <FormControl fullWidth margin="normal">
            <InputLabel>New Password</InputLabel>
            <OutlinedInput
              type={show.new ? "text" : "password"}
              value={form.newPassword}
              onChange={handleChange("newPassword")}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton onClick={() => setShow({ ...show, new: !show.new })}>
                    {show.new ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="New Password"
            />
            <FormHelperText>
              At least 8 characters: uppercase, lowercase, number & symbol
            </FormHelperText>
          </FormControl>

          {/* Confirm Password */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Re-enter New Password</InputLabel>
            <OutlinedInput
              type={show.confirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={() =>
                      setShow({ ...show, confirm: !show.confirm })
                    }
                  >
                    {show.confirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Re-enter New Password"
            />
          </FormControl>

          <MainButton
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 3, fontWeight: 600 }}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Updating..." : "Update Password"}
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

export default UpdatePassword;
