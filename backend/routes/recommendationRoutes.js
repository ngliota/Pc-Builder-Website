import express from "express"
import { recommendBuild } from "../controllers/recommendationController.js"

const router = express.Router()

// POST /api/recommendations -> automated pick based on use-case/budget/resolution
router.post("/", recommendBuild)

export default router
