// src/pages/Roadmap.jsx
import { motion } from "framer-motion"

export default function Roadmap() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold mb-2">Roadmap</h1>
      <p className="text-lg text-gray-200/90">
        Explore upcoming milestones and features.
      </p>
    </motion.div>
  )
}

