// src/pages/admin/AdminOrders.jsx
import React, { useEffect, useState } from "react"
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

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({ total: 0, toBuild: 0, sending: 0, sent: 0, cancelled: 0, refunded: 0 })
  const navigate = useNavigate()

  const token = localStorage.getItem("adminToken")

  const formatServices = (services) => {
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
        .filter(([k, v]) => k !== "itemDetails" && typeof v !== "object" && v)
        .map(([k]) => k)
      return names.length ? names.join(", ") : "None"
    }
    return String(data)
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
    const eta = (tx.delivery_option || tx.deliveryOption || "").toLowerCase() === "express" ? "Estimated Delivery: 1-2 business days" : "Estimated Delivery: 3-5 business days"

    doc.setFillColor(79, 70, 229)
    doc.rect(10, 12, 4, 12, "F")
    doc.setFontSize(18)
    doc.text(brand, 18, 20)
    doc.setFontSize(10)
    doc.text(brandOwner, 18, 26)
    doc.text(brandAddress, 18, 32, { maxWidth: 80 })
    doc.text(`Date: ${dateStr}`, 150, 16)
    doc.text(`Invoice: ${invoiceId}`, 150, 22)

    doc.setFontSize(11)
    doc.text("Billing", 10, 40)
    doc.setFontSize(10)
    let by = 46
    doc.text(tx?.billingName || "Customer", 10, by); by += 6
    if (tx?.billingAddress) {
      const addrLines = doc.splitTextToSize(tx.billingAddress, 80)
      doc.text(addrLines, 10, by)
      by += addrLines.length * 6
    }
    if (tx?.billingPhone) { doc.text(`Phone: ${tx.billingPhone}`, 10, by); by += 6 }
    if (tx?.billingEmail) { doc.text(`Email: ${tx.billingEmail}`, 10, by); by += 6 }

    doc.setFontSize(11)
    doc.text("Payment", 120, 34)
    doc.setFontSize(10)
    doc.text(`Method: ${tx.payment_masked || tx.paymentMasked || "N/A"}`, 120, 40)
    doc.text(`Delivery: ${(tx.delivery_option || tx.deliveryOption || "").toUpperCase() || "STANDARD"}`, 120, 46)
    doc.text(eta, 120, 52, { maxWidth: 80 })

    let y = Math.max(by + 8, 78)
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

    const items = tx.items || []
    const itemDetailsList = servicesData?.itemDetails || []
    const itemDetailsMap = new Map(itemDetailsList.map((d, idx) => [String(d.key ?? idx), d]))
    const detailRows = (it) => {
      const key = String(it.product_id ?? it.id ?? it.name ?? "")
      const fromSnapshot =
        itemDetailsMap.get(key) ||
        itemDetailsList.find((d) => d.name && it.name && d.name === it.name) ||
        itemDetailsList.find((d) => d.category && it.category && d.category === it.category) ||
        itemDetailsList[0]
      const specs =
        it.specs ||
        it.parts ||
        it.components ||
        fromSnapshot?.specs ||
        fromSnapshot?.parts ||
        fromSnapshot?.components ||
        []
      if (!Array.isArray(specs) || !specs.length) return []
      return specs
        .map((s) => {
          const rawCat = s.category || s.type || s.key || ""
          const name = (s.name || s.value || s.product || s.item || s.title || "").trim()
          const qty = s.quantity || s.qty
          if (!name) return null
          const cat = rawCat ? normalizeCategory(rawCat) : ""
          const qtyText = qty ? ` (x${qty})` : ""
          return cat ? `${cat}: ${name}${qtyText}` : `${name}${qtyText}`
        })
        .filter(Boolean)
    }
    items.forEach((it, idx) => {
      const lineTotal = Number(it.price || 0) * Number(it.quantity || 1)
      const itemCategory = normalizeCategory(it.category || it.type || "")
      const itemNameRaw = it.name ? titleCase(it.name) : "Item"
      const itemName = [itemCategory, itemNameRaw].filter(Boolean).join(" - ") || "Item"
      const nameLines = doc.splitTextToSize(itemName, 90)
      nameLines.forEach((line, lineIdx) => {
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
        const dLines = doc.splitTextToSize(d, 160)
        dLines.forEach((dl) => {
          doc.text(`- ${dl}`, 26, y)
          y += 5
        })
      })
      const unitText = `Unit: ${formatRM(it.price || 0)}   Qty: ${it.quantity || 1}   Line: ${formatRM(lineTotal)}`
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

  const loadOrders = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed to load orders")
      const list = Array.isArray(data) ? data : []
      setOrders(list)
      const totals = list.reduce(
        (acc, o) => {
          acc.total += Number(o.total || 0)
          acc[o.status] = (acc[o.status] || 0) + 1
          return acc
        },
        { total: 0, "to-build": 0, sending: 0, sent: 0, cancelled: 0, refunded: 0 }
      )
      setSummary({
        total: totals.total,
        toBuild: totals["to-build"] || 0,
        sending: totals.sending || 0,
        sent: totals.sent || 0,
        cancelled: totals.cancelled || 0,
        refunded: totals.refunded || 0,
      })
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
      loadOrders()
    } catch (e) {
      setError(e.message)
    }
  }

  const statusLabel = (s) => {
    if (s === "to-build") return "To Be Build"
    if (s === "sending") return "Sending"
    if (s === "sent") return "Sent"
    return s
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <div className="mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-300 uppercase">Revenue</div>
          <div className="text-lg font-semibold text-emerald-200">{formatRM(summary.total)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-300 uppercase">To Build</div>
          <div className="text-lg font-semibold">{summary.toBuild}</div>
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
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-white/10 bg-[#0b1224] p-4 shadow shadow-black/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400">TX: {o.transaction_id || o.id}</div>
                  <div className="text-lg font-semibold text-white">{formatRM(o.total)}</div>
                  <div className="text-xs text-slate-400">Status: {statusLabel(o.status)}</div>
                  {o.tracking_number && <div className="text-xs text-emerald-300">Tracking: {o.tracking_number}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(o.id, "to-build")} className="rounded bg-slate-600 px-3 py-1 text-sm hover:bg-slate-500">To Build</button>
                  <button onClick={() => updateStatus(o.id, "sending")} className="rounded bg-cyan-600 px-3 py-1 text-sm hover:bg-cyan-500">Send</button>
                  <button onClick={() => updateStatus(o.id, "sent")} className="rounded bg-emerald-600 px-3 py-1 text-sm hover:bg-emerald-500">Mark Sent</button>
                  <button
                    onClick={() => {
                      const reason = prompt("Reason for cancellation?")
                      if (reason) updateStatus(o.id, "cancelled", reason)
                    }}
                    className="rounded bg-rose-600 px-3 py-1 text-sm hover:bg-rose-500"
                  >
                    Cancel
                  </button>
                  {o.status === "cancelled" && (
                    <button onClick={() => updateStatus(o.id, "refunded")} className="rounded bg-amber-500 px-3 py-1 text-sm hover:bg-amber-400">Refund</button>
                  )}
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-200">
                <div>Delivery: {o.delivery_option}</div>
                <div>Services: {formatServices(o.services)}</div>
                <div className="mt-2 text-slate-300">Items:</div>
                <ul className="list-disc list-inside text-slate-300">
                  {(o.items || []).map((it) => (
                    <li key={`${it.id}-${it.name}`} className="flex justify-between">
                      <span>{it.name} x{it.quantity}</span>
                      <span>{formatRM(Number(it.price || 0) * Number(it.quantity || 1))}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => buildReceipt(o)}
                    className="rounded bg-emerald-600 px-3 py-1 text-sm hover:bg-emerald-500"
                  >
                    Download Receipt
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!orders.length && <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-slate-200">No orders.</div>}
        </div>
      )}
    </div>
  )
}
