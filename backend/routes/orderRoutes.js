import express from "express"
import { createOrder, listMyOrders, listAllOrders, updateStatus } from "../controllers/orderController.js"
import { verifyToken, verifyAdminToken } from "../middleware/AuthMiddleware.js"

const router = express.Router()

router.post("/", verifyToken, createOrder)
router.get("/me", verifyToken, listMyOrders)
router.get("/", verifyAdminToken, listAllOrders)
// Allow owners to cancel; admins can manage all statuses
router.patch("/:id/status", verifyToken, updateStatus)

export default router
