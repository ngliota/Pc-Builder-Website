// models/productModel.js
import { DataTypes } from "sequelize";
import db from "../config/database.js";

const Product = db.define(
  "Product",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    brand: { type: DataTypes.STRING },
    category: { type: DataTypes.STRING },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    image_url: { type: DataTypes.STRING },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  },
  { tableName: "products", timestamps: false }
);

export default Product;
