// UploadMiddleware.js
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import express from "express"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ensureUploadDir = (subFolder = "profile") => {
  const target = path.join(__dirname, "../uploads", subFolder)
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true })
    console.log(`✅ Created upload directory: ${target}`)
  }
  return target
}

const createStorage = (subFolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, ensureUploadDir(subFolder)),
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      cb(null, uniqueName + path.extname(file.originalname))
    },
  })

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"]
  if (allowedTypes.includes(file.mimetype)) cb(null, true)
  else cb(new Error("Only JPG, JPEG, PNG files are allowed"))
}

const createUploader = (subFolder = "profile") =>
  multer({
    storage: createStorage(subFolder),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  })

export const singleImageUpload = (subFolder = "profile", fieldName = "photo") =>
  createUploader(subFolder).single(fieldName)

export const multiImageUpload = (subFolder = "profile", fieldName = "photos", max = 5) =>
  createUploader(subFolder).array(fieldName, max)

export const serveStaticUploads = (app) => {
  const uploadsPath = path.join(__dirname, "../uploads")
  app.use("/uploads", express.static(uploadsPath))
  console.log("📁 Serving uploads at /uploads")
}

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer error: ${err.message}` })
  }
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large (max 5MB)." })
    }
    return res.status(400).json({ error: err.message })
  }
  return next()
}

export const profileImageUpload = singleImageUpload("profile", "photo")
export const productImageUpload = singleImageUpload("products", "image")

export default createUploader()
