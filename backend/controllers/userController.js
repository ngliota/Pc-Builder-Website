// controllers/userController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid"; // ✅ Add UUID import

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from root
let envPath = path.resolve(__dirname, "../../.env.local");
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(__dirname, "../../.env");
}
dotenv.config({ path: envPath });

// === REGISTER USER ===
export const registerUser = async (req, res) => {
  const { username, password, email, phone } = req.body;

  if (!username || !password || !email || !phone) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check existing username
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: "Username already taken" });
    }

    // Check existing email
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Check existing phone
    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(409).json({ message: "Phone number already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate UUID for userid
    const generatedUserId = uuidv4();

    // Create new user
    const user = await User.create({
      userid: generatedUserId,
      username,
      email,
      phone,
      password: hashedPassword,
    });

    // Create JWT
    const token = jwt.sign(
      {
        id: user.userid, // ✅ use `userid` as ID
        username: user.username,
        role: "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      message: "✅ User registered successfully",
      token,
      user: {
        id: user.userid,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// === LOGIN USER ===
export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ message: "User not found" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: user.userid, username: user.username, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    return res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.userid, username: user.username, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
