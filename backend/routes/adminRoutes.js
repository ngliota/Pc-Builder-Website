import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAllAdmins,
  deleteAdmin,
  updateAdmin,
} from "../controllers/adminController.js";
import { body } from "express-validator";
import { verifyAdminToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// POST /api/admin/register
router.post(
  "/register",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  registerAdmin
);

// POST /api/admin/login
router.post("/login", loginAdmin);

// GET /api/admin/all
router.get("/all", verifyAdminToken, getAllAdmins);

// DELETE /api/admin/:id
router.delete("/:id", verifyAdminToken, deleteAdmin);

// PUT /api/admin/:id
router.put("/:id", verifyAdminToken, updateAdmin);

export default router;
