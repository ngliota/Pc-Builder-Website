import express from "express";
import {
  listPrebuilts,
  getPrebuilt,
  createPrebuilt,
  updatePrebuilt,
  deletePrebuilt,
  purchasePrebuilt,
} from "../controllers/prebuiltController.js";
import { verifyAdminToken, verifyUserToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.get("/", listPrebuilts);
router.get("/:id", getPrebuilt);

router.post("/", verifyAdminToken, createPrebuilt);
router.put("/:id", verifyAdminToken, updatePrebuilt);
router.delete("/:id", verifyAdminToken, deletePrebuilt);

router.post("/:id/purchase", verifyUserToken, purchasePrebuilt);

export default router;
