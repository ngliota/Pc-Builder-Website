// admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ToastNotification from "/src/components/ToastNotification.jsx";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) navigate("/admin/login");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {toast.show && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "" })}
        />
      )}

      <motion.div
        className="w-full p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white p-6 rounded-lg shadow-md">
          <BookingList setToast={setToast} />
          <PickupList setToast={setToast} />
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
