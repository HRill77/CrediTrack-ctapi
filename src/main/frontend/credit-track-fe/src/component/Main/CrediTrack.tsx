import React, { useContext, useEffect, useState } from "react";
import { LoginInterface } from "../../shared/interface/LoginInterface";
import NavBar from "../../shared/component/NavigationBar/NavBar";
import {
  scrollToSection,
  SlideDownTransition,
} from "../../shared/utils/uiUtility";
import Main from "./Main";
import About from "./About";
import Programs from "./Programs";
import Developers from "./Developers";
import Contact from "./Contact";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Snackbar,
  Typography,
} from "@mui/material";
import {
  CancelButton,
  MainButton,
  SecondaryButton,
} from "../../shared/utils/buttonsUtility";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AuthService from "../../shared/services/AuthService";
import { AuthContext } from "../../shared/context/AuthContext";
import { SnackbarContext } from "../../shared/context/SnackbarContext";
import { useNavigate } from "react-router-dom";

const CrediTrack = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { getCurrentUser } = useContext(AuthContext);
  const { openSnack, closeSnack, showSuccess } = useContext(SnackbarContext);
  const navigate = useNavigate();
  const mainRef = React.useRef<HTMLDivElement>(null);
  const aboutRef = React.useRef<HTMLDivElement>(null);
  const programRef = React.useRef<HTMLDivElement>(null);
  const developerRef = React.useRef<HTMLDivElement>(null);
  const contactRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [login, setLogin] = useState<LoginInterface>({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState({
    emailError: "",
    passwordError: "",
  });
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginErrorClose = () => setLoginError("");
  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleAdminClickOpen = () => setAdminOpen(true);
  const handleAdminClose = () => {
    setAdminOpen(false);
    setLogin({ email: "", password: "" });
    setErrorMessage({ emailError: "", passwordError: "" });
    setLoginError("");
    setShowPassword(false);
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (e: React.MouseEvent<HTMLButtonElement>) =>
    e.preventDefault();
  const handleMouseUpPassword = (e: React.MouseEvent<HTMLButtonElement>) =>
    e.preventDefault();

  const validateLogin = (loginValue: LoginInterface) => {
    const email = loginValue.email.trim().toLowerCase();
    const password = loginValue.password;
    let emailError = "";
    let passwordError = "";
    if (!email) emailError = "Email is required";
    if (!password) passwordError = "Password is required";
    setErrorMessage({ emailError, passwordError });
    return !emailError && !passwordError;
  };

  const handleLoginSubmit = async (loginValue: LoginInterface) => {
    const email = loginValue.email.trim().toLowerCase();
    const password = loginValue.password;
    if (!email || !password) {
      validateLogin(loginValue);
      return;
    }
    setIsLoading(true);
    setLoginError("");
    try {
      const tempRes = await AuthService.checkTempPassword(email, password);
      if (tempRes.data.isTempPassword) {
        navigate("/update-password", { state: { email } });
        return;
      }
      await AuthService.login(email, password);
      await getCurrentUser();
      navigate("/dashboard");
      //showSuccess("Login successful!");
      handleAdminClose();
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setLoginError(
          "Oops! Incorrect username or password. Please try again.",
        );
      } else if (error.response?.status === 429) {
        setLoginError(error.response.data.message);
      } else {
        setLoginError("An error occurred during login. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => navigate("/forgot-password");
  const handleSignInAsGuest = () => {
    sessionStorage.setItem("isGuest", "true");
    navigate("/dashboard");
  };

  return (
    <div>
      <NavBar
        onMainClick={() => scrollToSection(mainRef)}
        onAboutClick={() => scrollToSection(aboutRef)}
        onProgramsClick={() => scrollToSection(programRef)}
        onDeveloperClick={() => scrollToSection(developerRef)}
        onContactClick={() => scrollToSection(contactRef)}
        handleOpenModal={handleClickOpen}
      />
      <div ref={mainRef}>
        <Main onAccessCrediTrack={handleClickOpen} />
      </div>
      <div ref={aboutRef} style={{ scrollMarginTop: "70px" }}>
        <About />
      </div>
      <div ref={programRef} style={{ scrollMarginTop: "70px" }}>
        <Programs />
      </div>
      <div ref={developerRef} style={{ scrollMarginTop: "70px" }}>
        <Developers />
      </div>
      <div ref={contactRef}>
        <Contact />
      </div>

      {/* ACCESS CREDITRACK DIALOG */}
      <Dialog
        open={open}
        slots={{ transition: SlideDownTransition }}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        keepMounted
      >
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <Typography
            variant="inherit"
            fontWeight={700}
            sx={{ fontSize: "clamp(1rem, 4vw, 1.25rem)" }}
          >
            Access CrediTrack
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mt={0.5}
            px={2}
            sx={{ fontSize: "clamp(0.7rem, 2.5vw, 0.875rem)" }}
          >
            Access is provided for authorized university personnel. Student
            access is available in guest mode.
          </Typography>
        </DialogTitle>

        <DialogContent />

        <DialogActions
          sx={{
            flexDirection: "column",
            alignItems: "stretch",
            px: { xs: 2, sm: 3 },
            pb: 3,
            gap: 1.5,
          }}
        >
          <MainButton
            variant="contained"
            fullWidth
            size="medium"
            sx={{
              fontWeight: 600,
              fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)",
            }}
            onClick={() => {
              handleClose();
              handleAdminClickOpen();
            }}
          >
            Login to CrediTrack
          </MainButton>

          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            mt={-1}
            sx={{ fontSize: "clamp(0.65rem, 2vw, 0.75rem)" }}
          >
            University Personnel
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", my: 1 }}>
            <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mx: 1, fontSize: "clamp(0.7rem, 2vw, 0.875rem)" }}
            >
              or
            </Typography>
            <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
          </Box>

          <SecondaryButton
            variant="outlined"
            fullWidth
            size="medium"
            sx={{
              fontWeight: 600,
              mt: -1,
              fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)",
            }}
            onClick={handleSignInAsGuest}
          >
            Sign in as Student Transferee (Guest)
          </SecondaryButton>

          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            sx={{ fontSize: "clamp(0.65rem, 2vw, 0.75rem)" }}
          >
            Student access only
          </Typography>
        </DialogActions>
      </Dialog>

      {/* LOGIN DIALOG */}
      <Dialog
        open={adminOpen}
        onClose={handleAdminClose}
        maxWidth="xs"
        slots={{ transition: SlideDownTransition }}
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          <Typography
            variant="inherit"
            fontWeight={700}
            sx={{ fontSize: "clamp(1rem, 4vw, 1.25rem)" }}
          >
            Login to CrediTrack
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mt={0.5}
            px={2}
            sx={{ fontSize: "clamp(0.7rem, 2.5vw, 0.875rem)" }}
          >
            This access is reserved for authorized university personnel.
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, sm: 3 }, pt: 2 }}>
          {loginError && (
            <Alert
              severity="warning"
              onClose={handleLoginErrorClose}
              sx={{
                fontSize: "clamp(0.65rem, 2vw, 0.75rem)",
                py: 0.5,
                px: 1,
                minHeight: "auto",
                alignItems: "center",
                "& .MuiAlert-icon": { fontSize: "1rem", mr: 0.5 },
                "& .MuiAlert-message": { padding: 0 },
              }}
            >
              {loginError}
            </Alert>
          )}

          <FormControl
            fullWidth
            margin="normal"
            variant="outlined"
            error={Boolean(errorMessage.emailError)}
          >
            <InputLabel
              htmlFor="institutional-email"
              sx={{
                fontSize: "clamp(0.8rem, 2.5vw, 1rem)",
                "&.Mui-focused": { color: "#064F1E" },
              }}
            >
              Institutional Email
            </InputLabel>
            <OutlinedInput
              id="institutional-email"
              name="email"
              type="email"
              value={login.email}
              onChange={(e) => setLogin({ ...login, email: e.target.value })}
              autoComplete="email"
              placeholder="name@wesleyan.edu.ph"
              label="Institutional Email"
              sx={{
                fontSize: "clamp(0.8rem, 2.5vw, 1rem)",
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#064F1E",
                },
              }}
            />
            {errorMessage.emailError && (
              <FormHelperText sx={{ fontSize: "clamp(0.65rem, 2vw, 0.75rem)" }}>
                {errorMessage.emailError}
              </FormHelperText>
            )}
          </FormControl>

          <FormControl
            fullWidth
            sx={{ mt: 1 }}
            variant="outlined"
            error={Boolean(errorMessage.passwordError)}
          >
            <InputLabel
              htmlFor="outlined-adornment-password"
              sx={{
                fontSize: "clamp(0.8rem, 2.5vw, 1rem)",
                "&.Mui-focused": { color: "#064F1E" },
              }}
            >
              Password
            </InputLabel>
            <OutlinedInput
              id="outlined-adornment-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              label="Password"
              value={login.password}
              onChange={(e) => setLogin({ ...login, password: e.target.value })}
              sx={{
                fontSize: "clamp(0.8rem, 2.5vw, 1rem)",
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#064F1E",
                },
              }}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    onMouseUp={handleMouseUpPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
            />
            {errorMessage.passwordError && (
              <FormHelperText sx={{ fontSize: "clamp(0.65rem, 2vw, 0.75rem)" }}>
                {errorMessage.passwordError}
              </FormHelperText>
            )}
          </FormControl>

          <Box sx={{ textAlign: "right" }}>
            <Typography
              variant="overline"
              sx={{
                cursor: "pointer",
                fontSize: "clamp(0.65rem, 2vw, 0.75rem)",
              }}
              onClick={handleForgotPassword}
            >
              Forgot password?
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            flexDirection: "column",
            alignItems: "stretch",
            px: { xs: 2, sm: 3 },
            pb: 3,
            gap: 1.5,
          }}
        >
          <MainButton
            variant="contained"
            fullWidth
            size="large"
            sx={{ fontWeight: 600, fontSize: "clamp(0.8rem, 3vw, 1rem)" }}
            disabled={isLoading}
            onClick={() => handleLoginSubmit(login)}
          >
            {isLoading ? "Logging in..." : "Login"}
          </MainButton>

          <CancelButton
            variant="outlined"
            fullWidth
            size="large"
            onClick={handleAdminClose}
            disabled={isLoading}
            sx={{
              fontWeight: 600,
              mt: -1,
              fontSize: "clamp(0.8rem, 3vw, 1rem)",
            }}
          >
            Cancel
          </CancelButton>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={openSnack.isSuccess}
        autoHideDuration={3000}
        onClose={closeSnack}
        message={openSnack.message}
      >
        <Alert
          onClose={closeSnack}
          severity="success"
          variant="filled"
          sx={{ width: "100%", fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}
        >
          {openSnack.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CrediTrack;
