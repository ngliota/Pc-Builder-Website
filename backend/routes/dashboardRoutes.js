// backend/routes/dashboardRoutes.js
import express from "express"
import { getTelemetry } from "../controllers/dashboardController.js"
import { verifyAdminToken } from "../middleware/AuthMiddleware.js"

const router = express.Router()

router.get("/telemetry", verifyAdminToken, getTelemetry)

export default router
