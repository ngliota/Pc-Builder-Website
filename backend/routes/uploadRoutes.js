import express from "express"
import { verifyAdminToken } from "../middleware/AuthMiddleware.js"
import { productImageUpload, handleMulterError } from "../middleware/UploadMiddleware.js"

const router = express.Router()

router.post("/product-image", verifyAdminToken, productImageUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" })
  }

  const relativePath = `/uploads/products/${req.file.filename}`.replace(/\\/g, "/")
  const absoluteUrl = `${req.protocol}://${req.get("host")}${relativePath}`

  return res.status(201).json({
    message: "Image uploaded",
    path: relativePath,
    url: absoluteUrl,
    filename: req.file.filename,
  })
})

router.use(handleMulterError)

export default router
