import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { validationResult } from "express-validator";

// Fungsi untuk mendaftarkan admin
export const registerAdmin = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Debugging

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map((error) => ({
          field: error.param,
          message: error.msg,
        })),
      });
    }

    const { username, password } = req.body;

    // Periksa apakah username sudah digunakan
    const existingAdmin = await Admin.findOne({ where: { username } });
    if (existingAdmin) {
      return res.status(409).json({ message: "Username sudah digunakan" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan admin ke database
    const admin = await Admin.create({
      username,
      password: hashedPassword,
    });

    console.log("Admin Created:", admin); // Debugging
    res.status(201).json({ message: "Admin berhasil dibuat", admin });
  } catch (error) {
    console.error("Error Registering Admin:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan saat registrasi admin" });
  }
};

// Fungsi untuk login admin
export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      return res.status(404).json({ message: "Admin tidak ditemukan" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password salah" });
    }

    const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      message: "Login berhasil",
      token,
      admin: { id: admin.id, username: admin.username },
    });
  } catch (error) {
    console.error("Error Logging In Admin:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan saat login admin" });
  }
};

// Fungsi untuk mendapatkan semua admin
export const getAllAdmins = async (req, res) => {
  try {
    console.log("Fetching all admins"); // Debugging

    const admins = await Admin.findAll({
      attributes: ["id", "username", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ message: "Daftar Admin", admins });
  } catch (error) {
    console.error("Error Fetching Admins:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan saat mengambil daftar admin" });
  }
};

// Fungsi untuk menghapus admin berdasarkan ID
export const deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;

    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin tidak ditemukan" });
    }

    await admin.destroy();
    res.status(200).json({ message: "Admin berhasil dihapus" });
  } catch (error) {
    console.error("Error Deleting Admin:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan saat menghapus admin" });
  }
};

// Fungsi untuk memperbarui data admin
export const updateAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    const { username, password } = req.body;

    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin tidak ditemukan" });
    }

    if (username) {
      const existingAdmin = await Admin.findOne({ where: { username } });
      if (existingAdmin && existingAdmin.id !== adminId) {
        return res.status(409).json({ message: "Username sudah digunakan" });
      }
      admin.username = username;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      admin.password = hashedPassword;
    }

    await admin.save();
    res.status(200).json({ message: "Admin berhasil diperbarui", admin });
  } catch (error) {
    console.error("Error Updating Admin:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan saat memperbarui admin" });
  }
};
