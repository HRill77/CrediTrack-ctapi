import React, { FC, useContext } from "react";
import {
  Box,
  Typography,
  Avatar,
  Tabs,
  Tab,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NavBar from "../../shared/component/NavigationBar/NavBar";
import { AuthContext } from "../../shared/context/AuthContext";
import wupLogo from "../../shared/assets/logo/wupLogo.png";
import Profile from "./Profile";
import Security from "./Security";

type TabType = "profile" | "security";

const green = "#0b5f2a";

const Account: FC = () => {
  const { currentUser, setCurrentUser, isAuthLoading } =
    useContext(AuthContext);
  const [tab, setTab] = React.useState<TabType>("profile");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const getAvatarUrl = () => {
    if (!currentUser?.fileData) return "";
    if (currentUser.fileData.startsWith("data:")) return currentUser.fileData;
    if (typeof currentUser.fileData === "string")
      return `data:image/jpeg;base64,${currentUser.fileData}`;
    if (currentUser.fileData instanceof Blob) {
      const reader = new FileReader();
      let dataUrl = "";
      reader.onload = () => {
        dataUrl = reader.result as string;
      };
      reader.readAsDataURL(currentUser.fileData);
      return dataUrl;
    }
    return "";
  };

  if (isAuthLoading)
    return (
      <Box sx={{ mt: 10, px: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  if (!currentUser)
    return (
      <Box sx={{ mt: 10, px: 3 }}>
        <Typography>No user data available</Typography>
      </Box>
    );

  const SidebarContent = (
    <Box
      sx={{
        width: 240,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 3,
      }}
    >
      {/* Avatar + Name */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
        <Avatar src={getAvatarUrl()} sx={{ width: 100, height: 100, mb: 1 }} />
        <Typography
          fontWeight="bold"
          sx={{ fontSize: "clamp(0.9rem, 2.5vw, 1.375rem)", color: "#064F1E" }}
        >
          {currentUser?.fullName || currentUser?.username || "User"}
        </Typography>
        <Box
          sx={{ pb: 2, borderBottom: "2.5px solid rgba(190, 166, 28, 0.61)" }}
        >
          <Typography sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.8rem)" }}>
            {currentUser?.username || ""}
          </Typography>
          <Typography sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.8rem)" }}>
            {currentUser?.employeeNo || ""}
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ mx: -3 }}>
        <Tabs
          orientation="vertical"
          value={tab === "profile" ? 0 : 1}
          onChange={(_, v) => {
            setTab(v === 0 ? "profile" : "security");
            if (isMobile) setDrawerOpen(false);
          }}
          sx={{ "& .MuiTabs-indicator": { display: "none" } }}
        >
          <Tab label="PROFILE" sx={tabStyle} />
          <Tab label="SECURITY" sx={tabStyle} />
        </Tabs>
      </Box>

      {/* WUP Logo pinned to bottom */}
      <Box
        sx={{
          mt: "auto",
          pt: 3,
          borderTop: "1px solid #ddd",
          textAlign: "center",
        }}
      >
        <Avatar
          src={wupLogo}
          sx={{ width: 60, height: 60, mb: 1, mx: "auto" }}
        />
        <Typography
          sx={{
            fontSize: "clamp(0.6rem, 1.2vw, 0.75rem)",
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
        >
          Wesleyan University - Philippines
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f5f5f5",
      }}
    >
      <NavBar />

      {/* MAIN CONTENT */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          mt: { xs: 7, sm: 8 },
          mx: { xs: 1, sm: 2, md: 4, lg: 6 },
          mb: 2,
          bgcolor: "#fff",
          borderRadius: 2,
          boxShadow: 1,
          overflow: "hidden",
        }}
      >
        {/* DESKTOP SIDEBAR */}
        {!isMobile && (
          <Box
            sx={{
              width: { sm: 240, md: 280 },
              borderRight: "1px solid #ddd",
              flexShrink: 0,
            }}
          >
            {SidebarContent}
          </Box>
        )}

        {/* MOBILE DRAWER */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            PaperProps={{ sx: { top: "56px", height: "calc(100% - 56px)" } }}
          >
            {SidebarContent}
          </Drawer>
        )}

        {/* RIGHT PANEL */}
        <Box
          sx={{
            flex: 1,
            bgcolor: "#f5f5f5ed",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Mobile top bar with hamburger + current tab label */}
          {isMobile && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 2,
                py: 1,
                borderBottom: "1px solid #ddd",
                bgcolor: "#fff",
              }}
            >
              <IconButton onClick={() => setDrawerOpen(true)} size="small">
                <MenuIcon />
              </IconButton>
              <Typography
                fontWeight="bold"
                sx={{
                  ml: 1,
                  fontSize: "clamp(0.85rem, 3vw, 1rem)",
                  color: green,
                  textTransform: "uppercase",
                }}
              >
                {tab}
              </Typography>
            </Box>
          )}

          <Box sx={{ flex: 1 }}>
            {tab === "profile" && (
              <Profile admin={currentUser} setAdmin={setCurrentUser} />
            )}
            {tab === "security" && <Security />}
          </Box>
        </Box>
      </Box>

      {/* FOOTER */}
      <Box
        sx={{
          textAlign: "center",
          py: "10px",
          fontSize: "clamp(0.55rem, 1.2vw, 0.75rem)",
          fontStyle: "italic",
          color: "#777",
        }}
      >
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
          College of Engineering and Computer Technology. Copyright © 2026
          CrediTrack. All rights reserved.
        </Box>
        <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
          College of Engineering and Computer Technology.
          <br />
          Copyright © 2026 CrediTrack. All rights reserved.
        </Box>
      </Box>
    </Box>
  );
};

export default Account;

const tabStyle = {
  alignItems: "flex-start",
  textAlign: "left",
  fontWeight: 700,
  fontSize: "clamp(0.8rem, 2vw, 1.125rem)",
  color: "black",
  padding: "10px 24px",
  mb: 0.5,
  minHeight: "auto",
  width: "100%",
  justifyContent: "flex-start",
  "&.Mui-selected": {
    backgroundColor: "#f5f5f5ed",
    color: green,
  },
};
