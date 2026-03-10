import React, { createContext, useEffect, useState } from "react";
import AuthService from "../services/AuthService";
import { useNavigate } from "react-router-dom";
type AuthContextType = {
  currentUser: any;
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  logout: () => Promise<void>;
  getCurrentUser: () => void;
  isAuthLoading: boolean;
};



export const AuthContext = createContext<AuthContextType>({
  currentUser: undefined,
  setCurrentUser: () => {},
  logout: async () => {},
  getCurrentUser: () => {},
  isAuthLoading: true,
});
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const navigate = useNavigate();

  const getCurrentUser = async () => {
    try {
      const response = await AuthService.getUserInfo();
      setCurrentUser(response.data);
    } catch {
      setCurrentUser(undefined);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = async () => {
    await AuthService.logout();
    setCurrentUser(undefined);
    sessionStorage.removeItem('isGuest');
    navigate('/');
  };

  useEffect(() => {
    const isGuest = sessionStorage.getItem('isGuest') === 'true';
    // Don't check auth if user is a guest
    if (isGuest) {
      setIsAuthLoading(false);
    } else {
      getCurrentUser();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ currentUser, setCurrentUser, logout, getCurrentUser, isAuthLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
