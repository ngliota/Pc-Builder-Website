// config/server.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load from root project folder
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") })
if (!process.env.DB_USER || !process.env.DB_HOST) {
  console.error("❌ Failed to load .env correctly!");
  process.exit(1);
}

// === Core Libraries ===
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";

// === Local Modules ===
import db from "./database.js";
import { serveStaticUploads } from "../middleware/UploadMiddleware.js";

// === Routes ===
import adminRoutes from "../routes/adminRoutes.js";
import userRoutes from "../routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// === Middleware ===
serveStaticUploads(app);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);
app.use(
  cors({
    origin: ["http://localhost:5173", "https://claycafe.id", "https://www.claycafe.id"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// === Logging & Input Trimming ===
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Query Params:", req.query);
  console.log("Request Body:", req.body);
  next();
});

app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
});

// === API Routes ===
app.use("/api/admin", adminRoutes);
app.use("/api", userRoutes);

// === 404 Handler ===
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found", url: req.url });
});

// === Error Handler ===
app.use((err, req, res, next) => {
  console.error("Error Middleware:", err.stack);
  res.status(500).json({ error: "Server error", message: err.message });
});

// === DB Init + Start Server ===
db.authenticate()
  .then(() => {
    console.log("✅ DB connection verified");
    if (process.env.DB_SYNC === "true") {
      db.sync({ force: process.env.DB_FORCE_SYNC === "true" })
        .then(() => console.log("✅ DB synced"))
        .catch((err) => console.error("❌ DB sync error:", err));
    }
  })
  .catch((err) => console.error("❌ DB connection failed:", err));

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
