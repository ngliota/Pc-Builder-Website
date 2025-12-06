import { DataTypes } from "sequelize";
import db from "../config/database.js";

const Prebuilt = db.define(
  "Prebuilt",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    image_url: { type: DataTypes.STRING(255) },
    specs: { type: DataTypes.JSON },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "prebuilts", timestamps: false }
);

export default Prebuilt;
