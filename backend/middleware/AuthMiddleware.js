import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Middleware untuk memverifikasi token JWT
export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Authorization Header:", req.headers.authorization);

    if (!token) {
      console.error("Token not provided");
      return res.status(403).json({ error: "Access Denied. Token is missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error in verifyToken middleware:", error.message);
    res.status(403).json({ error: "Invalid or expired token." });
  }
};


// Middleware untuk memeriksa peran admin
export const verifyAdminToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).json({ error: "Access Denied. Token is missing." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id || decoded.role !== "admin") return res.status(403).json({ error: "Admin token required" });
    req.admin = decoded;
    next();
  } catch (error) {
    console.error("verifyAdminToken:", error.message);
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

// Middleware untuk memverifikasi token secara opsional (untuk endpoint publik yang bisa menerima token)
export const verifyOptionalToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Jika token tidak tersedia, lanjutkan tanpa memverifikasi
    req.admin = null;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
  } catch (error) {
    console.error("Optional JWT Error:", error.message);
    req.admin = null; // Token tidak valid, tetapi lanjutkan tanpa token
  }

  next();
};

// Backward-compatible alias expected by some routes
export const verifyUserToken = verifyToken;
