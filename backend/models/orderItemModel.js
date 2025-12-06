// models/orderItemModel.js
import { DataTypes } from "sequelize"
import db from "../config/database.js"

const OrderItem = db.define(
  "OrderItem",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    product_id: { type: DataTypes.BIGINT.UNSIGNED },
    name: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    image_url: { type: DataTypes.STRING },
  },
  { tableName: "order_items", timestamps: false }
)

export default OrderItem
