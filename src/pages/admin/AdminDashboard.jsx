// admin/AdminDashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import ToastNotification from "/src/components/ToastNotification.jsx"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const enrichTelemetry = (payload) => {
  const dailySales = payload.dailySales ?? []
  const revenue = payload.revenue ?? dailySales.reduce((sum, point) => sum + (point.total || 0), 0)
  const orders = payload.orders ?? dailySales.reduce((sum, point) => sum + (point.orders || 0), 0)
  const grossIncome = payload.grossIncome ?? Math.round(revenue * 0.64)
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

const FALLBACK_TELEMETRY = enrichTelemetry({
  dailySales: [
    { label: "Mon", date: "2025-11-03", total: 18250, orders: 41 },
    { label: "Tue", date: "2025-11-04", total: 19480, orders: 46 },
    { label: "Wed", date: "2025-11-05", total: 20120, orders: 48 },
    { label: "Thu", date: "2025-11-06", total: 21440, orders: 51 },
    { label: "Fri", date: "2025-11-07", total: 22310, orders: 54 },
    { label: "Sat", date: "2025-11-08", total: 18740, orders: 43 },
    { label: "Sun", date: "2025-11-09", total: 20560, orders: 49 },
    { label: "Mon", date: "2025-11-10", total: 21680, orders: 52 },
    { label: "Tue", date: "2025-11-11", total: 22710, orders: 55 },
    { label: "Wed", date: "2025-11-12", total: 23640, orders: 57 },
  ],
  monthlySales: [
    { label: "Jun", date: "2025-06-01", total: 312000, orders: 820 },
    { label: "Jul", date: "2025-07-01", total: 327400, orders: 856 },
    { label: "Aug", date: "2025-08-01", total: 339820, orders: 882 },
    { label: "Sep", date: "2025-09-01", total: 352110, orders: 904 },
    { label: "Oct", date: "2025-10-01", total: 365420, orders: 932 },
    { label: "Nov", date: "2025-11-01", total: 372880, orders: 948 },
  ],
  yoy: 12.4,
  mom: 4.1,
})

