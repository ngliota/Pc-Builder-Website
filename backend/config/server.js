// config/server.js
import dotenv from "dotenv"
import path from "path"
import fs from "fs"

// Load env file from repo root or backend folder
const envCandidates = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "backend/.env.local"),
  path.resolve(process.cwd(), "backend/.env"),
]
const envPath = envCandidates.find((file) => fs.existsSync(file))
if (envPath) {
  dotenv.config({ path: envPath })
  console.log(`Loaded environment variables from ${envPath}`)
} else {
  console.warn("Env file not found; relying on process environment only.")
}
if (!process.env.DB_USER || !process.env.DB_HOST) {
  console.error("Database configuration is missing (DB_USER/DB_HOST).")
  process.exit(1)
}

// === Core Libraries ===
import express from "express"
import helmet from "helmet"
import cors from "cors"
import rateLimit from "express-rate-limit"
import bodyParser from "body-parser"

// === Local Modules ===
import db from "./database.js"
import { serveStaticUploads } from "../middleware/UploadMiddleware.js"

// === Routes ===
import adminRoutes from "../routes/adminRoutes.js"
import userRoutes from "../routes/userRoutes.js"
import productRoutes from "../routes/productRoutes.js"
import prebuiltRoutes from "../routes/prebuiltRoutes.js"
import simulationRoutes from "../routes/simulationRoutes.js"
import uploadRoutes from "../routes/uploadRoutes.js"
import recommendationRoutes from "../routes/recommendationRoutes.js"
import orderRoutes from "../routes/orderRoutes.js"
import dashboardRoutes from "../routes/dashboardRoutes.js"

const app = express()
const PORT = process.env.PORT || 5000
const isProduction = process.env.NODE_ENV === "production"

// === Middleware ===
serveStaticUploads(app)

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://claycafe.id",
      "https://www.claycafe.id",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

if (isProduction) {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  )
}

app.use(bodyParser.json({ limit: "10mb" }))
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// === Logging & Input Trimming ===
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  console.log("Query Params:", req.query)
  console.log("Request Body:", req.body)
  next()
})

app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim()
      }
    }
  }
  next()
})

// === API Routes ===
app.use("/api/admin", adminRoutes)
app.use("/api", userRoutes)
app.use("/api/products", productRoutes)
app.use("/api/prebuilts", prebuiltRoutes)
app.use("/api/simulations", simulationRoutes)
app.use("/api/uploads", uploadRoutes)
app.use("/api/recommendations", recommendationRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/dashboard", dashboardRoutes)

// === 404 Handler ===
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found", url: req.url })
})

// === Error Handler ===
app.use((err, req, res, next) => {
  console.error("Error Middleware:", err.stack)
  res.status(500).json({ error: "Server error", message: err.message })
})

// === DB Init + Start Server ===
db.authenticate()
  .then(() => {
    console.log("DB connection verified")
    if (process.env.DB_SYNC === "true") {
      db.sync({ force: process.env.DB_FORCE_SYNC === "true" })
        .then(() => console.log("DB synced"))
        .catch((err) => console.error("DB sync error:", err))
    }
  })
  .catch((err) => console.error("DB connection failed:", err))

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
