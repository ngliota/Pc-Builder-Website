import db from "../config/database.js"
import Prebuilt from "../models/prebuiltModel.js"
import Product from "../models/productModel.js"
import PrebuiltComponent from "../models/prebuiltComponentModel.js"

const componentInclude = {
  model: PrebuiltComponent,
  as: "components",
  attributes: ["id", "product_id", "quantity"],
  include: [
    {
      model: Product,
      as: "product",
      attributes: ["id", "name", "brand", "category", "price", "stock", "is_active"],
    },
  ],
}

const createError = (message, status = 400) => {
  const err = new Error(message)
  err.status = status
  return err
}

const sanitizeSpecs = (value) => {
  if (value === undefined || value === null || value === "") return null
  if (typeof value === "object") return value
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      throw createError("Specs must be valid JSON")
    }
  }
  return null
}

const normalizeComponents = (raw) => {
  if (!Array.isArray(raw)) return []
  const merged = new Map()
  raw.forEach((item) => {
    const productId = Number(item.product_id ?? item.productId)
    const quantity = Number(item.quantity ?? item.qty ?? 1)
    if (!Number.isInteger(productId) || productId <= 0) throw createError("Each component requires a valid product id")
    if (!Number.isInteger(quantity) || quantity <= 0) throw createError("Component quantity must be at least 1")
    merged.set(productId, (merged.get(productId) || 0) + quantity)
  })
  return Array.from(merged.entries()).map(([product_id, quantity]) => ({ product_id, quantity }))
}

export const listPrebuilts = async (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === "true"
    const where = includeInactive ? {} : { is_active: true }
    const prebuilts = await Prebuilt.findAll({ where, include: [componentInclude], order: [["id", "DESC"]] })
    res.json(prebuilts)
  } catch {
    res.status(500).json({ message: "Failed to fetch prebuilts" })
  }
}

export const getPrebuilt = async (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === "true"
    const where = includeInactive ? {} : { is_active: true }
    const prebuilt = await Prebuilt.findOne({ where: { ...where, id: req.params.id }, include: [componentInclude] })
    if (!prebuilt) return res.status(404).json({ message: "Prebuilt not found" })
    res.json(prebuilt)
  } catch {
    res.status(500).json({ message: "Failed to fetch prebuilt" })
  }
}

export const createPrebuilt = async (req, res) => {
  const t = await db.transaction()
  try {
    const { name, price, stock, image_url, is_active = true, specs, components } = req.body
    if (!name) throw createError("Name is required")
    if (!image_url) throw createError("Image is required for prebuilts")
    const normalizedComponents = normalizeComponents(components)
    if (normalizedComponents.length === 0) throw createError("At least one component is required")

    const productIds = normalizedComponents.map((c) => c.product_id)
    const products = await Product.findAll({ where: { id: productIds }, transaction: t })
    if (products.length !== productIds.length) throw createError("All referenced products must exist")
    products.forEach((product) => {
      if (!product.is_active) throw createError(`Product "${product.name}" is inactive`)
    })

    const prebuilt = await Prebuilt.create(
      {
        name,
        price: price === "" || price === undefined ? 0 : Number(price),
        stock: stock === "" || stock === undefined ? 0 : Number(stock),
        image_url,
        specs: sanitizeSpecs(specs),
        is_active: !!is_active,
      },
      { transaction: t }
    )

    await PrebuiltComponent.bulkCreate(
      normalizedComponents.map((component) => ({ ...component, prebuilt_id: prebuilt.id })),
      { transaction: t }
    )

    const fresh = await Prebuilt.findByPk(prebuilt.id, { include: [componentInclude], transaction: t })
    await t.commit()
    res.status(201).json(fresh)
  } catch (err) {
    await t.rollback()
    res.status(err.status || 500).json({ message: err.message || "Failed to create prebuilt" })
  }
}

export const updatePrebuilt = async (req, res) => {
  const t = await db.transaction()
  try {
    const prebuilt = await Prebuilt.findByPk(req.params.id, { transaction: t })
    if (!prebuilt) throw createError("Prebuilt not found", 404)

    const payload = {}
    if (req.body.name !== undefined) payload.name = req.body.name
    if (req.body.price !== undefined) payload.price = Number(req.body.price) || 0
    if (req.body.stock !== undefined) payload.stock = Number(req.body.stock) || 0
    if (req.body.image_url !== undefined) payload.image_url = req.body.image_url
    if (req.body.is_active !== undefined) payload.is_active = !!req.body.is_active
    if (req.body.specs !== undefined) payload.specs = sanitizeSpecs(req.body.specs)

    if (Object.keys(payload).length) {
      await prebuilt.update(payload, { transaction: t })
    }

    if (req.body.components !== undefined) {
      const normalizedComponents = normalizeComponents(req.body.components)
      if (normalizedComponents.length === 0) throw createError("Components cannot be empty")

      const productIds = normalizedComponents.map((c) => c.product_id)
      const products = await Product.findAll({ where: { id: productIds }, transaction: t })
      if (products.length !== productIds.length) throw createError("All referenced products must exist")

      await PrebuiltComponent.destroy({ where: { prebuilt_id: prebuilt.id }, transaction: t })
      await PrebuiltComponent.bulkCreate(
        normalizedComponents.map((component) => ({ ...component, prebuilt_id: prebuilt.id })),
        { transaction: t }
      )
    }

    const fresh = await Prebuilt.findByPk(prebuilt.id, { include: [componentInclude], transaction: t })
    await t.commit()
    res.json(fresh)
  } catch (err) {
    await t.rollback()
    res.status(err.status || 500).json({ message: err.message || "Failed to update prebuilt" })
  }
}

export const deletePrebuilt = async (req, res) => {
  try {
    const deleted = await Prebuilt.destroy({ where: { id: req.params.id } })
    if (!deleted) return res.status(404).json({ message: "Prebuilt not found" })
    res.json({ message: "Prebuilt deleted" })
  } catch {
    res.status(500).json({ message: "Failed to delete prebuilt" })
  }
}

export const purchasePrebuilt = async (req, res) => {
  const qty = Number(req.body.qty || 1)
  if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ message: "Invalid qty" })

  const t = await db.transaction()
  try {
    const prebuilt = await Prebuilt.findByPk(req.params.id, {
      include: [componentInclude],
      lock: t.LOCK.UPDATE,
      transaction: t,
    })
    if (!prebuilt || !prebuilt.is_active) throw createError("Prebuilt not available", 404)
    if (prebuilt.stock < qty) throw createError("Insufficient prebuilt stock")

    const components = prebuilt.components || []
    if (components.length === 0) throw createError("Prebuilt has no linked components")

    const productIds = components.map((component) => component.product_id)
    const products = await Product.findAll({
      where: { id: productIds },
      transaction: t,
      lock: t.LOCK.UPDATE,
    })
    const productMap = new Map(products.map((product) => [product.id, product]))

    for (const component of components) {
      const product = productMap.get(component.product_id)
      if (!product) throw createError("Referenced product missing")
      const required = component.quantity * qty
      if (product.stock < required) throw createError(`Insufficient stock for ${product.name}`)
    }

    for (const component of components) {
      const product = productMap.get(component.product_id)
      const required = component.quantity * qty
      product.stock = product.stock - required
      await product.save({ transaction: t })
    }

    prebuilt.stock = prebuilt.stock - qty
    await prebuilt.save({ transaction: t })

    await t.commit()
    res.json({ message: "Prebuilt purchased", remaining: prebuilt.stock })
  } catch (err) {
    await t.rollback()
    res.status(err.status || 500).json({ message: err.message || "Failed to purchase prebuilt" })
  }
}
