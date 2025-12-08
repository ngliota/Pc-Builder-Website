import db from "../config/database.js"
import Order from "../models/orderModel.js"
import OrderItem from "../models/orderItemModel.js"
import Product from "../models/productModel.js"
import Prebuilt from "../models/prebuiltModel.js"
import PrebuiltComponent from "../models/prebuiltComponentModel.js"

// Associations
Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items" })
OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" })

const createError = (message, status = 400) => {
  const err = new Error(message)
  err.status = status
  return err
}

const autoAdvanceSending = async (orders = []) => {
  const now = Date.now()
  const changed = []
  for (const order of orders) {
    if (order.status === "sending") {
      const changedAt = new Date(order.status_changed_at || order.created_at || order.createdAt || now).getTime()
      if (now - changedAt > 5 * 60 * 1000) {
        order.status = "sent"
        order.status_changed_at = new Date()
        await order.save()
        changed.push(order)
      }
    }
  }
  return changed
}

const attachPrebuiltDetails = async (items = []) => {
  const enriched = []
  for (const raw of items) {
    const it = raw?.toJSON ? raw.toJSON() : { ...raw }
    const isPrebuilt = (it.category || it.type || "").toLowerCase() === "prebuilt"
    if (!isPrebuilt) {
      enriched.push(it)
      continue
    }
    try {
      const prebuilt = await Prebuilt.findByPk(it.product_id, {
        include: [
          {
            model: PrebuiltComponent,
            as: "components",
            include: [{ model: Product, as: "product" }],
          },
        ],
      })
      if (prebuilt) {
        let components = Array.isArray(prebuilt.components)
          ? prebuilt.components.map((c) => ({
              name: c.product?.name || "Component",
              category: c.product?.category || "Component",
              quantity: c.quantity || 1,
              price: c.product?.price || 0,
            }))
          : []
        // Fallback to package array in specs for prebuilts without component rows
        if ((!components || !components.length) && prebuilt.specs?.package && Array.isArray(prebuilt.specs.package)) {
          components = prebuilt.specs.package.map((row, idx) => ({
            name: row.name || row.item || `Component ${idx + 1}`,
            category: row.category || "Component",
            quantity: row.quantity || 1,
            price: row.price || 0,
          }))
        }
        it.components = components
        it.specs = prebuilt.specs || it.specs || null
      }
    } catch {
      /* ignore enrichment failures */
    }
    enriched.push(it)
  }
  return enriched
}

