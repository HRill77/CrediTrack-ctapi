import React, { FC, ChangeEvent } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  userRoleOtions,
  userSuffixOptions,
} from "../../shared/Constant/UsersOptions";
import UserService from "../../shared/services/UserService";
import { AuthContext } from "../../shared/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

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

const getRoleLabel = (authority: string): string => {
  const role = userRoleOtions.find((r) => r.value === authority);
  return role ? role.label : "";
};

const labelSx = {
  fontWeight: "bold",
  fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
  mb: 1,
};

const inputSx = { fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" };

const Profile: FC<{ admin: any; setAdmin: any }> = ({ admin, setAdmin }) => {
  const { getCurrentUser } = React.useContext(AuthContext);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(admin);
  const [errors, setErrors] = React.useState<{
    firstName?: string;
    lastName?: string;
  }>({});
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  React.useEffect(() => {
    setDraft(admin);
  }, [admin]);

  const handleChange =
    (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
      setDraft({ ...draft, [field]: e.target.value });
    };

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setDraft({
        ...draft,
        avatar: URL.createObjectURL(file),
        avatarFile: file,
      });
    }
  };

  const handleCancel = () => {
    setDraft(admin);
    setIsEditing(false);
    setErrors({});
  };

  const handleSubmit = () => {
    const newErrors: { firstName?: string; lastName?: string } = {};
    if (!draft?.firstName) newErrors.firstName = "First Name is required";
    if (!draft?.lastName) newErrors.lastName = "Last Name is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setConfirmOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      const profileRequest = {
        firstName: draft?.firstName || "",
        lastName: draft?.lastName || "",
        middleName: draft?.middleName || "",
        suffix: draft?.suffix || "",
        email: draft?.username || "",
      };
      formData.append(
        "profile",
        new Blob([JSON.stringify(profileRequest)], {
          type: "application/json",
        }),
      );
      if (draft?.avatarFile && draft.avatarFile instanceof File) {
        formData.append("image", draft.avatarFile);
      }
      await UserService.updateProfile(formData);
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await queryClient.refetchQueries({ queryKey: ["user"] });
      await getCurrentUser();
      setIsEditing(false);
      setConfirmOpen(false);
      setSnackbar({
        open: true,
        message: "Profile updated successfully",
        severity: "success",
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to update profile";
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
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
      {/* HEADER WITH UPDATE BUTTON */}
      <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SectionTitle title="Personal Information" />
        </Box>
        {!isEditing && (
          <Button
            variant="contained"
            sx={{
              bgcolor: green,
              fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
              whiteSpace: "nowrap",
              flexShrink: 0,
              mt: 0.5,
            }}
            onClick={() => setIsEditing(true)}
          >
            Update Profile
          </Button>
        )}
      </Box>

      {/* FORM FIELDS */}
      <Box
        bgcolor="#fff"
        p={{ xs: 2, sm: 3 }}
        borderRadius={1}
        boxShadow={1}
        mb={4}
      >
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
          gap={{ xs: 2, sm: 3 }}
        >
          {!isEditing ? (
            <Box>
              <Typography sx={labelSx}>Full Name:</Typography>
              <TextField
                value={draft?.fullName || ""}
                disabled
                size="small"
                fullWidth
                InputProps={{ sx: inputSx }}
              />
            </Box>
          ) : (
            <>
              <Box>
                <Typography sx={labelSx}>
                  First Name: <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  value={draft?.firstName || ""}
                  onChange={handleChange("firstName")}
                  size="small"
                  fullWidth
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  InputProps={{ sx: inputSx }}
                  FormHelperTextProps={{
                    sx: { fontSize: "clamp(0.6rem, 1.5vw, 0.75rem)" },
                  }}
                />
              </Box>
              <Box>
                <Typography sx={labelSx}>Middle Name:</Typography>
                <TextField
                  value={draft?.middleName || ""}
                  onChange={handleChange("middleName")}
                  size="small"
                  fullWidth
                  InputProps={{ sx: inputSx }}
                />
              </Box>
              <Box>
                <Typography sx={labelSx}>
                  Last Name: <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  value={draft?.lastName || ""}
                  onChange={handleChange("lastName")}
                  size="small"
                  fullWidth
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  InputProps={{ sx: inputSx }}
                  FormHelperTextProps={{
                    sx: { fontSize: "clamp(0.6rem, 1.5vw, 0.75rem)" },
                  }}
                />
              </Box>
              <Box>
                <Typography sx={labelSx}>Suffix:</Typography>
                <Select
                  value={draft?.suffix || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, suffix: e.target.value })
                  }
                  size="small"
                  fullWidth
                  sx={inputSx}
                >
                  <MenuItem value="" sx={inputSx}>
                    None
                  </MenuItem>
                  {userSuffixOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      sx={inputSx}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </>
          )}

          <Box>
            <Typography sx={labelSx}>Institutional Email:</Typography>
            <TextField
              value={draft?.username || ""}
              onChange={handleChange("username")}
              disabled={!isEditing}
              size="small"
              fullWidth
              InputProps={{ sx: inputSx }}
            />
          </Box>
          <Box>
            <Typography sx={labelSx}>University:</Typography>
            <TextField
              value={"Wesleyan University - Philippines"}
              disabled
              size="small"
              fullWidth
              InputProps={{ sx: inputSx }}
            />
          </Box>
          <Box>
            <Typography sx={labelSx}>Work Position:</Typography>
            <TextField
              value={getRoleLabel(draft?.authorities?.[0] || "")}
              disabled
              size="small"
              fullWidth
              InputProps={{ sx: inputSx }}
            />
          </Box>
        </Box>
      </Box>

      {/* DISPLAY PICTURE */}
      {isEditing && (
        <>
          <SectionTitle title="Display Picture" />
          <Box
            display="flex"
            gap={3}
            alignItems="center"
            mb={4}
            flexWrap="wrap"
          >
            <Avatar
              src={draft?.avatar || ""}
              sx={{
                width: { xs: 80, sm: 120 },
                height: { xs: 80, sm: 120 },
                ml: { xs: 0, sm: 4 },
              }}
            />
            <Box display="flex" flexDirection="column" justifyContent="center">
              <Button
                component="label"
                sx={{
                  fontStyle: "italic",
                  mb: 1,
                  alignSelf: "flex-start",
                  bgcolor: "#fff",
                  color: "#666",
                  border: "none",
                  boxShadow: 2,
                  "&:hover": { bgcolor: "#fafafa" },
                  px: 2,
                  textTransform: "none",
                  fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)",
                }}
              >
                Upload Photo
                <input
                  hidden
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleAvatarUpload}
                />
              </Button>
              <Typography
                sx={{
                  fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)",
                  fontStyle: "italic",
                  color: "black",
                }}
              >
                Maximum file size: 5 mb
              </Typography>
              <Typography
                sx={{
                  fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)",
                  fontStyle: "italic",
                  color: "black",
                }}
              >
                Supported media types: .jpg, .png, .jpeg
              </Typography>
            </Box>
          </Box>
        </>
      )}

      {/* ACTION BUTTONS */}
      {isEditing && (
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button
            onClick={handleCancel}
            sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: green, fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
            onClick={handleSubmit}
          >
            Save
          </Button>
        </Box>
      )}

      {/* CONFIRM MODAL */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: "clamp(0.9rem, 2.5vw, 1.25rem)" }}>
          Confirm Update
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "clamp(0.75rem, 2vw, 1rem)" }}>
            Are you sure you want to update your profile?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            sx={{ fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: green, fontSize: "clamp(0.7rem, 1.8vw, 0.875rem)" }}
            onClick={handleSaveProfile}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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
    </Box>
  );
};

export default Profile;
