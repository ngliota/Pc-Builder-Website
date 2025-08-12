// ✅ adminModel.js (with timestamps)
import { DataTypes } from "sequelize";
import db from "../config/database.js";

const Admin = db.define(
  "Admin",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true, // ✅ createdAt & updatedAt will be managed automatically
    tableName: "admins", // Optional: if your table is named `admins` in lowercase
  }
);

export default Admin;