export const createOrder = async (req, res) => {
  const t = await db.transaction()
  try {
    const userid = req.user?.id
    if (!userid) throw createError("Unauthorized", 403)
    const {
      items = [],
      deliveryOption,
      services = {},
      subtotal = 0,
      discount = 0,
      deliveryFee = 0,
      servicesTotal = 0,
      total = 0,
      paymentMethod,
      paymentMasked,
      billingName,
      billingEmail,
      billingPhone,
      billingAddress,
    } = req.body

    if (!Array.isArray(items) || !items.length) throw createError("Items are required")

    const transactionId = `TX-${Date.now()}`
    const order = await Order.create(
      {
        transaction_id: transactionId,
        userid,
        status: "to-build",
        status_changed_at: new Date(),
        subtotal,
        discount,
        delivery_fee: deliveryFee,
        services_total: servicesTotal,
        total,
        delivery_option: deliveryOption,
        services: services || {},
        payment_method: paymentMethod,
        payment_masked: paymentMasked,
      },
      { transaction: t }
    )

    const detailSnapshot = []

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity || 1))
      const pid = item.product_id ?? item.productId ?? item.id ?? null
      await OrderItem.create(
        {
          order_id: order.id,
          product_id: pid,
          name: item.name || "Item",
          category: item.category || "",
          price: Number(item.price || 0),
          quantity: qty,
          image_url: item.image_url || item.imageUrl || "",
        },
        { transaction: t }
      )

      if (pid) {
        const product = await Product.findByPk(pid, { transaction: t })
        if (product) {
          product.stock = Math.max(0, Number(product.stock || 0) - qty)
          await product.save({ transaction: t })
        }
      }

      const isPrebuilt = (item.category || item.type || "").toLowerCase() === "prebuilt"
      let prebuiltComponents = []
      let prebuiltSpecs = null
      if (isPrebuilt) {
        const prebuilt = await Prebuilt.findByPk(item.id || pid, {
          transaction: t,
          include: [{ model: PrebuiltComponent, as: "components", include: [{ model: Product, as: "product" }] }],
        })
        if (prebuilt) {
          prebuilt.stock = Math.max(0, Number(prebuilt.stock || 0) - qty)
          await prebuilt.save({ transaction: t })
          prebuiltSpecs = prebuilt.specs || null
          if (Array.isArray(prebuilt.components)) {
            prebuiltComponents = prebuilt.components.map((comp) => ({
              name: comp?.product?.name || "Component",
              category: comp?.product?.category || "Component",
              quantity: Math.max(1, Number(comp.quantity || 1)),
              price: comp?.product?.price || 0,
            }))
          }
          if (!prebuiltComponents.length && prebuilt.specs?.package && Array.isArray(prebuilt.specs.package)) {
            prebuiltComponents = prebuilt.specs.package.map((row, idx) => ({
              name: row.name || row.item || `Component ${idx + 1}`,
              category: row.category || "Component",
              quantity: row.quantity || 1,
              price: row.price || 0,
            }))
          }
          if (Array.isArray(prebuilt.components)) {
            for (const comp of prebuilt.components) {
              const compQty = Math.max(1, Number(comp.quantity || 1)) * qty
              const compProduct = await Product.findByPk(comp.product_id, { transaction: t })
              if (compProduct) {
                compProduct.stock = Math.max(0, Number(compProduct.stock || 0) - compQty)
                await compProduct.save({ transaction: t })
              }
            }
          }
        }
      }

      detailSnapshot.push({
        key: String(pid ?? item.product_id ?? item.productId ?? item.id ?? item.name ?? Date.now()),
        name: item.name || "",
        category: item.category || item.type || "",
        type: item.type || "",
        specs: item.specs || prebuiltSpecs || null,
        parts: item.parts || null,
        components: item.components || item.parts || prebuiltComponents || null,
      })
    }

    const servicesMerged = {
      ...(services || {}),
      billingName,
      billingEmail,
      billingPhone,
      billingAddress,
      itemDetails: detailSnapshot,
    }
    order.services = servicesMerged
    await order.save({ transaction: t })

    await t.commit()
    const fresh = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: "items" }] })
    const plain = fresh.toJSON()
    plain.services = servicesMerged

    const inputMap = new Map()
    items.forEach((it) => {
      const key = String(it.product_id ?? it.productId ?? it.id ?? it.name ?? "")
      if (key) inputMap.set(key, it)
    })
    let enrichedItems = await attachPrebuiltDetails(plain.items || [])
    enrichedItems = enrichedItems.map((it, idx) => {
      const key = String(it.product_id ?? it.id ?? it.name ?? idx)
      const source = inputMap.get(key)
      if (source) {
        it.specs = it.specs || source.specs || null
        it.parts = it.parts || source.parts || null
        it.components = it.components || source.components || null
      }
      return it
    })
    plain.items = enrichedItems
    res.status(201).json(plain)
  } catch (e) {
    await t.rollback()
    res.status(e.status || 500).json({ message: e.message || "Failed to create order" })
  }
}

