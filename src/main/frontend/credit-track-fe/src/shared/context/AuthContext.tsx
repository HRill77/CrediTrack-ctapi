import React, { createContext, useEffect, useState } from "react";
import AuthService from "../services/AuthService";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

 type AuthContextType = {
  currentUser: any;
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  isAuthLoading: boolean;
};

const USER_QUERY_KEY = ["user"];

export const AuthContext = createContext<AuthContextType>({
  currentUser: undefined,
  setCurrentUser: () => {},
  logout: async () => {},
  getCurrentUser: async () => {},
  isAuthLoading: true,
});
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Use React Query to fetch user data
  const { data: userData, refetch } = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      const response = await AuthService.getUserInfo();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: false, // Manual control
  });

  const getCurrentUser = async () => {
    try {
      const { data } = await refetch();
      setCurrentUser(data);
    } catch {
      setCurrentUser(undefined);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = async () => {
    await AuthService.logout();
    setCurrentUser(undefined);
    queryClient.removeQueries({ queryKey: USER_QUERY_KEY });
    localStorage.removeItem('isGuest');
    navigate('/');
  };

  useEffect(() => {
    const isGuest = localStorage.getItem('isGuest') === 'true';
    // Don't check auth if user is a guest
    if (isGuest) {
      setIsAuthLoading(false);
    } else {
      getCurrentUser();
    }
  }, []);

  // // Update currentUser when userData changes
  // useEffect(() => {
  //   if (userData) {
  //     setCurrentUser(userData);
  //   }
  // }, [userData]);

  return (
    <AuthContext.Provider
      value={{ currentUser, setCurrentUser, logout, getCurrentUser, isAuthLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};