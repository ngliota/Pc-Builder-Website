// models/simulationModel.js
import { DataTypes } from "sequelize";
import db from "../config/database.js";

const Simulation = db.define(
  "Simulation",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    userid: { type: DataTypes.STRING, allowNull: false }, // FK -> Users.userid
    title: { type: DataTypes.STRING },
    parts: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    estimated_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }
  },
  { tableName: "simulations", timestamps: false }
);

export default Simulation;
