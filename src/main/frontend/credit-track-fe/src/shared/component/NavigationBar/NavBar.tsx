import AppBarTop from "../AppBar/AppBarTop";
import { useLocation } from "react-router-dom";
import "../../../shared/css/NavBar.css";

interface NavBarProps {
  onMainClick?: () => void;
  onAboutClick?: () => void;
  onProgramsClick?: () => void;
  onDeveloperClick?: () => void;
  onContactClick?: () => void;
  handleOpenModal?: () => void;
}

const NavBar = ({
  onMainClick,
  onAboutClick,
  onProgramsClick,
  onDeveloperClick,
  onContactClick,
  handleOpenModal,
}: NavBarProps) => {
  const location = useLocation();
  
  // Show menu items only if not in dashboard
  const pages = location.pathname.includes('/dashboard') 
    ? undefined 
    : [
        { label: 'About', onClick: onAboutClick },
        { label: 'Programs and Courses', onClick: onProgramsClick },
        { label: 'Team', onClick: onDeveloperClick },
        { label: 'Contact', onClick: onContactClick }
      ];

  return (
    <AppBarTop
      pages={pages}
      onMainClick={onMainClick}
      handleOpenModal={handleOpenModal}
      className="navigation-bar"
    />
  );
};

export default NavBar;
