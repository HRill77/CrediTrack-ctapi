import React, { useState } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import "../../shared/css/Dashboard.css";
import NavBar from "../../shared/component/NavigationBar/NavBar";
import dayjs from "dayjs";
import { StudentFormData, StudentFormDataRequest } from "../../shared/interface/StudentFormData";
import StudentDetails from "./StudentDetails";
import TransferDetails from "./TransferDetails";
import UploadingCourses from "./UploadingCourses";
import StudentService from "../../shared/services/StudentService";

const GuestDashboard = () => {
  //   const {  isGuest } = useContext(AuthContext);
  // const navigate = useNavigate();
  // const location = useLocation();

  // useEffect(() => {
  //   // Only navigate if not already on dashboard
  //   if (!location.pathname.includes('/dashboard') && isGuest) {
  //     navigate('/dashboard', { replace: true });
  //   }
  // }, [location.pathname, navigate, isGut]);

  const [formData, setFormData] = useState<StudentFormData>({
    firstname: "",
    middlename: "",
    lastname: "",
    suffix: "",
    email: "",
    phone: "",
    address: "",
    yearLevel: "",
    dob: null,
  });

  const [transferData, setTransferData] = useState({
    fromUniversity: "",
    fromCollege: "",
    fromProgram: "",
    toUniversity: "",
    toCollege: "",
    toProgram: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    transcript: null as File | null,
    courseDescription: null as File | null,
  });

  const [errors, setErrors] = useState<Partial<StudentFormData>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target as
      | HTMLInputElement
      | { name?: string; value: unknown };
    if (!name) return;

    let finalValue: any = value;
    if (name === "dob" && value) {
      finalValue = dayjs(value as string);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
    if (errors[name as keyof StudentFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, "");

    if (digits.startsWith("63")) {
      digits = digits.slice(2);
    }

    if (digits.length > 0 && digits[0] !== "9") {
      return;
    }

    digits = digits.slice(0, 10);

    setFormData((prev) => ({
      ...prev,
      phone: digits,
    }));

    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const handleTransferChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target as { name?: string; value: unknown };
    if (!name) return;

    setTransferData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "transcript" | "courseDescription"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles((prev) => ({
        ...prev,
        [fileType]: file,
      }));
    }
  };

  const handleStartCrediTrack = async () => {
    console.log("Starting CrediTrack...");
    console.log("Form Data:", formData);
    console.log("Transfer Data:", transferData);
    console.log("Uploaded Files:", uploadedFiles);
    // Add your logic here

    try {
      const payload: StudentFormDataRequest = {
        firstname: formData.firstname,
        middlename: formData.middlename,
        lastname: formData.lastname,
        suffix: formData.suffix,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        yearLevel: formData.yearLevel,
        dob: formData.dob?.format("YYYY-MM-DD") || null,
      }
      const response = await StudentService.saveStudentData(payload);

      if(response.status === 200 || response.status === 201){
        alert(response.data.message || 'Student data saved successfully.');
      } else{
        alert('Failed to save student data. Please check your inputs and try again.');
      }

    } catch (error) {
      console.error("Error saving student data:", error);
    }
  };

  return (
    <Box className="dashboard-root">
      <NavBar />

      <Box className="hero-dashboard">
        <Container maxWidth="lg" disableGutters>
          <Box className="user-management-header">
            <Typography
              variant="h6"
              className="hero-dashboard-title"
              sx={{ color: "#064F1E" }}
            >
              Welcome, Student Guest!
            </Typography>
          </Box>

          {/* Student Information Component */}
          <StudentDetails
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            onPhoneChange={handlePhoneChange}
          />

          {/* Transfer Details Component */}
          <TransferDetails
            transferData={transferData}
            onTransferChange={handleTransferChange}
          />

          {/* Uploading Courses Component */}
          <UploadingCourses
            uploadedFiles={uploadedFiles}
            onFileUpload={handleFileUpload}
          />

          {/* START CrediTrack Button */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Button
              variant="contained"
              onClick={handleStartCrediTrack}
              sx={{
                backgroundColor: "#064F1E",
                color: "#fff",
                padding: "12px 48px",
                fontSize: "16px",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "8px",
                "&:hover": {
                  backgroundColor: "#053a16",
                },
              }}
            >
              START CrediTrack
            </Button>
          </Box>
        </Container>
      </Box>

      <Box className="dashboard-footer">
        <Typography variant="body2">
          Copyright © 2026 CrediTrack. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default GuestDashboard;