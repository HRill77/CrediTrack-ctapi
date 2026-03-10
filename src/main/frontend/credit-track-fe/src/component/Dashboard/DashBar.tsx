import NavBar from "../../shared/component/NavigationBar/NavBar";

interface DashBarProps {
  handleOpenModal?: () => void;
}

const DashBar = ({ handleOpenModal }: DashBarProps) => {
  return (
    <NavBar
      handleOpenModal={handleOpenModal}
      onMainClick={() => {}}
      onAboutClick={() => {}}
      onProgramsClick={() => {}}
      onDeveloperClick={() => {}}
      onContactClick={() => {}}
    />
  );
};

export default DashBar;

