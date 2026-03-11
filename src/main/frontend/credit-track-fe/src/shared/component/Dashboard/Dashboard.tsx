import React, { useContext, useEffect, useState } from "react";
import { Box, Container, Typography } from "@mui/material";
import UserTable from "../../../component/User/UserTable";
import "../../css/Dashboard.css";
import { useLocation, useNavigate } from "react-router-dom";

import Academics from "../../../component/Academics/Academics";
import crediTrackLogo2 from "../../shared/assets/logo/crediTrackLogo2.png";
import NavBar from "../NavigationBar/NavBar";
import MiniDrawer from "../MiniDrawer";
import { AuthContext } from "../../context/AuthContext";
import { userRoleOtions } from "../../Constant/UsersOptions";
import Whitelisting from "../../../component/EmailWhitelisting/EmailWhitelisting";
import Evaluation from "../../../component/Evaluation/EvaluationTable";

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const isSystemAdmin = currentUser?.authorities.includes("ROLE_SUPER_ADMIN");
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const determineInitialMenuItem = () => {
    if (location.pathname.includes("evaluation")) return "evaluation";
    else if (location.pathname.includes("user-management"))
      return "user-management";
    else if (location.pathname.includes("academics")) return "academics";
    else if (location.pathname.includes("email-whitelisting"))
      return "email-whitelisting";
    else return "dashboard";
  };

  const [selectedMenuItem, setSelectedMenuItem] = useState(
    determineInitialMenuItem(),
  );

  useEffect(() => {
    setSelectedMenuItem(determineInitialMenuItem());
  }, [location.pathname]);

  return (
    <Box className="dashboard-root">
      <NavBar />
      <MiniDrawer onDrawerHover={setDrawerOpen} />

      <Box
        className={`hero-dashboard ${drawerOpen ? "drawer-expanded" : "drawer-collapsed"}`}
      >
        <Container
          maxWidth="lg"
          disableGutters
          sx={{ px: { xs: 2, sm: 3, md: 2 } }}
        >
          {selectedMenuItem === "dashboard" && (
            <div className="dashboard-logo">
              <Typography
                variant="h1"
                align="center"
                sx={{
                  fontWeight: "bold",
                  color: "#064F1E",
                  fontSize: "clamp(1.5rem, 5vw, 3.75rem)",
                  px: { xs: 2, sm: 4 },
                }}
              >
                Welcome to CrediTrack
              </Typography>
            </div>
          )}

          {selectedMenuItem === "evaluation" && <Evaluation />}
          {selectedMenuItem === "user-management" && isSystemAdmin && (
            <UserTable />
          )}
          {selectedMenuItem === "academics" && <Academics />}
          {selectedMenuItem === "email-whitelisting" && <Whitelisting />}
        </Container>
      </Box>

      <Box className="dashboard-footer">
        <Typography
          variant="body2"
          sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)" }}
        >
          Copyright © 2026 CrediTrack. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;
