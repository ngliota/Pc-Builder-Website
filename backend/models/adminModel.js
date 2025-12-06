// models/adminModel.js
import { DataTypes } from "sequelize";
import db from "../config/database.js";

const Admin = db.define(
  "Admin",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false }
  },
  { tableName: "admins", timestamps: false }
);

export default Admin;
