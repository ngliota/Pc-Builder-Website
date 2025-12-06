// src/App.jsx
import React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import Home from "./pages/Home"
import About from "./pages/About"
import Signup from "./pages/Signup"
import LoginPage from "./pages/LoginPage"
import Checkout from "./pages/Checkout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminLoginPage from "./pages/admin/AdminLoginPage" // Create this file
import AdminProducts from "./pages/admin/AdminProducts"
import AdminProductNew from "./pages/admin/AdminProductNew"
import AdminPrebuilts from "./pages/admin/AdminPrebuilts"
import AdminOrders from "./pages/admin/AdminOrders"
import Profile from "./pages/Profile"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import SideNavbarAdmin from "./components/SideNavbarAdmin"
import PrebuildDetail from "./pages/PrebuildDetail"
import Simulation from "./pages/Simulation"
import Transactions from "./pages/Transactions"

const ProtectedRoute = ({ element, role }) => {
  const token = localStorage.getItem(`${role}Token`)
  const isAuthenticated = !!token
  const redirectTo = role === "admin" ? "/admin" : "/login"
  return isAuthenticated ? element : <Navigate to={redirectTo} replace />
}

const LayoutWrapper = ({ children }) => {
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith("/admin")
  const showAdminSidebar = isAdminPage && location.pathname !== "/admin"

  if (showAdminSidebar) {
    return (
      <div className="min-h-screen bg-[#030617]">
        <SideNavbarAdmin />
        <main className="ml-64 min-h-screen overflow-x-hidden bg-[#030617]">{children}</main>
      </div>
    )
  }

  if (isAdminPage) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="pt-0 min-h-screen overflow-hidden pb-16 sm:pb-20 starfield text-white/90">
        {children}
      </main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Explicit home route to avoid wildcard redirect */}
          <Route path="/home" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/transactions"
            element={<ProtectedRoute element={<Transactions />} role="user" />}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute element={<Profile />} role="user" />}
          />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/prebuild/:id" element={<PrebuildDetail />} />
          <Route path="/admin" element={<AdminLoginPage />} />

          {/* Admin dashboard protected by JWT */}
          <Route
            path="/admin/dashboard"
            element={<ProtectedRoute element={<AdminDashboard />} role="admin" />}
          />
          <Route
            path="/admin/products"
            element={<ProtectedRoute element={<AdminProducts />} role="admin" />}
          />
          <Route
            path="/admin/products/new"
            element={<ProtectedRoute element={<AdminProductNew />} role="admin" />}
          />
          <Route
            path="/admin/prebuilts"
            element={<ProtectedRoute element={<AdminPrebuilts />} role="admin" />}
          />
          <Route
            path="/admin/orders"
            element={<ProtectedRoute element={<AdminOrders />} role="admin" />}
          />

          {/* 404 fallback to canonical home */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  )
}

export default App
