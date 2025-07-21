// src/pages/Home.jsx
import { motion } from "framer-motion";

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center p-6"
    >
      <h1 className="text-3xl font-bold">Welcome to the Home Page</h1>
      <p className="text-lg mt-2">Smooth fade-in animation with Framer Motion</p>
    </motion.div>
  )
}