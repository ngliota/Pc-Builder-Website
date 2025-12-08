// backend/controllers/dashboardController.js
import { Op } from "sequelize"
import Order from "../models/orderModel.js"

const enrichTelemetry = (payload) => {
  const dailySales = payload.dailySales ?? []
  const revenue = payload.revenue ?? dailySales.reduce((sum, point) => sum + (point.total || 0), 0)
  const orders = payload.orders ?? dailySales.reduce((sum, point) => sum + (point.orders || 0), 0)
  const grossIncome = payload.grossIncome ?? Math.round(revenue * 0.64) // Assuming 64% margin
  const avgOrderValue = payload.avgOrderValue ?? (orders ? revenue / orders : 0)

  return {
    ...payload,
    dailySales,
    monthlySales: payload.monthlySales ?? [],
    revenue,
    orders,
    grossIncome,
    avgOrderValue,
    yoy: payload.yoy ?? 0,
    mom: payload.mom ?? 0,
  }
}

export const getTelemetry = async (req, res) => {
  try {
    const allOrders = await Order.findAll({
      attributes: ["status", "total", "created_at"],
      order: [["created_at", "ASC"]],
    })

    const validOrders = allOrders.filter(o => ["sending", "sent"].includes(o.status))

    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total), 0)
    const totalOrders = validOrders.length

    // Group by day for the last 30 days
    const dailySales = new Map()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateString = date.toISOString().split("T")[0]
        dailySales.set(dateString, {
            label: date.toLocaleDateString("en-US", { weekday: 'short' }),
            date: dateString,
            total: 0,
            orders: 0
        })
    }

    validOrders.forEach(order => {
        const orderDate = new Date(order.created_at)
        orderDate.setHours(0,0,0,0)
        const dateString = orderDate.toISOString().split("T")[0]
        if(dailySales.has(dateString)){
            const dayData = dailySales.get(dateString)
            dayData.total += Number(order.total)
            dayData.orders += 1
        }
    })

    // Group by month for the last 12 months
    const monthlySales = new Map()
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    for (let i = 0; i < 12; i++) {
        const date = new Date(thisMonth)
        date.setMonth(date.getMonth() - i)
        const monthString = date.toISOString().slice(0, 7) // YYYY-MM
         monthlySales.set(monthString, {
            label: date.toLocaleDateString("en-US", { month: 'short' }),
            date: `${monthString}-01`,
            total: 0,
            orders: 0
        })
    }

     validOrders.forEach(order => {
        const orderDate = new Date(order.created_at)
        const monthString = orderDate.toISOString().slice(0, 7)
        if(monthlySales.has(monthString)){
            const monthData = monthlySales.get(monthString)
            monthData.total += Number(order.total)
            monthData.orders += 1
        }
    })


    const finalDailySales = Array.from(dailySales.values()).reverse()
    const finalMonthlySales = Array.from(monthlySales.values()).reverse()

    // YoY and MoM are complex and require more data than is available.
    // Returning placeholder values.
    const telemetry = enrichTelemetry({
      dailySales: finalDailySales,
      monthlySales: finalMonthlySales,
      revenue: totalRevenue,
      orders: totalOrders,
      yoy: 1.1, // Placeholder
      mom: 2.2, // Placeholder
    })

    res.json(telemetry)

  } catch (error) {
    console.error("Error generating telemetry:", error)
    res.status(500).json({ message: "Failed to generate telemetry", error: error.message })
  }
}
