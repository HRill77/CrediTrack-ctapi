import {
  AppBar,
  Box,
  Button,
  ButtonProps,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useContext, useState } from "react";
import crediTrackLogo from "../../assets/logo/crediTrackLogo2.png";
import styled from "@emotion/styled";
import { AuthContext } from "../../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetAllRoles } from "../../services/Queries/UserQueries";
import { userRoleOtions } from "../../Constant/UsersOptions";

interface PageItem {
  label: string;
  onClick?: () => void;
}

interface AppBarTopProps {
  pages?: PageItem[];
  onMainClick?: () => void;
  handleOpenModal?: () => void;
  className?: string;
}

const ColorButton = styled(Button)<ButtonProps>(({ theme }) => ({
  color: "#F9F3B5",
  backgroundColor: "#064F1E",
  borderColor: "#F9F3B5",
  "&:hover": {
    borderColor: "#F9F3B5",
    color: "#F9F3B5",
    backgroundColor: "rgba(249, 243, 181, 0.08)",
  },
}));

const AppBarTop = ({
  pages,
  onMainClick,
  handleOpenModal,
  className = "navigation-bar",
}: AppBarTopProps) => {
  const { currentUser, logout } = useContext(AuthContext);
  const isGuest = sessionStorage.getItem("isGuest") === "true";
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const userRoles =
    userRoleOtions.find((role) => role.value === currentUser?.authorities[0])
      ?.label || "Student Guest";
  const isRoot = location.pathname === "/";
  const isDashboard = location.pathname.includes("/dashboard");

  const MENU = {
    guest: {
      root: ["Dashboard", "Logout"],
      other: ["Main", "Logout"],
    },
    user: {
      rootDashboard: ["Account", "Main", "Logout"],
      root: ["Account", "Dashboard", "Logout"],
      dashboard: ["Account", "Main", "Logout"],
      other: ["Dashboard", "Main", "Logout"],
    },
  };

  const menu = isGuest
    ? isRoot
      ? MENU.guest.root
      : MENU.guest.other
    : isRoot
      ? isDashboard
        ? MENU.user.rootDashboard
        : MENU.user.root
      : isDashboard
        ? MENU.user.dashboard
        : MENU.user.other;

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElNav(event.currentTarget);
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElUser(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = async () => {
    try {
      isGuest ? sessionStorage.removeItem("isGuest") : await logout();
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoutConfirm = () => {
    setLogoutConfirmOpen(false);
    handleLogout();
  };

  return (
    <>
      <AppBar position="fixed" className={className}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ px: { xs: 1.5, md: 0 } }}>
            {/* LOGO + TITLE – desktop */}
            <Box
              component="img"
              src={crediTrackLogo}
              alt="CrediTrack Logo"
              sx={{ height: 40, mr: 1, display: { xs: "none", md: "flex" } }}
            />
            <Typography
              variant="h5"
              noWrap
              component="a"
              href="#app-bar-with-responsive-menu"
              onClick={(e) => {
                e.preventDefault();
                onMainClick?.();
              }}
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                fontFamily: ["Poppins", "sans-serif"].join(","),
                fontWeight: 700,
                color: "inherit",
                textDecoration: "none",
              }}
            >
              CrediTrack
            </Typography>

            {/* HAMBURGER + MOBILE MENU */}
            {pages && pages.length > 0 && (
              <Box sx={{ display: { xs: "flex", md: "none" } }}>
                <IconButton
                  size="large"
                  aria-label="navigation menu"
                  aria-controls="menu-appbar-nav"
                  aria-haspopup="true"
                  onClick={handleOpenNavMenu}
                  color="inherit"
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  id="menu-appbar-nav"
                  anchorEl={anchorElNav}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  keepMounted
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                  open={Boolean(anchorElNav)}
                  onClose={handleCloseNavMenu}
                  sx={{ display: { xs: "block", md: "none" } }}
                >
                  {pages.map((page) => (
                    <MenuItem
                      key={page.label}
                      onClick={() => {
                        page.onClick?.();
                        handleCloseNavMenu();
                      }}
                      sx={{ py: 0.5, minHeight: "unset" }}
                    >
                      <Typography
                        textAlign="center"
                        sx={{ fontSize: "clamp(0.8rem, 3vw, 1rem)" }}
                      >
                        {page.label}
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            )}

            {/* LOGO – mobile (truly centered) */}
            <Box
              sx={{
                display: {
                  xs: "none",
                  sm: "flex",
                  md: "none",
                  lg: "none",
                  xl: "none",
                },
                "@media (min-width: 301px) and (max-width: 899px)": {
                  display: "flex",
                },
                "@media (max-width: 300px)": { display: "none" },
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1,
              }}
            >
              <Box
                component="img"
                src={crediTrackLogo}
                alt="CrediTrack Logo"
                onClick={onMainClick}
                sx={{ height: { xs: 25, sm: 35 }, cursor: "pointer" }}
              />
            </Box>

            {/* NAV LINKS – desktop */}
            {pages && pages.length > 0 && (
              <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
                {pages.map((page) => (
                  <Button
                    key={page.label}
                    onClick={() => {
                      page.onClick?.();
                      handleCloseNavMenu();
                    }}
                    sx={{ my: 2, color: "#F9F3B5", display: "block" }}
                  >
                    {page.label}
                  </Button>
                ))}
              </Box>
            )}

            {!pages && <Box sx={{ flexGrow: 1 }} />}

            {/* SPACER – mobile only */}
            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }} />

            {/* RIGHT SIDE */}
            <Box sx={{ flexGrow: 0 }}>
              {!currentUser && !isGuest && (
                <ColorButton
                  size="small"
                  variant="outlined"
                  onClick={handleOpenModal}
                  sx={{
                    fontSize: "clamp(0.6rem, 1.5vw, 0.875rem)",
                    whiteSpace: "normal",
                    maxWidth: { xs: "90px", md: "none" },
                    lineHeight: 1.2,
                    textAlign: "center",
                    px: { xs: 1, md: 2 },
                    py: { xs: 0.5, md: 1 },
                  }}
                >
                  Access CrediTrack
                </ColorButton>
              )}

              {(currentUser || isGuest) && (
                <Tooltip title="Open settings">
                  <Button
                    variant="text"
                    onClick={handleOpenUserMenu}
                    sx={{ color: "#fff", p: 0, cursor: "pointer" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        textAlign: "center",
                      }}
                    >
                      <span style={{ fontSize: "clamp(0.6rem, 1.8vw, 1rem)" }}>
                        {isGuest ? "Guest" : currentUser?.fullName}
                      </span>
                      <span
                        style={{
                          lineHeight: "1",
                          textTransform: "capitalize",
                          fontWeight: "400",
                          fontSize: "clamp(0.5rem, 1.4vw, 0.75rem)",
                          textAlign: "center",
                        }}
                      >
                        {userRoles}
                      </span>
                    </div>
                  </Button>
                </Tooltip>
              )}

              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                keepMounted
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {menu.map((menu) => (
                  <MenuItem
                    key={menu}
                    onClick={() => {
                      handleCloseUserMenu();
                      if (menu === "Logout") setLogoutConfirmOpen(true);
                      else if (menu === "Main") navigate("/");
                      else if (menu === "Dashboard") navigate("/dashboard");
                      else if (menu === "Account") navigate("/account");
                      else console.log("Clicked:", menu);
                    }}
                    sx={{ py: 0.5, minHeight: "unset" }}
                  >
                    <Typography
                      sx={{
                        textAlign: "center",
                        fontSize: "clamp(0.8rem, 3vw, 1rem)",
                      }}
                    >
                      {menu}
                    </Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* LOGOUT CONFIRMATION DIALOG */}
      <Dialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{ fontWeight: 700, fontSize: "clamp(1rem, 3vw, 1.25rem)" }}
        >
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>
            Are you sure you want to log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setLogoutConfirmOpen(false)}
            variant="contained"
            sx={{
              fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
              textTransform: "none",
              backgroundColor: "#064F1E",
              "&:hover": { backgroundColor: "#053a16" },
              "&:active": { backgroundColor: "#064F1E" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            variant="contained"
            sx={{
              fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
              textTransform: "none",
              backgroundColor: "#c62828",
              "&:hover": { backgroundColor: "#8e0000" },
              "&:active": { backgroundColor: "#c62828" },
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AppBarTop;