export const listMyOrders = async (req, res) => {
  try {
    const userid = req.user?.id
    if (!userid) return res.status(403).json({ message: "Unauthorized" })
    const orders = await Order.findAll({
      where: { userid },
      include: [{ model: OrderItem, as: "items" }],
      order: [["id", "DESC"]],
    })
    await autoAdvanceSending(orders)
    const enriched = []
    for (const order of orders) {
      const plain = order.toJSON()
      plain.items = await attachPrebuiltDetails(plain.items || [])
      const detailMap = new Map(
        (plain.services?.itemDetails || []).map((d, idx) => [String(d.key ?? idx), d])
      )
      plain.items = plain.items.map((it, idx) => {
        const key = String(it.product_id ?? it.id ?? it.name ?? idx)
        const detail = detailMap.get(key)
        if (detail) {
          it.specs = it.specs || detail.specs || null
          it.parts = it.parts || detail.parts || null
          it.components = it.components || detail.components || null
        }
        return it
      })
      enriched.push(plain)
    }
    res.json(enriched)
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch orders" })
  }
}

export const listAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{ model: OrderItem, as: "items" }],
      order: [["id", "DESC"]],
    })
    await autoAdvanceSending(orders)
    const enriched = []
    for (const order of orders) {
      const plain = order.toJSON()
      plain.items = await attachPrebuiltDetails(plain.items || [])
      const detailMap = new Map(
        (plain.services?.itemDetails || []).map((d, idx) => [String(d.key ?? idx), d])
      )
      plain.items = plain.items.map((it, idx) => {
        const key = String(it.product_id ?? it.id ?? it.name ?? idx)
        const detail = detailMap.get(key)
        if (detail) {
          it.specs = it.specs || detail.specs || null
          it.parts = it.parts || detail.parts || null
          it.components = it.components || detail.components || null
        }
        return it
      })
      enriched.push(plain)
    }
    res.json(enriched)
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch orders" })
  }
}

export const updateStatus = async (req, res) => {
  try {
    const { status, tracking_number, cancellation_reason } = req.body
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: "items" }] })
    if (!order) return res.status(404).json({ message: "Order not found" })

    const isAdmin = req.user?.role === "admin"
    const isOwner = req.user?.id && String(req.user.id) === String(order.userid)
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Forbidden" })
    }

    // Non-admin users: can cancel while to-build, and can refund once cancelled
    if (!isAdmin) {
      const target = status
      const current = order.status
      const canCancel = target === "cancelled" && current === "to-build"
      const canRefund = target === "refunded" && current === "cancelled"
      if (!canCancel && !canRefund) {
        return res.status(403).json({ message: "Only admin can change status beyond cancel/refund windows" })
      }
    }

    const prevStatus = order.status
    if (status) {
      order.status = status
      order.status_changed_at = new Date()
      if (status === "sending" && !tracking_number) {
        order.tracking_number = `TRK-${Date.now()}`
      }
      if (status === "refunded") {
        order.refunded_at = new Date()
      }
      if (status === "cancelled" && cancellation_reason) {
        order.cancellation_reason = cancellation_reason
      }
    }
    if (tracking_number) order.tracking_number = tracking_number

    // Restock if moving to cancelled/refunded from a non-cancelled state
    const prevCancelled = prevStatus === "cancelled" || prevStatus === "refunded"
    const nowCancelled = status === "cancelled" || status === "refunded"
    if (!prevCancelled && nowCancelled && Array.isArray(order.items)) {
      for (const it of order.items) {
        const qty = Number(it.quantity || 0)
        if (!qty) continue
        if (it.product_id) {
          const p = await Product.findByPk(it.product_id)
          if (p) {
            p.stock = Number(p.stock || 0) + qty
            await p.save()
          }
        } else if ((it.category || "").toLowerCase() === "prebuilt") {
          const pb = await Prebuilt.findByPk(it.id || it.product_id)
          if (pb) {
            pb.stock = Number(pb.stock || 0) + qty
            await pb.save()
          }
        }
      }
    }

    await order.save()
    res.json(order)
  } catch (e) {
    res.status(500).json({ message: "Failed to update order" })
  }
}
