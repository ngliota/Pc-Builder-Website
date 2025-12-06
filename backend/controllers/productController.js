import { Op } from "sequelize";
import Product from "../models/productModel.js";

// Ensure DB has image_url column so image uploads don't break older schemas.
let ensuredImageColumn = false;
const ensureImageColumn = async () => {
  if (ensuredImageColumn) return;
  try {
    const qi = Product.sequelize.getQueryInterface();
    const table = await qi.describeTable("products");
    if (!table.image_url) {
      await qi.addColumn("products", "image_url", {
        type: Product.rawAttributes.image_url.type,
        allowNull: true,
      });
    }
    ensuredImageColumn = true;
  } catch (err) {
    // If the column already exists or we cannot modify, continue gracefully.
    console.error("ensureImageColumn:", err.message);
  }
};

const dedupeProducts = (items = []) => {
  const seen = new Set();
  return items.filter((product) => {
    const key = [
      (product.name || "").trim().toLowerCase(),
      (product.brand || "").trim().toLowerCase(),
      (product.category || "").trim().toLowerCase(),
      Number(product.price || 0),
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Public: list products (active only by default)
export const listProducts = async (req, res) => {
  try {
    await ensureImageColumn();
    const includeInactive = req.query.include_inactive === "true";
    const excludePrebuilt = req.query.exclude_prebuilt === "true";
    const where = {};
    if (!includeInactive) where.is_active = true;
    if (excludePrebuilt) where.category = { [Op.ne]: "prebuilt" };

    const products = await Product.findAll({ where });
    const uniqueProducts = dedupeProducts(products);
    res.json(uniqueProducts);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// Public: get product by id
export const getProduct = async (req, res) => {
  try {
    const item = await Product.findByPk(req.params.id);
    if (!item || !item.is_active) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// Admin: create product
export const createProduct = async (req, res) => {
  try {
    await ensureImageColumn();
    const { name, brand, category, price, stock, image_url, is_active } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const created = await Product.create({ name, brand, category, price, stock, image_url, is_active });
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: "Failed to create product" });
  }
};

// Admin: update product
export const updateProduct = async (req, res) => {
  try {
    await ensureImageColumn();
    const item = await Product.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    const payload = {};
    if (req.body.name !== undefined) payload.name = req.body.name;
    if (req.body.brand !== undefined) payload.brand = req.body.brand;
    if (req.body.category !== undefined) payload.category = req.body.category;
    if (req.body.price !== undefined) payload.price = req.body.price;
    if (req.body.stock !== undefined) payload.stock = req.body.stock;
    if (req.body.image_url !== undefined) payload.image_url = req.body.image_url;
    if (req.body.is_active !== undefined) payload.is_active = req.body.is_active;
    await item.update(payload);
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: "Failed to update product" });
  }
};

// Admin: delete product
export const deleteProduct = async (req, res) => {
  try {
    const item = await Product.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    await item.destroy();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// User: purchase (decrement stock)
export const purchaseProduct = async (req, res) => {
  try {
    const qty = Number(req.body.qty || 1);
    if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ message: "Invalid qty" });
    const item = await Product.findByPk(req.params.id);
    if (!item || !item.is_active) return res.status(404).json({ message: "Not found" });
    if (item.stock < qty) return res.status(400).json({ message: "Insufficient stock" });
    item.stock = item.stock - qty;
    await item.save();
    res.json({ message: "Purchased", remaining: item.stock });
  } catch (e) {
    res.status(500).json({ message: "Failed to purchase" });
  }
};
