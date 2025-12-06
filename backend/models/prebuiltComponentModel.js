import { DataTypes } from "sequelize";
import db from "../config/database.js";
import Prebuilt from "./prebuiltModel.js";
import Product from "./productModel.js";

const PrebuiltComponent = db.define(
  "PrebuiltComponent",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    prebuilt_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
  },
  { tableName: "prebuilt_components", timestamps: false }
);

Prebuilt.hasMany(PrebuiltComponent, { foreignKey: "prebuilt_id", as: "components", onDelete: "CASCADE" });
PrebuiltComponent.belongsTo(Prebuilt, { foreignKey: "prebuilt_id" });

Product.hasMany(PrebuiltComponent, { foreignKey: "product_id", as: "prebuiltUses" });
PrebuiltComponent.belongsTo(Product, { foreignKey: "product_id", as: "product" });

export default PrebuiltComponent;
