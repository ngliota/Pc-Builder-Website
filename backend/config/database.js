// database.js
import { Sequelize } from "sequelize"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"

// Load env file from repo root or backend folder (supports .env.local and .env)
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
  console.warn("Env file not found; falling back to process environment only.")
}

const dbPassword = process.env.DB_PASSWORD ?? process.env.DB_PASS ?? ""

// Connect to MySQL using Sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, dbPassword, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: "mysql",
  logging: false,
})

// Try authenticating the connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Connected to MySQL successfully")
  })
  .catch((error) => {
    console.error("Failed to connect to MySQL:", error.message)
    process.exit(1)
  })

export default sequelize
