import {
  AppBar,
  Box,
  Button,
  ButtonProps,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
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
  const isGuest = sessionStorage.getItem('isGuest') === 'true';
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const userRoles = userRoleOtions.find(role => role.value === currentUser?.authorities[0])?.label || "Student Guest";
  const settings =
    location.pathname === "/"
      ? isGuest ? ["Dashboard", "Logout"] : ["Account", "Dashboard", "Logout"]
      : isGuest ? ["Main", "Logout"] : ["Account", "Main", "Logout"];

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {


    try {
      isGuest? sessionStorage.removeItem('isGuest') : await logout();
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppBar position="fixed" className={className}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Box
            component="img"
            src={crediTrackLogo}
            alt="CrediTrack Logo"
            sx={{
              height: 40,
              mr: 1,
              display: { xs: "none", md: "flex" },
            }}
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

          {pages && pages.length > 0 && (
            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              ></IconButton>
            </Box>
          )}

          <Typography
            variant="h5"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: !pages || pages.length === 0 ? 0 : 1,
              fontFamily: ["Poppins", "sans-serif"].join(","),
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            CrediTrack
          </Typography>

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

          <Box sx={{ flexGrow: 0 }}>
            {!currentUser && !isGuest && (
              <ColorButton
                size="small"
                variant="outlined"
                onClick={handleOpenModal}
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
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span>{isGuest ? "Guest " : currentUser?.fullName}</span>
                    <span style={{ lineHeight: "1", textTransform: "capitalize", fontWeight: "400", fontSize: "12px" }}>{userRoles}</span>
                  </div>
                </Button>
              </Tooltip>
            )}

            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem
                  key={setting}
                  onClick={() => {
                    handleCloseUserMenu();

                    if (setting === "Logout") {
                      handleLogout();
                    } else if (setting === "Main") {
                      navigate("/");
                    } else if (setting === "Dashboard") {
                      navigate("/dashboard");
                    } else {
                      console.log("Clicked:", setting);
                    }
                  }}
                >
                  <Typography sx={{ textAlign: "center" }}>
                    {setting}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default AppBarTop;
