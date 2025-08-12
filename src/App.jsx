// src/App.jsx
import React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import Home from "./pages/Home"
import Signup from "./pages/Signup"
import LoginPage from "./pages/LoginPage"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminLoginPage from "./pages/admin/AdminLoginPage" // Create this file
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import SideNavbarAdmin from "./components/SideNavbarAdmin"

const ProtectedRoute = ({ element, role }) => {
  const token = localStorage.getItem(`${role}Token`)
  const isAuthenticated = !!token
  const redirectTo = role === "admin" ? "/admin" : "/login"
  return isAuthenticated ? element : <Navigate to={redirectTo} replace />
}

const LayoutWrapper = ({ children }) => {
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith("/admin")

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
  )
}

function App() {
  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />

          {/* Admin dashboard protected by JWT */}
          <Route
            path="/admin/dashboard"
            element={<ProtectedRoute element={<AdminDashboard />} role="admin" />}
          />

          {/* 404 fallback to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  )
}

export default App
