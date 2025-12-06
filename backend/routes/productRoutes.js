import express from "express";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  purchaseProduct,
} from "../controllers/productController.js";
import { verifyAdminToken, verifyUserToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// Public
router.get("/", listProducts);
router.get("/:id", getProduct);

// Admin only
router.post("/", verifyAdminToken, createProduct);
router.put("/:id", verifyAdminToken, updateProduct);
router.delete("/:id", verifyAdminToken, deleteProduct);

// User purchase (requires any valid JWT). Keep legacy verifyToken to accept existing tokens.
router.post("/:id/purchase", verifyUserToken, purchaseProduct);

export default router;
