// routes/userRoutes.js
import express from "express"
import { registerUser, loginUser } from "../controllers/userController.js"

const router = express.Router()

// POST /api/register
router.post("/register", registerUser)

// POST /api/login
router.post("/login", loginUser)

export default router
