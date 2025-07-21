// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SideNavbarAdmin from "./components/SideNavbarAdmin";


const ProtectedRoute = ({ element, redirectTo }) => {
  const token = localStorage.getItem("adminToken");
  return token ? element : <Navigate to={redirectTo} replace />;
};

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      {isAdminPage ? (
        <div className="flex">
          <SideNavbarAdmin />
          <main className="ml-64 w-full">{children}</main>
        </div>
      ) : (
        <>
          <Navbar />
          <main className="pt-16 md:pt-24 sm:pt-28 min-h-screen overflow-hidden">
            {children}
          </main>
          <Footer />
        </>
      )}
    </>
  );
};

function App() {
  return (
    <Router>
      <LayoutWrapper>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* 404 - Redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;
