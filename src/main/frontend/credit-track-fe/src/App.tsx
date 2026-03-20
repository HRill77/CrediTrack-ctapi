// src/App.tsx
import React, { useContext, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CrediTrack from "./component/Main/CrediTrack";
import { AuthContext } from "./shared/context/AuthContext";

import ProtectedRoute from "./shared/component/ProtectedRoute";
import GuestDashboard from "./component/GuestDashboard/GuestDashBoard";
import Dashboard from "./shared/component/Dashboard/Dashboard";
import { HashLoader } from "react-spinners";
import UpdatePassword from "./shared/component/UpdatePassword";
import ForgotPassword from "./shared/component/ForgotPassword";
import GuestCreditTrackResult from "./component/GuestDashboard/GuestCreditTrackResult";
import Account from "./component/Account/Account";
import About from "./component/Main/About";
import Developers from "./component/Main/Developers";
import NotFound from "./shared/component/NotFound";




// import AdminDashboard from './pages/AdminDashboard'; // example future route

const App: React.FC = () => {
  const { isAuthLoading } = useContext(AuthContext);
  const [isGuestResultOpen, setIsGuestResultOpen] = useState(true);
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
        element={
          <GuestCreditTrackResult
            open={isGuestResultOpen}
            onClose={() => setIsGuestResultOpen(false)}
          />
        }
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
      <Route path="/account" element={<Account />} />


      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
           
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
