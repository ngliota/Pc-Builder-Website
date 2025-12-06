// models/transactionModel.js
import { DataTypes } from "sequelize";
import db from "../config/database.js";

const Transaction = db.define(
  "Transaction",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    userid: { type: DataTypes.STRING, allowNull: false }, // FK -> Users.userid
    status: {
      type: DataTypes.ENUM("pending", "paid", "cancelled", "expired", "refunded"),
      allowNull: false,
      defaultValue: "pending"
    },
    total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    payment_method: { type: DataTypes.STRING(50) },
    payment_proof_url: { type: DataTypes.STRING(255) },
    notes: { type: DataTypes.TEXT }
  },
  { tableName: "transactions", timestamps: false }
);

export default Transaction;
