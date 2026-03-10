import React, { useEffect, useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import UserTable from '../User/UserTable';
import '../../shared/css/Dashboard.css';
import { useLocation, useNavigate } from 'react-router-dom';
import NavBar from '../../shared/component/NavigationBar/NavBar';

import MiniDrawer from '../../shared/component/MiniDrawer';
import Academics from '../Academics/Academics';
import crediTrackLogo2 from '../../shared/assets/logo/crediTrackLogo2.png';


const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const determineInitialMenuItem = () => {
    if (location.pathname.includes("user-management")) {
      return "user-management";
    } else if (location.pathname.includes("academics")) {
      return "academics";
    } else {
      return "dashboard";
    }
  };

  const [selectedMenuItem, setSelectedMenuItem] = useState(
    determineInitialMenuItem()
  );

  useEffect(() => {
    const currentMenuItem = determineInitialMenuItem();
    setSelectedMenuItem(currentMenuItem);
  }, [location.pathname]);

  return (
    <Box className="dashboard-root">
      <NavBar />
      <MiniDrawer onDrawerHover={setDrawerOpen} />
      <Box className={`hero-dashboard ${drawerOpen ? 'drawer-expanded' : 'drawer-collapsed'}`}>
        <Container maxWidth="lg" disableGutters>

        {selectedMenuItem === 'dashboard' &&  
        <div className='dashboard-logo'>
          <Typography
                      variant="h1"
                      align="center"
                      sx={{ fontWeight: "bold", color: "#064F1E " }}
                    >
                      Welcome to CrediTrack
                    </Typography>
          </div>
          
          }
        {selectedMenuItem === 'user-management' && <UserTable />}
        {selectedMenuItem === 'academics' && <Academics />}
     
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

export default Dashboard;
