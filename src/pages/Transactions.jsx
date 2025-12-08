// src/pages/Transactions.jsx
import React, { useEffect, useState } from "react"
import jsPDF from "jspdf"

const formatRM = (value) => `RM ${(Number(value ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const titleCase = (value) => {
  if (!value) return ""
  const str = String(value).trim().toLowerCase()
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}
const useCaseLabel = (value = "") => {
  const map = { gaming: "Gaming", content: "Content", mixed: "Mixed", office: "Office" }
  const key = String(value || "").toLowerCase()
  return map[key] || value
}
const displayItemName = (value = "") => {
  let out = String(value || "")
  const match = out.match(/^Custom Build -\s*([a-z]+)\b/i)
  if (match) {
    out = out.replace(match[1], useCaseLabel(match[1]))
  }
  return out
}
const normalizeCategory = (value) => {
  if (!value) return ""
  const upper = String(value).toUpperCase()
  const acronyms = ["CPU", "GPU", "PSU", "RAM", "SSD", "HDD", "AIO", "NVME", "NVME SSD"]
  if (acronyms.includes(upper)) return upper
  return titleCase(value)
}

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
  if (services && typeof services === "object" && !Array.isArray(services) && services.itemDetails) {
    // strip internal itemDetails snapshot
    const { itemDetails: _itemDetails, ...rest } = services
    services = rest
  }
  if (!services) return "None"
  // If services is a JSON string, try parsing first
  if (typeof services === "string") {
    try {
      const parsed = JSON.parse(services)
      return formatServices(parsed)
    } catch {
      // fall through and show raw string
      return services
    }
  }
  const labelMap = {
    overclock: "Custom Overclocking",
    windows: "Windows Installation",
  }
  if (Array.isArray(services)) {
    const names = services
      .filter(Boolean)
      .map((s) => (typeof s === "string" ? s : s?.name || s?.title || String(s)))
      .map((s) => labelMap[s] || s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()))
    return names.length ? names.join(", ") : "None"
  }
  if (typeof services === "object") {
    const entries = Object.entries(services)
      .filter(([k]) => !ignoreKeys.has(k))
      .filter(([, v]) => {
        if (typeof v === "boolean") return v
        if (typeof v === "number") return v > 0
        if (typeof v === "string") return v.trim().toLowerCase() === "true"
        return false
      })
      .map(([k]) => labelMap[k] || k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()))
    return entries.length ? entries.join(", ") : "None"
  }
  return "None"
}

const renderStatus = (statusRaw) => {
  const status = (statusRaw || "").toLowerCase()
  const label = status.replace(/-/g, " ").toUpperCase() || "UNKNOWN"
  const colorMap = {
    "to-build": "from-cyan-400 via-sky-300 to-emerald-300",
    building: "from-amber-400 via-orange-400 to-rose-400",
    sending: "from-indigo-400 via-blue-400 to-cyan-300",
    sent: "from-emerald-400 via-green-400 to-lime-300",
    cancelled: "from-rose-500 via-amber-400 to-yellow-300",
    refunded: "from-purple-400 via-fuchsia-400 to-pink-300",
  }
  const gradient = colorMap[status] || "from-cyan-400 via-sky-300 to-indigo-300"
  return (
    <span className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${gradient} px-3 py-1 text-lg font-extrabold text-black shadow-lg shadow-black/40`}>
      <span className="h-2 w-2 rounded-full bg-black/30" />
      {label}
    </span>
  )
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
  // Brand mark (simple block logo inspired by navbar colors)
  doc.setFillColor(99, 102, 241) // indigo block
  doc.rect(10, 12, 6, 14, "F")
  doc.setFillColor(16, 185, 129) // teal block
  doc.rect(17, 12, 6, 14, "F")

  doc.setTextColor(20, 24, 35)
  doc.setFontSize(18)
  doc.text(brand, 28, 20)
  doc.setFontSize(10)
  doc.text(brandOwner, 28, 26)
  doc.text(brandAddress, 28, 32, { maxWidth: 80 })
  doc.setFontSize(10)
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
  doc.text(`Method: ${tx.payment_masked || tx.paymentMasked}`, 120, 40)
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

  const items = tx.items || []
  const itemDetailsList = servicesData?.itemDetails || []
  const itemDetailsMap = new Map(itemDetailsList.map((d, idx) => [String(d.key ?? idx), d]))
  const buildDetailLines = (specsInput, componentsInput) => {
    // Prefer explicit components array
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
    // Handle specs.package array (often used for prebuilts)
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
    // Handle specs as array
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

export default function Transactions() {
  const [list, setList] = useState([])
  const [error, setError] = useState("")
  const [refundLoading, setRefundLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [refundStep, setRefundStep] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem("userToken") || localStorage.getItem("token")
    const fetchOrders = async () => {
      try {
        if (!token) throw new Error("Not logged in")
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/orders/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || data?.error || "Failed to load transactions")
        setList(Array.isArray(data) ? data : [])
      } catch (e) {
        setError(e.message || "Unable to load transactions")
      }
    }
    fetchOrders()
  }, [])

  const refund = async (id) => {
    setRefundLoading(true)
    setRefundStep(0)
    setError("")
    try {
      const token = localStorage.getItem("userToken") || localStorage.getItem("token")
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "refunded" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error || "Refund failed")
      // Simulate refund steps
      const steps = ["Checking user payment details", "Wiring the money back", "Finishing up"]
      let stepIdx = 0
      const tick = () => {
        setRefundStep(stepIdx)
        if (stepIdx < steps.length - 1) {
          stepIdx += 1
          setTimeout(tick, 700)
        }
      }
      tick()

      // Reload after short delay to show animation
      await new Promise((resolve) => setTimeout(resolve, 2200))
      const res2 = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/orders/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const list = await res2.json()
      setList(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setRefundLoading(false)
      setRefundStep(0)
    }
  }

  const cancelOrder = async (id) => {
    setCancelLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("userToken") || localStorage.getItem("token")
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "cancelled", cancellation_reason: "User cancelled from Transactions page" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error || "Cancel failed")
      // reload list
      const res2 = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/orders/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const list = await res2.json()
      setList(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e.message || "Unable to cancel order")
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-4">Transactions</h1>
      {error && <div className="mb-4 rounded border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">{error}</div>}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200">No transactions yet.</div>
      ) : (
        <div className="space-y-3">
          {list.map((tx) => (
            <div key={tx.id} className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow shadow-black/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-300">{new Date(tx.created_at || tx.createdAt).toLocaleString()}</div>
                  <div className="text-lg font-semibold text-white">{formatRM(tx.total)}</div>
                  <div className="text-xs text-slate-400">{tx.payment_masked || tx.paymentMasked}</div>
                  <div className="mt-1">{renderStatus(tx.status)}</div>
                  {tx.tracking_number && <div className="text-xs text-emerald-300">Tracking: {tx.tracking_number}</div>}
                </div>
                <button
                  onClick={() => buildReceipt(tx)}
                  className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500"
                >
                  Download Receipt
                </button>
              </div>
              <div className="mt-3 text-sm text-slate-200">
                <div>Delivery: {(tx.delivery_option || tx.deliveryOption || "standard").toUpperCase()}</div>
                <div>Services: {formatServices(tx.services)}</div>
                <div className="mt-2 text-slate-300">Items:</div>
                <ul className="list-disc list-inside text-slate-300">
                  {(tx.items || []).map((it) => (
                    <li key={`${it.id}-${it.name}`} className="flex justify-between">
                      <span>{displayItemName(it.name)} x{it.quantity}</span>
                      <span>{formatRM(Number(it.price || 0) * Number(it.quantity || 1))}</span>
                    </li>
                  ))}
                </ul>
                {tx.cancellation_reason && <div className="mt-2 text-rose-300 text-xs">Cancellation reason: {tx.cancellation_reason}</div>}
                {tx.status === "to-build" && (
                  <div className="mt-2">
                    <button
                      disabled={cancelLoading}
                      onClick={() => cancelOrder(tx.id)}
                      className="rounded bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-500 disabled:opacity-60"
                    >
                      {cancelLoading ? "Cancelling..." : "Cancel Order"}
                    </button>
                    <p className="mt-1 text-xs text-amber-200">You can only cancel before the build starts.</p>
                  </div>
                )}
                {tx.status === "cancelled" && !tx.refunded_at && (
                  <div className="mt-2">
                    <button
                      disabled={refundLoading}
                      onClick={() => refund(tx.id)}
                      className="rounded bg-amber-500 px-3 py-1 text-sm text-white hover:bg-amber-400 disabled:opacity-60"
                    >
                      {refundLoading ? "Processing refund..." : "Refund Now"}
                    </button>
                    {refundLoading && (
                      <div className="mt-2 space-y-1 text-xs text-cyan-100">
                        <div className="font-semibold">Refund in progress</div>
                        {["Checking user payment details", "Wiring the money back", "Finishing up"].map((label, idx) => {
                          const done = refundStep > idx
                          const active = refundStep === idx
                          return (
                            <div key={label} className="flex items-center gap-2">
                              <span
                                className={`h-3 w-3 rounded-full border ${
                                  done ? "border-emerald-400 bg-emerald-500/70" : active ? "border-cyan-300 bg-cyan-300/40" : "border-white/30"
                                }`}
                              />
                              <span className={done ? "text-emerald-200" : active ? "text-cyan-100" : "text-slate-300"}>{label}</span>
                            </div>
                          )
                        })}
                        <div className="text-emerald-200">The money has been wired back to you, ETA ~3 minutes.</div>
                      </div>
                    )}
                  </div>
                )}
                {tx.refunded_at && <div className="mt-2 text-emerald-300 text-xs">Refunded at {new Date(tx.refunded_at).toLocaleString()}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



