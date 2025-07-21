import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToastNotification = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000); // Auto-close setelah 4 detik

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-5 right-5 z-50 w-80 max-w-xs p-4 rounded-md shadow-lg text-white flex flex-col`}
          style={{
            backgroundColor: type === "error" ? "#dc3545" : "#28a745",
          }}
        >
          <div className="flex justify-between items-center font-semibold">
            <span>{type === "error" ? "Error" : "Success"}</span>
            <button
              onClick={() => setVisible(false)}
              className="text-white text-lg font-bold focus:outline-none hover:opacity-80"
            >
              ✖
            </button>
          </div>

          <p className="text-sm mt-1">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification;
