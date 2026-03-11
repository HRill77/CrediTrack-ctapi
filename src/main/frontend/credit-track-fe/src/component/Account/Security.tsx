import React, { FC, ChangeEvent } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../shared/context/AuthContext";
import UserService from "../../shared/services/UserService";

const green = "#0b5f2a";

const SectionTitle: FC<{ title: string }> = ({ title }) => (
  <Box display="flex" alignItems="center" mb={2} sx={{ width: "100%" }}>
    <Typography
      fontWeight="bold"
      sx={{
        fontSize: "clamp(1rem, 3vw, 1.625rem)",
        mr: 1,
        color: green,
        whiteSpace: "nowrap",
      }}
    >
      {title}
    </Typography>
    <Box flexGrow={1} height={3} bgcolor={green} />
  </Box>
);

const labelSx = {
  fontWeight: "bold",
  fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
  mb: 1,
};
const inputSx = { fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" };

const Security: FC = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [passwords, setPasswords] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = React.useState("");
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [showPasswords, setShowPasswords] = React.useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const handlePasswordChange =
    (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
      setPasswords({ ...passwords, [field]: e.target.value });
    };

  const handleTogglePasswordVisibility = (field: string) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field as keyof typeof showPasswords],
    });
  };

  const validate = () => {
    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      setError("All fields are required.");
      return false;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New passwords do not match.");
      return false;
    }
    if (passwords.newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }
    if (!/[A-Z]/.test(passwords.newPassword)) {
      setError("Password must contain at least one uppercase letter.");
      return false;
    }
    if (!/[a-z]/.test(passwords.newPassword)) {
      setError("Password must contain at least one lowercase letter.");
      return false;
    }
    if (!/[0-9]/.test(passwords.newPassword)) {
      setError("Password must contain at least one number.");
      return false;
    }
    if (!/[!@#$%^&*(),.?\"':{}|<>~`]/.test(passwords.newPassword)) {
      setError("Password must contain at least one special character.");
      return false;
    }
    return true;
  };

  const handleApplyChanges = () => {
    setError("");
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const handleConfirmUpdate = async () => {
    try {
      setIsLoading(true);
      await UserService.updatePassword(
        currentUser?.username || "",
        passwords.currentPassword,
        passwords.newPassword,
      );
      setSnackbar({
        open: true,
        message: "Password updated successfully",
        severity: "success",
      });
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setConfirmOpen(false);
      setTimeout(() => {
        logout();
        navigate("/");
      }, 1500);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to update password";
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
      setConfirmOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, md: 3 },
        boxSizing: "border-box",
      }}
    >
      <SectionTitle title="Account Log In" />

      <Box
        bgcolor="#fff"
        p={{ xs: 2, sm: 3 }}
        borderRadius={1}
        boxShadow={1}
        mb={4}
      >
        <Box display="flex" flexDirection="column" gap={2}>
          <Box>
            <Typography sx={labelSx}>Current Password:</Typography>
            <TextField
              placeholder="Enter current password"
              type={showPasswords.currentPassword ? "text" : "password"}
              fullWidth
              size="small"
              value={passwords.currentPassword}
              onChange={handlePasswordChange("currentPassword")}
              error={error !== "" && !passwords.currentPassword}
              helperText={
                error !== "" && !passwords.currentPassword
                  ? "Current password is required"
                  : ""
              }
              InputProps={{
                sx: inputSx,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() =>
                        handleTogglePasswordVisibility("currentPassword")
                      }
                    >
                      {showPasswords.currentPassword ? (
                        <VisibilityOff />
                      ) : (
                        <Visibility />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box>
            <Typography sx={labelSx}>New Password:</Typography>
            <TextField
              placeholder="Enter new password"
              type={showPasswords.newPassword ? "text" : "password"}
              fullWidth
              size="small"
              value={passwords.newPassword}
              onChange={handlePasswordChange("newPassword")}
              error={error !== ""}
              helperText={error}
              InputProps={{
                sx: inputSx,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() =>
                        handleTogglePasswordVisibility("newPassword")
                      }
                    >
                      {showPasswords.newPassword ? (
                        <VisibilityOff />
                      ) : (
                        <Visibility />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box>
            <Typography sx={labelSx}>Confirm Password:</Typography>
            <TextField
              placeholder="Re-enter new password"
              type={showPasswords.confirmPassword ? "text" : "password"}
              fullWidth
              size="small"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange("confirmPassword")}
              error={
                error !== "" &&
                passwords.confirmPassword !== passwords.newPassword
              }
              helperText={
                error !== "" &&
                passwords.confirmPassword !== passwords.newPassword
                  ? "Passwords do not match"
                  : ""
              }
              InputProps={{
                sx: inputSx,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() =>
                        handleTogglePasswordVisibility("confirmPassword")
                      }
                    >
                      {showPasswords.confirmPassword ? (
                        <VisibilityOff />
                      ) : (
                        <Visibility />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
      </Box>

      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
        <Typography
          sx={{
            fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
            color: "text.secondary",
            textAlign: "center",
          }}
        >
          Please be informed that changes in your password affect the system.
        </Typography>
        <Button
          variant="contained"
          sx={{ bgcolor: green, fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
          onClick={handleApplyChanges}
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Apply Changes"}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%", fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, boxShadow: 3 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            fontSize: "clamp(0.9rem, 2.5vw, 1.125rem)",
            color: green,
          }}
        >
          Confirm Password Update
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Typography sx={{ fontSize: "clamp(0.75rem, 2vw, 1rem)" }}>
            Are you sure you want to update your password? You will be logged
            out after this action.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmOpen(false)}
            disabled={isLoading}
            sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: green, fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
            onClick={handleConfirmUpdate}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Security;
