// src/App.tsx
import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CrediTrack from "./component/Main/CrediTrack";
import { AuthContext } from "./shared/context/AuthContext";

import ProtectedRoute from "./shared/component/ProtectedRoute";
import GuestDashboard from "./component/GuestDashboard/GuestDashBoard";
import Dashboard from "./component/Dashboard/Dashboard";
import { HashLoader } from "react-spinners";
import UpdatePassword from "./shared/component/UpdatePassword";
import ForgotPassword from "./shared/component/ForgotPassword";
import { R } from "@tanstack/react-query-devtools/build/legacy/ReactQueryDevtools-ChNsB-ya";
import GuestCreditTrackResult from "./component/GuestDashboard/GuestCreditTrackResult";

// import AdminDashboard from './pages/AdminDashboard'; // example future route

const App: React.FC = () => {
  const { isAuthLoading } = useContext(AuthContext);
  const isGuest = sessionStorage.getItem("isGuest") === "true";
  // console.log("isGuest in App.tsx:", isGuest);
  if (isAuthLoading) {
    // console.log("Auth loading in ProtectedRoute:", isAuthLoading);
    return (
      <>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <HashLoader color="#064F1E" />
        </div>
      </>
    ); // or spinner
  }

  return (
    <Routes>
      {/* public landing page */}
      <Route path="/" element={<CrediTrack />} />
      <Route
        path="/GuestCreditTrackResult/*"
        element={<GuestCreditTrackResult />}
      />
      <Route
        path="/dashboard/*"
        element={
          isGuest ? (
            <GuestDashboard />
          ) : (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )
        }
      />

      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
};

export default App;
