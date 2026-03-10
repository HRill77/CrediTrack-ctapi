import * as React from 'react';
import { styled, Theme, CSSObject } from '@mui/material/styles';
import {
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `72px`,
});

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open: boolean }>(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-paper': {
    top: 64, // AppBar height
    height: 'calc(100vh - 64px)',
  },
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': {
      ...openedMixin(theme),
      marginTop: 64,
      height: 'calc(100vh - 64px)',
    },
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': {
      ...closedMixin(theme),
      marginTop: 64,
      height: 'calc(100vh - 64px)',
    },
  }),
}));

const MiniDrawer = ({ onDrawerHover }: { onDrawerHover?: (open: boolean) => void }) => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMouseEnter = () => {
    setOpen(true);
    onDrawerHover?.(true);
  };

  const handleMouseLeave = () => {
    setOpen(false);
    onDrawerHover?.(false);
  };

  const handleUserManagementClick = () => {
    navigate('/dashboard/user-management');
  };

  const handleAcademicsClick = () => {
    navigate('/dashboard/academics');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const isDashboardActive = location.pathname === '/dashboard' || location.pathname === '/dashboard/';
  const isUserManagementActive = location.pathname.includes('/user-management');
  const isAcademicsActive = location.pathname.includes('/academics');

  return (
    <Drawer
      variant="permanent"
      open={open}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Divider />

      <List>
        {[
          { text: 'Users Management', icon: <PeopleAltIcon style={{color: "#064F1E"}} />, onClick: handleUserManagementClick, isActive: isUserManagementActive },
          { text: 'Academics', icon: <SchoolRoundedIcon style={{color: "#064F1E"}} />, onClick: handleAcademicsClick, isActive: isAcademicsActive },
        //   { text: 'Settings', icon: <SettingsIcon /> },
        ].map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={item.onClick}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                backgroundColor: item.isActive ? '#e8f5e9' : 'transparent',
                borderLeft: item.isActive ? '4px solid #064F1E' : 'none',
                paddingLeft: item.isActive ? '1.5rem' : '1.5rem',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{ opacity: open ? 1 : 0 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default MiniDrawer;
