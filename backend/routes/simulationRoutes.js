import express from "express";
import {
  createSimulation,
  listMySimulations,
  getMySimulation,
  updateMySimulation,
  deleteMySimulation,
} from "../controllers/simulationController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// All simulation endpoints require a user token
router.get("/", verifyToken, listMySimulations);
router.post("/", verifyToken, createSimulation);
router.get("/:id", verifyToken, getMySimulation);
router.put("/:id", verifyToken, updateMySimulation);
router.delete("/:id", verifyToken, deleteMySimulation);

export default router;

