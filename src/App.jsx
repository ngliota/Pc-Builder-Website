// src/App.jsx
import React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom"
import Home from "./pages/Home"
import About from "./pages/About"
import Signup from "./pages/Signup"
import LoginPage from "./pages/LoginPage"
import Checkout from "./pages/Checkout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminLoginPage from "./pages/admin/AdminLoginPage"
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

const UserLayout = () => (
  <>
    <Navbar />
    <main className="pt-0 min-h-screen overflow-hidden pb-16 sm:pb-20 starfield text-white/90">
      <Outlet />
    </main>
    <Footer />
  </>
);

const AdminLayout = () => (
  <div className="min-h-screen bg-[#030617]">
    <SideNavbarAdmin />
    <main className="ml-64 min-h-screen overflow-x-hidden bg-[#030617]">
      <Outlet />
    </main>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
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
        </Route>

        <Route path="/admin" element={<AdminLoginPage />} />

        <Route element={<ProtectedRoute element={<AdminLayout />} role="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProductNew />} />
          <Route path="/admin/prebuilts" element={<AdminPrebuilts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  )
}

export default App
