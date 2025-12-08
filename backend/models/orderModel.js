// models/orderModel.js
import { DataTypes } from "sequelize"
import db from "../config/database.js"

const Order = db.define(
  "Order",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    transaction_id: { type: DataTypes.STRING, allowNull: false },
    userid: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "to-build",
      validate: {
        isIn: [["to-build", "building", "sending", "sent", "cancelled", "refunded"]],
      },
    }, // to-build, building, sending, sent, cancelled, refunded
    status_changed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    delivery_fee: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    services_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    delivery_option: { type: DataTypes.STRING },
    services: { type: DataTypes.JSON },
    payment_method: { type: DataTypes.STRING },
    payment_masked: { type: DataTypes.STRING },
    tracking_number: { type: DataTypes.STRING },
    cancellation_reason: { type: DataTypes.STRING },
    refunded_at: { type: DataTypes.DATE },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: "orders", timestamps: false }
)

export default Order
