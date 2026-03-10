import React, { createContext, useState } from "react";

type SnackbarContextType = {
  openSnack: {
    isSuccess: boolean;
    message: string;
  };
  setOpenSnack: React.Dispatch<
    React.SetStateAction<{
      isSuccess: boolean;
      message: string;
    }>
  >;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  closeSnack: () => void;
};

export const SnackbarContext = createContext<SnackbarContextType>({
  openSnack: {
    isSuccess: false,
    message: "",
  },
  setOpenSnack: () => {},
  showSuccess: () => {},
  showError: () => {},
  closeSnack: () => {},
});

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [openSnack, setOpenSnack] = useState({
    isSuccess: false,
    message: "",
  });

  const showSuccess = (message: string) => {
    setOpenSnack({ isSuccess: true, message });
  };

  const showError = (message: string) => {
    setOpenSnack({ isSuccess: false, message });
  };

  const closeSnack = () => {
    setOpenSnack({ isSuccess: false, message: "" });
  };

  return (
    <SnackbarContext.Provider
      value={{ openSnack, setOpenSnack, showSuccess, showError, closeSnack }}
    >
      {children}
    </SnackbarContext.Provider>
  );
};
