// src/pages/admin/AdminOrders.jsx
import React, { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"

const formatRM = (value) => `RM ${(Number(value ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"
const titleCase = (value) => {
  if (!value) return ""
  const str = String(value).trim().toLowerCase()
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}
const normalizeCategory = (value) => {
  if (!value) return ""
  const upper = String(value).toUpperCase()
  const acronyms = ["CPU", "GPU", "PSU", "RAM", "SSD", "HDD", "AIO", "NVME", "NVME SSD"]
  if (acronyms.includes(upper)) return upper
  return titleCase(value)
}

const statusLabel = (s) => {
  if (s === "to-build") return "To Be Build"
  if (s === "building") return "Building"
  if (s === "sending") return "Sending"
  if (s === "sent") return "Sent"
  if (s === "cancelled") return "Cancelled"
  if (s === "refunded") return "Refunded"
  return s
}

const buildReceipt = (tx) => {
  const servicesData = (() => {
    if (typeof tx.services === "string") {
      try {
        return JSON.parse(tx.services)
      } catch {
        return {}
      }
    }
    return tx.services || {}
  })()
  const doc = new jsPDF()
  const brand = "WCompLabs"
  const brandOwner = "by ngliota"
  const brandAddress = "A-13-12 Casa Subang (Main WCompLabs office)"
  const created = tx.createdAt || tx.created_at || tx.date || Date.now()
  const dateStr = new Date(created).toLocaleString()
  const invoiceId = tx.transaction_id || `INV-${tx.id}`
  const eta = (tx.delivery_option || tx.deliveryOption || "").toLowerCase() === "express" ? "Estimated Delivery: 1-2 Business Days" : "Estimated Delivery: 3-5 Business Days"

  const billingName = tx.billingName || tx.billing_name || servicesData.billingName || servicesData.billing_name || "Customer"
  const billingEmail = tx.billingEmail || tx.billing_email || servicesData.billingEmail || servicesData.billing_email || ""
  const billingPhone = tx.billingPhone || tx.billing_phone || servicesData.billingPhone || servicesData.billing_phone || ""
  const billingAddress = tx.billingAddress || tx.billing_address || servicesData.billingAddress || servicesData.billing_address || ""

  // Header background
  doc.setFillColor(248, 249, 253)
  doc.rect(0, 0, 210, 40, "F")
  // Brand mark
  doc.setFillColor(99, 102, 241)
  doc.rect(10, 12, 6, 14, "F")
  doc.setFillColor(16, 185, 129)
  doc.rect(17, 12, 6, 14, "F")

  doc.setTextColor(20, 24, 35)
  doc.setFontSize(18)
  doc.text(brand, 28, 20)
  doc.setFontSize(10)
  doc.text(brandOwner, 28, 26)
  doc.text(brandAddress, 28, 32, { maxWidth: 80 })
  doc.text(`Date: ${dateStr}`, 150, 16)
  doc.text(`Invoice: ${invoiceId}`, 150, 22)
  doc.setTextColor(0, 0, 0)

  doc.setFontSize(11)
  doc.text("Billing", 10, 40)
  doc.setFontSize(10)
  let by = 46
  doc.text(billingName || "Customer", 10, by); by += 6
  if (billingAddress) {
    const addrLines = doc.splitTextToSize(billingAddress, 80)
    doc.text(addrLines, 10, by)
    by += addrLines.length * 6
  }
  if (billingPhone) { doc.text(`Phone: ${billingPhone}`, 10, by); by += 6 }
  if (billingEmail) { doc.text(`Email: ${billingEmail}`, 10, by); by += 6 }

  doc.setFontSize(11)
  doc.text("Payment", 120, 34)
  doc.setFontSize(10)
  doc.text(`Method: ${tx.payment_masked || tx.paymentMasked || "N/A"}`, 120, 40)
  doc.text(`Delivery: ${(tx.delivery_option || tx.deliveryOption || "").toUpperCase() || "STANDARD"}`, 120, 46)
  doc.text(eta, 120, 52, { maxWidth: 80 })

  let y = Math.max(by + 8, 78)
  const newPageIfNeeded = (needed = 0) => {
    if (y + needed < 285) return
    doc.addPage()
    y = 20
    doc.setFontSize(10)
    doc.setDrawColor(200, 200, 200)
  }

  doc.setFontSize(10)
  doc.setDrawColor(200, 200, 200)
  doc.line(10, y, 200, y)
  y += 6
  doc.text("#", 12, y)
  doc.text("Product", 20, y)
  doc.text("Price", 130, y, { align: "right" })
  doc.text("Qty", 150, y, { align: "right" })
  doc.text("Line", 190, y, { align: "right" })
  y += 4
  doc.line(10, y, 200, y)
  y += 8

  const formatServices = (services) => {
    const ignoreKeys = new Set([
      "itemDetails",
      "billingName",
      "billingEmail",
      "billingPhone",
      "billingAddress",
      "billing_name",
      "billing_email",
      "billing_phone",
      "billing_address",
    ])
    if (!services) return "None"
    let data = services
    if (typeof data === "string") {
      try {
        data = JSON.parse(data)
      } catch {
        return data
      }
    }
    if (Array.isArray(data)) {
      const names = data.filter((v) => typeof v === "string" && v.trim())
      return names.length ? names.join(", ") : "None"
    }
    if (typeof data === "object") {
      const names = Object.entries(data)
        .filter(([k]) => !ignoreKeys.has(k))
        .filter(([, v]) => {
          if (typeof v === "boolean") return v
          if (typeof v === "number") return v > 0
          if (typeof v === "string") return v.trim().toLowerCase() === "true"
          return false
        })
        .map(([k]) => k)
      return names.length ? names.join(", ") : "None"
    }
    return String(data)
  }

  const items = tx.items || []
  const itemDetailsList = servicesData?.itemDetails || []
  const itemDetailsMap = new Map(itemDetailsList.map((d, idx) => [String(d.key ?? idx), d]))
  const buildDetailLines = (specsInput, componentsInput) => {
    if (Array.isArray(componentsInput) && componentsInput.length) {
      return componentsInput
        .map((c) => {
          const cat = normalizeCategory(c.category || c.type || c.key || "")
          const name = (c.name || c.value || c.product || c.item || c.title || "").trim()
          const qty = c.quantity || c.qty
          if (!name) return null
          const qtyText = qty ? ` (x${qty})` : ""
          return cat ? `${cat}: ${name}${qtyText}` : `${name}${qtyText}`
        })
        .filter(Boolean)
    }
    if (specsInput?.package && Array.isArray(specsInput.package)) {
      return specsInput.package
        .map((s) => {
          const cat = normalizeCategory(s.category || s.type || s.key || "")
          const name = (s.name || s.value || s.product || s.item || s.title || "").trim()
          const qty = s.quantity || s.qty
          if (!name) return null
          const qtyText = qty ? ` (x${qty})` : ""
          return cat ? `${cat}: ${name}${qtyText}` : `${name}${qtyText}`
        })
        .filter(Boolean)
    }
    if (Array.isArray(specsInput) && specsInput.length) {
      return specsInput
        .map((s) => {
          const cat = normalizeCategory(s.category || s.type || s.key || "")
          const name = (s.name || s.value || s.product || s.item || s.title || "").trim()
          const qty = s.quantity || s.qty
          if (!name) return null
          const qtyText = qty ? ` (x${qty})` : ""
          return cat ? `${cat}: ${name}${qtyText}` : `${name}${qtyText}`
        })
        .filter(Boolean)
    }
    return []
  }
  const detailRows = (it) => {
    const key = String(it.product_id ?? it.id ?? it.name ?? "")
    const fromSnapshot =
      itemDetailsMap.get(key) ||
      itemDetailsList.find((d) => d.name && it.name && d.name === it.name) ||
      itemDetailsList.find((d) => d.category && it.category && d.category === it.category) ||
      itemDetailsList[0]
    return buildDetailLines(
      it.specs || it.parts || fromSnapshot?.specs || fromSnapshot?.parts || null,
      it.components || fromSnapshot?.components || null
    )
  }
  items.forEach((it, idx) => {
    const lineTotal = Number(it.price || 0) * Number(it.quantity || 1)
    const itemCategory = normalizeCategory(it.category || it.type || "")
    const itemNameRaw = it.name ? titleCase(it.name) : "Item"
    const itemName = [itemCategory, itemNameRaw].filter(Boolean).join(" - ") || "Item"
    const nameLines = doc.splitTextToSize(itemName, 90)
    nameLines.forEach((line, lineIdx) => {
      newPageIfNeeded(12)
      doc.text(lineIdx === 0 ? String(idx + 1) : "", 12, y)
      doc.text(line, 20, y, { maxWidth: 90 })
      if (lineIdx === 0) {
        doc.text(formatRM(it.price), 130, y, { align: "right" })
        doc.text(String(it.quantity || 1), 150, y, { align: "right" })
        doc.text(formatRM(lineTotal), 190, y, { align: "right" })
      }
      y += 6
    })
    const extras = detailRows(it)
    extras.forEach((d) => {
      newPageIfNeeded(10)
      const dLines = doc.splitTextToSize(d, 160)
      dLines.forEach((dl) => {
        newPageIfNeeded(8)
        doc.text(`- ${dl}`, 26, y)
        y += 5
      })
    })
    newPageIfNeeded(10)
    const unitText = `Unit: ${formatRM(it.price || 0)}   Qty: ${it.quantity || 1}   Line: ${formatRM(lineTotal)}`
    newPageIfNeeded(6)
    doc.text(unitText, 26, y)
    y += 6
  })

  y += 4
  doc.setFontSize(10)
  doc.text("Services:", 20, y)
  const svcText = formatServices(servicesData)
  doc.text(svcText, 50, y, { maxWidth: 140 })
  y += 6
  doc.text("Delivery:", 20, y)
  doc.text((tx.delivery_option || tx.deliveryOption || "").toUpperCase(), 50, y)
  y += 6

  doc.setFontSize(11)
  doc.text("Subtotal:", 150, y, { align: "right" })
  doc.text(formatRM(tx.subtotal), 190, y, { align: "right" })
  y += 6
  if (tx.discount && tx.discount > 0) {
    doc.text("Coupon:", 150, y, { align: "right" })
    doc.text(`- ${formatRM(tx.discount)}`, 190, y, { align: "right" })
    y += 6
  }
  doc.text("Delivery:", 150, y, { align: "right" })
  doc.text(formatRM(tx.delivery_fee || tx.deliveryFee || 0), 190, y, { align: "right" })
  y += 6
  doc.text("Services:", 150, y, { align: "right" })
  doc.text(formatRM(tx.services_total || tx.servicesTotal || 0), 190, y, { align: "right" })
  y += 8
  doc.setFontSize(13)
  doc.setTextColor(79, 70, 229)
  doc.text("Total Paid:", 150, y, { align: "right" })
  doc.text(formatRM(tx.total), 190, y, { align: "right" })
  doc.setTextColor(0, 0, 0)

  doc.setFontSize(9)
  doc.text("WCompLabs - All rights reserved", 105, 285, { align: "center" })
  doc.save(`receipt-${tx.transaction_id || tx.id}.pdf`)
}


export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("To be build")
  const [searchTerm, setSearchTerm] = useState("")

  const navigate = useNavigate()
  const token = localStorage.getItem("adminToken")

  const tabs = ["To be build", "Building", "Sending & Sent", "Cancelled & Refunded"]

  const loadOrders = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed to load orders")
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/admin")
      return
    }
    loadOrders()
    const timer = setInterval(loadOrders, 15000)
    return () => clearInterval(timer)
  }, [token])

  const updateStatus = async (id, status, reason) => {
    try {
      const payload = reason ? { status, cancellation_reason: reason } : { status }
      const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed to update")
      loadOrders() // Reload orders to reflect the change
    } catch (e) {
      setError(e.message)
    }
  }

  const summary = useMemo(() => {
    return orders.reduce(
      (acc, o) => {
        if (["sending", "sent"].includes(o.status)) {
          acc.total += Number(o.total || 0)
        }
        if (o.status === "to-build") acc.toBuild += 1
        if (o.status === "building") acc.building += 1
        if (o.status === "sending") acc.sending += 1
        if (o.status === "sent") acc.sent += 1
        if (o.status === "cancelled") acc.cancelled += 1
        if (o.status === "refunded") acc.refunded += 1
        return acc
      },
      { total: 0, toBuild: 0, building: 0, sending: 0, sent: 0, cancelled: 0, refunded: 0 }
    )
  }, [orders])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch = term ? (order.transaction_id || "").toLowerCase().includes(term) || (order.id || "").toString().toLowerCase().includes(term) : true

      if (!matchesSearch) return false

      switch (activeTab) {
        case "To be build": return order.status === "to-build"
        case "Building": return order.status === "building"
        case "Sending & Sent": return ["sending", "sent"].includes(order.status)
        case "Cancelled & Refunded": return ["cancelled", "refunded"].includes(order.status)
        default: return true
      }
    })
  }, [orders, activeTab, searchTerm])

  const formatServices = (services) => {
    const ignoreKeys = new Set([
      "itemDetails",
      "billingName",
      "billingEmail",
      "billingPhone",
      "billingAddress",
      "billing_name",
      "billing_email",
      "billing_phone",
      "billing_address",
    ])
    if (!services) return "None"
    let data = services
    if (typeof data === "string") {
      try {
        data = JSON.parse(data)
      } catch {
        return data
      }
    }
    if (Array.isArray(data)) {
      const names = data.filter((v) => typeof v === "string" && v.trim())
      return names.length ? names.join(", ") : "None"
    }
    if (typeof data === "object") {
      const names = Object.entries(data)
        .filter(([k]) => !ignoreKeys.has(k))
        .filter(([, v]) => {
          if (typeof v === "boolean") return v
          if (typeof v === "number") return v > 0
          if (typeof v === "string") return v.trim().toLowerCase() === "true"
          return false
        })
        .map(([k]) => k)
      return names.length ? names.join(", ") : "None"
    }
    return String(data)
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-300 uppercase">Revenue</div>
          <div className="text-lg font-semibold text-emerald-200">{formatRM(summary.total)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-300 uppercase">To Build</div>
          <div className="text-lg font-semibold">{summary.toBuild}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-300 uppercase">Building</div>
          <div className="text-lg font-semibold">{summary.building}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-300 uppercase">Sending</div>
          <div className="text-lg font-semibold">{summary.sending}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-300 uppercase">Sent</div>
          <div className="text-lg font-semibold">{summary.sent}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-300 uppercase">Cancelled</div>
          <div className="text-lg font-semibold text-rose-200">{summary.cancelled}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-300 uppercase">Refunded</div>
          <div className="text-lg font-semibold text-amber-200">{summary.refunded}</div>
        </div>
      </div>

      {error && <div className="mb-3 rounded border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>}

      {/* Tabs and Search */}
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center border border-white/10 rounded-lg bg-white/5 px-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
          <input
            type="text"
            placeholder="Search by Transaction ID..."
            className="w-full bg-transparent p-2 text-white placeholder-slate-400 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-center space-x-1 rounded-lg bg-white/5 p-1 border border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:bg-white/10"
              } rounded-md px-3 py-1.5 text-sm font-medium transition-colors`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center p-8">Loading orders...</div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-white/10 bg-[#0b1224] p-4 shadow shadow-black/30">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-400">TX: {o.transaction_id || o.id}</div>
                  <div className="text-lg font-semibold text-white">{formatRM(o.total)}</div>
                  <div className="text-xs text-slate-400">Status: <span className="font-bold">{statusLabel(o.status)}</span></div>
                  {o.tracking_number && <div className="text-xs text-emerald-300">Tracking: {o.tracking_number}</div>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {o.status === 'to-build' && (
                    <button onClick={() => updateStatus(o.id, "building")} className="rounded bg-cyan-600 px-3 py-1 text-sm hover:bg-cyan-500">Start Building</button>
                  )}
                  {o.status === 'building' && (
                     <button onClick={() => updateStatus(o.id, "sending")} className="rounded bg-blue-600 px-3 py-1 text-sm hover:bg-blue-500">Send</button>
                  )}
                  {o.status === 'sending' && (
                    <button onClick={() => updateStatus(o.id, "sent")} className="rounded bg-emerald-600 px-3 py-1 text-sm hover:bg-emerald-500">Mark Sent</button>
                  )}
                  {o.status === 'to-build' && (
                    <button
                      onClick={() => {
                        const reason = prompt("Reason for cancellation?")
                        if (reason) updateStatus(o.id, "cancelled", reason)
                      }}
                      className="rounded bg-rose-600 px-3 py-1 text-sm hover:bg-rose-500"
                    >
                      Cancel
                    </button>
                  )}
                  {o.status === "cancelled" && !o.refunded_at && (
                    <button onClick={() => updateStatus(o.id, "refunded")} className="rounded bg-amber-500 px-3 py-1 text-sm hover:bg-amber-400">Process Refund</button>
                  )}
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-200">
                <div className="font-semibold">User ID: {o.userid}</div>
                <div>Delivery: {o.delivery_option}</div>
                <div>Services: {formatServices(o.services)}</div>
                <div className="mt-2 text-slate-300">Items:</div>
                <ul className="list-inside text-slate-300/80">
                  {(o.items || []).map((it) => (
                    <li key={`${it.id}-${it.name}`} className="flex justify-between">
                      <span>{it.name} x{it.quantity}</span>
                      <span>{formatRM(Number(it.price || 0) * Number(it.quantity || 1))}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={() => buildReceipt(o)} className="rounded bg-gray-600 px-3 py-1 text-sm hover:bg-gray-500">Download Receipt</button>
                </div>
                 {o.cancellation_reason && <div className="mt-2 text-rose-300 text-xs">Cancellation reason: {o.cancellation_reason}</div>}
              </div>
            </div>
          ))}
          {!filteredOrders.length && <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-slate-200">No orders found for this tab.</div>}
        </div>
      )}
    </div>
  )
}
