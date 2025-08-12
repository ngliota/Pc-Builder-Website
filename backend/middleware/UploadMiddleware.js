// UploadMiddleware.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import express from "express";

// Setup __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Folder for uploads (you can expand later)
const uploadDir = path.join(__dirname, "../uploads/profile");

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`✅ Created upload directory: ${uploadDir}`);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// File type filter (only jpg, jpeg, png)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG files are allowed"));
  }
};

// Multer config
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// === Exported helpers ===

// Upload single image (e.g., for profile photo)
export const uploadSingleImage = upload.single("photo");

// Upload multiple (max 5)
export const uploadMultipleImages = upload.array("photos", 5);

// Serve static files
export const serveStaticUploads = (app) => {
  const uploadsPath = path.join(__dirname, "../uploads");
  app.use("/uploads", express.static(uploadsPath));
  console.log("📁 Serving uploads at /uploads");
};

// Error handler for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  } else if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large (max 5MB)." });
    }
    return res.status(400).json({ error: err.message });
  }
  next();
};

export default upload;
