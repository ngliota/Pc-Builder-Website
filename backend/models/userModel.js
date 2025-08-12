// models/userModel.js
import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import db from "../config/database.js";

const User = db.define(
  "User",
  {
    userid: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => uuidv4(), // auto generate string UUID
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "Users",
    timestamps: false,
  }
);

export default User;
