import React, { useMemo, useState } from "react";
import {
  BootstrapDialog,
  phPhoneNumberFormat,
} from "../../shared/utils/uiUtility";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  OutlinedInput,
  MenuItem,
  Select,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  userRoleOtions,
  userSuffixOptions,
} from "../../shared/Constant/UsersOptions";
import {
  useGetAllPrograms,
  useGetAllRoles,
} from "../../shared/services/Queries/UserQueries";
import UserService from "../../shared/services/UserService";
import { UserFormData } from "../../shared/interface/UserFormData";
import AuthService from "../../shared/services/AuthService";
import { useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { SnackbarContext } from "../../shared/context/SnackbarContext";

interface AddUserModalProps {
  open: boolean;
  handleClose: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ open, handleClose }) => {
  const [formData, setFormData] = useState<UserFormData>({
    firstname: "",
    middlename: "",
    lastname: "",
    suffix: "",
    email: "",
    phone: "",
    roleId: "",
    programId: "",
  });

  

  const [errors, setErrors] = useState<Partial<UserFormData>>({});
  // console.log("formData", formData);
  // console.log("errors", errors);
  const { data: roles } = useGetAllRoles();
  const { data: programs } = useGetAllPrograms();
  const queryClient = useQueryClient();
  const { showSuccess } = useContext(SnackbarContext);
  const roleList = useMemo(
    () =>
      roles
        ?.map((role: any) => {
          const roleOptions = userRoleOtions.find(
            (opt) => opt.value === role.roleName,
          );
          if (!roleOptions) return null;
          return {
            label: roleOptions?.label,
            value: role.id,
          };
        })
        .filter(Boolean) ?? [],
    [roles],
  );

  // console.log("selectedRoleList", roleList.find((r: any) => r.value === formData.roleId));

  const programList = useMemo(
    () =>
      programs?.map((program: any) => ({
        label: program.name,
        value: program.id,
      })) ?? [],
    [programs],
  );
  
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target as
      | HTMLInputElement
      | { name?: string; value: unknown };
    if (!name) return;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof UserFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, "");

    // Remove country code if pasted
    if (digits.startsWith("63")) {
      digits = digits.slice(2);
    }

    // Must start with 9
    if (digits.length > 0 && digits[0] !== "9") {
      return;
    }

    // Limit to 10 digits
    digits = digits.slice(0, 10);

    setFormData((prev) => ({
      ...prev,
      phone: digits, // RAW VALUE ONLY
    }));

    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const handleEmailBlur = async () => {
    if (!formData.email.trim()) return;

    try {
      const { data: exists } = await UserService.checkEmailExists(
        formData.email,
      );

      if (exists) {
        setErrors((prev) => ({
          ...prev,
          email: "Email already exists",
        }));
      }
      else if (!formData.email.endsWith('@wesleyan.edu.ph')) {
        setErrors(prev => ({
          ...prev,
          email: 'Please enter a valid institutional email (@wesleyan.edu.ph)'
        }));
      }
    } catch (err) {
      console.error("Email check failed", err);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};
    if (!formData.firstname.trim())
      newErrors.firstname = "First name is required";
    if (!formData.lastname.trim()) newErrors.lastname = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }
    //  else if (!formData.email.endsWith('@wesleyan.edu.ph')) {
    //   newErrors.email = 'Please enter a valid institutional email (@wesleyan.edu.ph)';
    // }
    if (!formData.roleId) newErrors.roleId = "Role is required";
    else {
    // Check if selected role is Program Head, if so require program
    const selectedRole = roleList.find((r: any) => r.value === formData.roleId);
    if (selectedRole?.label === 'Program Head' && !formData.programId) {
      newErrors.programId = "Program is required for Program Head role";
    }
  }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!validateForm()) return;

    // Hard stop if email already marked as duplicate
    if (errors.email) return;

    try {
      setIsSaving(true);
      // console.log("Saving user:", formData);
      await AuthService.register(formData);
      showSuccess("User registered successfully!");
      queryClient.invalidateQueries({ queryKey: ["getUsers"] });
      handleModalClose();
    } catch (error: any) {
      if (error.response?.status === 409) {
        setErrors((prev) => ({
          ...prev,
          email: error.response?.data?.message || "Registration failed",
        }));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    setFormData({
      firstname: "",
      middlename: "",
      lastname: "",
      suffix: "",
      email: "",
      phone: "",
      roleId: "",
      programId: "",
    });
    setErrors({});
    handleClose();
  };
  return (
    <div>
      <BootstrapDialog
        onClose={handleModalClose}
        aria-labelledby="customized-dialog-title"
        open={open}
        fullWidth={true}
        maxWidth="md"
      >
        <DialogTitle
          sx={{ m: 0, p: 2, fontSize: "20px" }}
          id="customized-dialog-title"
        >
          Add New User
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleModalClose}
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
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl
                fullWidth
                margin="normal"
                variant="outlined"
                error={Boolean(errors.firstname)}
                sx={{
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: "#064F1E",
                    },
                  },
                }}
              >
                <InputLabel htmlFor="firstname" size="small">
                  First Name *
                </InputLabel>
                <OutlinedInput
                  id="firstname"
                  size="small"
                  name="firstname"
                  type="text"
                  value={formData.firstname}
                  onChange={handleInputChange}
                  autoComplete="given-name"
                  placeholder="First Name"
                  label="First Name *"
                  sx={{
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#064F1E",
                    },
                    "& input": {
                      "&:focus": {
                        color: "#064F1E",
                      },
                    },
                  }}
                />
                {errors.firstname && (
                  <FormHelperText>{errors.firstname}</FormHelperText>
                )}
              </FormControl>

              <FormControl
                fullWidth
                margin="normal"
                variant="outlined"
                sx={{
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: "#064F1E",
                    },
                  },
                }}
              >
                <InputLabel htmlFor="middle-name" size="small">
                  Middle Name
                </InputLabel>
                <OutlinedInput
                  id="middle-name"
                  name="middlename"
                  size="small"
                  type="text"
                  value={formData.middlename}
                  onChange={handleInputChange}
                  autoComplete="given-name"
                  placeholder="Middle Name"
                  label="Middle Name"
                  sx={{
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#064F1E",
                    },
                    "& input": {
                      "&:focus": {
                        color: "#064F1E",
                      },
                    },
                  }}
                />
              </FormControl>

              <FormControl
                fullWidth
                margin="normal"
                variant="outlined"
                error={Boolean(errors.lastname)}
                sx={{
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: "#064F1E",
                    },
                  },
                }}
              >
                <InputLabel htmlFor="last-name" size="small">
                  Last Name *
                </InputLabel>
                <OutlinedInput
                  id="last-name"
                  name="lastname"
                  size="small"
                  type="text"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  autoComplete="family-name"
                  placeholder="Last Name"
                  label="Last Name *"
                  sx={{
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#064F1E",
                    },
                    "& input": {
                      "&:focus": {
                        color: "#064F1E",
                      },
                    },
                  }}
                />
                {errors.lastname && (
                  <FormHelperText>{errors.lastname}</FormHelperText>
                )}
              </FormControl>

              <FormControl
                margin="normal"
                variant="outlined"
                sx={{
                  minWidth: "120px",
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: "#064F1E",
                    },
                  },
                }}
              >
                <InputLabel htmlFor="suffix" size="small">
                  Suffix
                </InputLabel>
                <Select
                  id="suffix"
                  name="suffix"
                  size="small"
                  type="text"
                  value={formData.suffix}
                  onChange={handleInputChange as any}
                  autoComplete="suffix"
                  label="Suffix"
                  sx={{
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#064F1E",
                    },
                  }}
                >
                  {userSuffixOptions.map((suffix) => (
                    <MenuItem key={suffix.value} value={suffix.value}>
                      {suffix.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl
                fullWidth
                margin="normal"
                variant="outlined"
                error={Boolean(errors.email)}
                sx={{
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: "#064F1E",
                    },
                  },
                }}
              >
                <InputLabel htmlFor="email" size="small">
                  Email *
                </InputLabel>
                <OutlinedInput
                  id="email"
                  size="small"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleEmailBlur}
                  autoComplete="email"
                  placeholder="name@wesleyan.edu.ph"
                  label="Email *"
                  sx={{
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#064F1E",
                    },
                    "& input": {
                      "&:focus": {
                        color: "#064F1E",
                      },
                    },
                  }}
                />
                {errors.email && (
                  <FormHelperText>{errors.email}</FormHelperText>
                )}
              </FormControl>

              <FormControl
                fullWidth
                margin="normal"
                variant="outlined"
                sx={{
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: "#064F1E",
                    },
                  },
                }}
              >
                <InputLabel htmlFor="phone" size="small">
                  Phone
                </InputLabel>
                <OutlinedInput
                  id="phone"
                  size="small"
                  name="phone"
                  type="tel"
                  value={phPhoneNumberFormat(formData.phone)}
                  onChange={handlePhoneChange}
                  autoComplete="tel"
                  placeholder="+63 9XX XXX XXXX"
                  label="Phone"
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9 ]*",
                  }}
                  sx={{
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#064F1E",
                    },
                    "& input": {
                      "&:focus": {
                        color: "#064F1E",
                      },
                    },
                  }}
                />
              </FormControl>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl
                fullWidth
                margin="normal"
                error={Boolean(errors.roleId)}
                sx={{
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: "#064F1E",
                    },
                  },
                }}
              >
                <InputLabel size="small">Role *</InputLabel>
                <Select
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleInputChange as any}
                  label="Role *"
                  size="small"
                  sx={{
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#064F1E",
                    },
                  }}
                >
                  {/* <MenuItem value="">Select a role</MenuItem>
                  <MenuItem value="1">Admin</MenuItem>
                  <MenuItem value="2">User</MenuItem>
                  <MenuItem value="3">Manager</MenuItem> */}
                  <MenuItem value="">-- Clear Selection --</MenuItem>
                  {roleList.map((role: any) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.roleId && (
                  <FormHelperText>{errors.roleId}</FormHelperText>
                )}
              </FormControl>

              <FormControl
                fullWidth
                margin="normal"
                error={Boolean(errors.programId)}
                sx={{
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: "#064F1E",
                    },
                  },
                }}
              >
                <InputLabel size="small">Program</InputLabel>
                <Select
                  name="programId"
                  value={formData.programId}
                  onChange={handleInputChange as any}
                  label="Program"
                  size="small"
                  sx={{
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#064F1E",
                    },
                  }}
                >
                  <MenuItem value="">-- Clear Selection --</MenuItem>
                  {programList.map((program: any) => (
                    <MenuItem key={program.value} value={program.value}>
                      {program.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.programId && (
                  <FormHelperText>{errors.programId}</FormHelperText>
                )}
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleModalClose}
            disabled={isSaving}
            sx={{ color: "#064F1E" }}
          >
            Cancel
          </Button>
          <Button
            autoFocus
            onClick={handleSave}
            variant="contained"
            disabled={isSaving}
            sx={{
              backgroundColor: "#064F1E",
              "&:hover": {
                backgroundColor: "#053A16",
              },
            }}
          >
            {isSaving ? <CircularProgress size={24} /> : "Save User"}
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </div>
  );
};

export default AddUserModal;
