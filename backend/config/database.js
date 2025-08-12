// database.js
import { Sequelize } from "sequelize"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"

// Choose correct .env file based on NODE_ENV
let envFile = ".env.local"
if (process.env.NODE_ENV === "production") {
  envFile = ".env"
}

// Load the .env file if it exists
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile })
  console.log(`✅ Loaded environment variables from ${envFile}`)
} else {
  console.warn(`⚠️ Env file "${envFile}" not found!`)
}

// Connect to MySQL using Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
  }
)

// Try authenticating the connection
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Connected to MySQL successfully!")
  })
  .catch((error) => {
    console.error("❌ Failed to connect to MySQL:", error.message)
    process.exit(1)
  })

export default sequelize