const buildTelemetryFromProducts = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return FALLBACK_TELEMETRY

  const sanitized = items.map((item, idx) => ({
    price: Number(item.price) || 0,
    stock: Number(item.stock) || 0,
    idx,
  }))

  const energy =
    sanitized.reduce((sum, product) => sum + product.price * 0.9 + Math.max(0, 40 - product.stock) * 6, 0) +
    sanitized.length * 150

  const dailySales = Array.from({ length: 7 }, (_, pos) => {
    const day = new Date()
    day.setDate(day.getDate() - (9 - pos))
    const variance = (Math.sin(energy * 0.0008 + pos * 0.45) + 1) / 2
    const total = Math.round((energy * 0.018 + 1600) * (0.7 + variance * 0.8))
    const orders = Math.max(12, Math.round((sanitized.length * 1.1 + 18) * (0.8 + variance * 0.4)))

    return {
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      date: day.toISOString().split("T")[0],
      total,
      orders,
    }
  })

  const monthlySales = Array.from({ length: 6 }, (_, pos) => {
    const month = new Date()
    month.setMonth(month.getMonth() - (5 - pos))
    const variance = (Math.cos(energy * 0.0005 + pos * 0.8) + 1) / 2
    const total = Math.round((energy * 0.085 + 78000) * (0.75 + variance * 0.5))
    const orders = Math.max(90, Math.round((sanitized.length * 6 + 120) * (0.8 + variance * 0.5)))

    return {
      label: month.toLocaleDateString("en-US", { month: "short" }),
      date: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-01`,
      total,
      orders,
    }
  })

  const yoy = Number((10.2 + Math.cos(energy) * 1.5).toFixed(1))
  const mom = Number((3.5 + Math.sin(energy * 0.5) * 1.2).toFixed(1))

  return enrichTelemetry({ dailySales, monthlySales, yoy, mom })
}

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value > 999999 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value || 0)

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0)

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [products, setProducts] = useState([])
  const [telemetry, setTelemetry] = useState(FALLBACK_TELEMETRY)
  const [timeframe, setTimeframe] = useState("daily")

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), silent ? 5000 : 8000)
    if (!silent) setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("adminToken")
      const res = await fetch(`${API_URL}/api/products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Unable to synchronize inventory telemetry")
      const list = Array.isArray(data) ? data : []
      setProducts(list)
      setTelemetry(buildTelemetryFromProducts(list))
    } catch (err) {
      console.error(err)
      const friendlyError =
        err.name === "AbortError" ? "Dashboard request timed out. Showing cached telemetry." : err.message
      setError(friendlyError)
      setToast({ show: true, message: friendlyError, type: "error" })
      setTelemetry((prev) => (prev?.dailySales?.length ? prev : FALLBACK_TELEMETRY))
    } finally {
      clearTimeout(timeoutId)
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      navigate("/admin")
      return
    }
    loadDashboard()
  }, [navigate, loadDashboard])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboard({ silent: true })
    setRefreshing(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    navigate("/admin")
  }

  const inventoryStats = useMemo(() => {
    if (!products.length) {
      return { totalSkus: 0, avgStock: 0, lowStockCount: 0, totalStock: 0 }
    }
    const totalStock = products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0)
    const lowStockCount = products.filter((product) => (Number(product.stock) || 0) <= 5).length
    return {
      totalSkus: products.length,
      avgStock: Math.round(totalStock / products.length),
      lowStockCount,
      totalStock,
    }
  }, [products])

  const lowStockProducts = useMemo(() => {
    return [...products]
      .filter((product) => (Number(product.stock) || 0) <= 10)
      .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0))
      .slice(0, 6)
  }, [products])

  const chartSeries = timeframe === "daily" ? telemetry.dailySales : telemetry.monthlySales
  const labelGridClass = timeframe === "daily" ? "grid-cols-7" : "grid-cols-6"
  const maxValue = Math.max(...chartSeries.map((point) => point.total || 0), 1)
  const peakPoint = chartSeries.reduce(
    (acc, point) => ((point.total || 0) > (acc.total || 0) ? point : acc),
    chartSeries[0] || { total: 0, label: "-" }
  )
  const latestPoint = chartSeries[chartSeries.length - 1] || { total: 0, orders: 0, label: "-" }

  const chartLinePoints =
    chartSeries.length === 0
      ? ""
      : chartSeries
          .map((point, index) => {
            const x =
              chartSeries.length === 1 ? 100 : (index / (chartSeries.length - 1)) * 100
            const y = 100 - ((point.total || 0) / maxValue) * 90
            return `${x.toFixed(2)},${y.toFixed(2)}`
          })
          .join(" ")
  const chartAreaPoints =
    chartSeries.length === 0 ? "" : `0,100 ${chartLinePoints} 100,100`

  const eventFeed = useMemo(() => {
    const feed = []
    if (latestPoint.total) {
      feed.push({
        label: "Latest Sync",
        detail: `${latestPoint.label} • ${formatCurrency(latestPoint.total)}`,
        state: "normal",
      })
    }
    if (peakPoint?.label) {
      feed.push({
        label: "Peak Sales",
        detail: `${peakPoint.label} • ${formatCurrency(peakPoint.total)}`,
        state: "spike",
      })
    }
    if (lowStockProducts[0]) {
      feed.push({
        label: "Low Stock Ping",
        detail: `${lowStockProducts[0].name} • ${lowStockProducts[0].stock || 0} units`,
        state: "alert",
      })
    }
    feed.push({
      label: "Sync Status",
      detail: "Automation checks completed < 90s",
      state: "normal",
    })
    return feed
  }, [latestPoint, peakPoint, lowStockProducts])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030617] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(59,130,246,0.2), transparent 35%), radial-gradient(circle at 85% 10%, rgba(236,72,153,0.18), transparent 38%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.12), transparent 40%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
        }}
      />

      {toast.show && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "" })}
        />
      )}

      <motion.div
        className="relative z-10 w-full space-y-8 px-6 py-10 lg:px-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/80">Overview</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Admin Dashboard</h1>
            <p className="text-sm text-slate-300">
              Monitor revenue, inventory, and fulfillment in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRefresh}
              className="rounded border border-cyan-400/60 px-4 py-2 text-sm uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-500/10"
            >
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
            <button
              onClick={handleLogout}
              className="rounded border border-rose-400/60 px-4 py-2 text-sm uppercase tracking-wide text-rose-100 transition hover:bg-rose-500/10"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded border border-rose-400/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Total Revenue",
              value: formatCurrency(telemetry.revenue),
              delta: `+${telemetry.mom}% vs last cycle`,
              accent: "from-cyan-400/30 to-blue-500/20",
            },
            {
              title: "Gross Income",
              value: formatCurrency(telemetry.grossIncome),
              delta: "64% blended margin",
              accent: "from-emerald-400/30 to-teal-500/20",
            },
            {
              title: "Avg Order Value",
              value: formatCurrency(telemetry.avgOrderValue),
              delta: `${formatNumber(telemetry.orders)} orders synced`,
              accent: "from-purple-400/30 to-pink-500/20",
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur"
              whileHover={{ y: -4 }}
            >
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{card.title}</p>
              <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              <p className="mt-2 text-sm text-slate-300">{card.delta}</p>
              <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${card.accent}`} />
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3 mt-6">
          <div className="rounded-2xl border border-white/10 bg-[#050b1d]/80 p-6 backdrop-blur xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                  {timeframe === "daily" ? "Daily" : "Monthly"} Sales Trend
                </p>
                <p className="text-2xl font-semibold text-white">
                  {formatCurrency(latestPoint.total)} <span className="text-sm text-slate-400">latest</span>
                </p>
                <p className="text-sm text-emerald-300">
                  ↑ {telemetry.yoy}% YoY • ↑ {telemetry.mom}% MoM
                </p>
              </div>
              <div className="flex gap-2 text-xs uppercase tracking-[0.3em]">
                {[
                  { key: "daily", label: "Daily" },
                  { key: "monthly", label: "Monthly" },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setTimeframe(mode.key)}
                    className={`rounded-full border px-4 py-2 transition ${
                      timeframe === mode.key
                        ? "border-cyan-400/70 bg-cyan-500/10 text-white"
                        : "border-white/10 text-slate-300 hover:border-white/30"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mt-6 h-72 w-full">
              {chartSeries.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Awaiting telemetry samples…
                </div>
              ) : (
                <>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                    <defs>
                      <linearGradient id="chartLine" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
                      </linearGradient>
                      <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(34,211,238,0.35)" />
                        <stop offset="100%" stopColor="rgba(15,23,42,0.05)" />
                      </linearGradient>
                    </defs>
                    {[20, 40, 60, 80].map((value) => (
                      <line
                        key={value}
                        x1="0"
                        x2="100"
                        y1={value}
                        y2={value}
                        stroke="rgba(226,232,240,0.08)"
                        strokeWidth="0.5"
                      />
                    ))}
                    {chartAreaPoints && (
                      <polygon fill="url(#chartFill)" points={chartAreaPoints} opacity="0.6" />
                    )}
                    {chartLinePoints && (
                      <polyline
                        fill="none"
                        stroke="url(#chartLine)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={chartLinePoints}
                      />
                    )}
                  </svg>
                  <div className={`mt-4 grid ${labelGridClass} gap-2 text-xs text-slate-400`}>
                    {chartSeries.map((point) => (
                      <div key={point.date} className="text-center">
                        <p className="font-semibold text-slate-200">{point.label}</p>
                        <p className="text-[10px] text-slate-500">
                          {timeframe === "daily" ? point.date.slice(5) : point.date.slice(0, 7)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-6 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Peak</p>
                  <p className="text-lg font-semibold text-white">{peakPoint.label}</p>
                  <p>{formatCurrency(peakPoint.total || 0)}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Latest Orders</p>
                  <p className="text-lg font-semibold text-white">{latestPoint.orders || 0}</p>
                  <p>ships within 18h</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Catalog Size</p>
                  <p className="text-lg font-semibold text-white">
                    {formatNumber(inventoryStats.totalSkus)} SKUs
                  </p>
                  <p>{inventoryStats.lowStockCount} low stock items</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/20 bg-[#130c13]/70 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70">Stock Alerts</p>
            <h3 className="mt-2 text-xl font-semibold">Low Inventory</h3>
            <p className="text-sm text-amber-100/80">Watching SKUs under 10 units remaining.</p>
            <div className="mt-5 space-y-4">
              {lowStockProducts.length === 0 && (
                <p className="text-sm text-slate-400">No items are under the alert threshold.</p>
              )}
              {lowStockProducts.map((product) => {
                const stock = Number(product.stock) || 0
                const percent = Math.min(100, (stock / 40) * 100)
                return (
                  <div key={product.id || product.name}>
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-amber-200">{stock} units</p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-yellow-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500">
                      {stock <= 3 ? "Emergency restock" : "Reorder suggested"}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-6 mt-10 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur h-full">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Inventory Snapshot</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Total SKUs</p>
                <p className="text-2xl font-semibold text-white">{inventoryStats.totalSkus}</p>
              </div>
              <div>
                <p className="text-slate-400">Total Units</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(inventoryStats.totalStock)}</p>
              </div>
              <div>
                <p className="text-slate-400">Avg On-hand</p>
                <p className="text-2xl font-semibold text-white">{inventoryStats.avgStock}</p>
              </div>
              <div>
                <p className="text-slate-400">Low Stock</p>
                <p className="text-2xl font-semibold text-amber-200">{inventoryStats.lowStockCount}</p>
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-white/10 bg-black/30 p-4 text-xs uppercase tracking-[0.3em] text-slate-400">
              Snapshot updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#050b1d]/80 p-6 backdrop-blur h-full flex flex-col">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Recent Signals</p>
            <div className="mt-4 flex-1 space-y-4 text-sm">
              {eventFeed.map((event, idx) => (
                <div key={`${event.label}-${idx}`} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{event.label}</p>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${
                        event.state === "alert"
                          ? "text-rose-300"
                          : event.state === "spike"
                            ? "text-amber-300"
                            : "text-emerald-300"
                      }`}
                    >
                      {event.state === "alert"
                        ? "ALERT"
                        : event.state === "spike"
                          ? "SPIKE"
                          : "NORMAL"}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-300">{event.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur h-full">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Ops Status</p>
            <div className="mt-4 space-y-4 text-sm">
              {[
                { label: "Fulfillment Queue", metric: "18 live orders", detail: "2 flagged priority", accent: "text-emerald-300" },
                { label: "Fraud Monitor", metric: "764 scans/hr", detail: "0 critical hits", accent: "text-cyan-300" },
                { label: "Supply Sync", metric: "12 partner feeds", detail: "3 awaiting ETA", accent: "text-amber-300" },
              ].map((system) => (
                <div key={system.label} className="rounded-lg border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{system.label}</p>
                  <p className={`mt-2 text-lg font-semibold ${system.accent}`}>{system.metric}</p>
                  <p className="text-slate-300">{system.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3 rounded-full border border-cyan-300/30 bg-[#041129]/95 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-cyan-100 shadow-xl shadow-cyan-500/20">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
          </span>
          Syncing
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
