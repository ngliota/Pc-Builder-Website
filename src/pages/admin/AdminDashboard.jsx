// admin/AdminDashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import ToastNotification from "/src/components/ToastNotification.jsx"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    currencyDisplay: "code",
    notation: value > 999999 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  })
    .format(value || 0)
    .replace("MYR", "RM")

const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0)

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [toast, setToast] = useState({ show: false, message: "", type: "" })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [products, setProducts] = useState([])
  const [orderStats, setOrderStats] = useState({ toBuild: 0, sent: 0, refunded: 0 })
  const [telemetry, setTelemetry] = useState({
    dailySales: [],
    monthlySales: [],
    revenue: 0,
    orders: 0,
    grossIncome: 0,
    avgOrderValue: 0,
    yoy: 0,
    mom: 0,
  })
  const [timeframe, setTimeframe] = useState("daily")

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("adminToken")
      if (!token) {
        navigate("/admin")
        return
      }
      
      const headers = { Authorization: `Bearer ${token}` }

      const [telemetryRes, productsRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/telemetry`, { headers }),
        fetch(`${API_URL}/api/products`, { headers }),
        fetch(`${API_URL}/api/orders`, { headers }),
      ])

      if (telemetryRes.ok) {
        const telemetryData = await telemetryRes.json()
        setTelemetry(telemetryData)
      } else {
        const errText = await telemetryRes.text()
        console.error("Failed to load dashboard telemetry:", errText)
        throw new Error("Failed to load dashboard telemetry")
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(Array.isArray(productsData) ? productsData : [])
      } else {
        const errText = await productsRes.text()
        console.error("Failed to load products:", errText)
        throw new Error("Failed to load products for inventory stats")
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        if (Array.isArray(ordersData)) {
          const stats = ordersData.reduce(
            (acc, order) => {
              const status = (order.status || "").toLowerCase()
              if (status === "to-build") acc.toBuild += 1
              if (status === "sent") acc.sent += 1
              if (status === "refunded") acc.refunded += 1
              return acc
            },
            { toBuild: 0, sent: 0, refunded: 0 }
          )
          setOrderStats(stats)
        }
      } else {
        const errText = await ordersRes.text()
        console.warn("Failed to load orders for status snapshot:", errText)
      }

    } catch (err) {
      console.error(err)
      const friendlyError = err.message || "An unknown error occurred."
      setError(friendlyError)
      setToast({ show: true, message: friendlyError, type: "error" })
    } finally {
      if (!silent) setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

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
    const lowStockCount = products.filter((product) => (Number(product.stock) || 0) <= 10).length
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

  const chartSeries = useMemo(() => {
    const raw = (timeframe === "daily" ? telemetry.dailySales : telemetry.monthlySales) || []
    const limit = timeframe === "daily" ? 7 : 6
    return raw.slice(Math.max(0, raw.length - limit))
  }, [telemetry, timeframe])
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
        detail: `${latestPoint.label} -> ${formatCurrency(latestPoint.total)}`,
        state: "normal",
      })
    }
    if (peakPoint?.label) {
      feed.push({
        label: "Peak Sales",
        detail: `${peakPoint.label} -> ${formatCurrency(peakPoint.total)}`,
        state: "spike",
      })
    }
    if (lowStockProducts[0]) {
      feed.push({
        label: "Low Stock Ping",
        detail: `${lowStockProducts[0].name} -> ${lowStockProducts[0].stock || 0} units`,
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
                  +{telemetry.yoy}% YoY / +{telemetry.mom}% MoM
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
                  Awaiting telemetry samples
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

        <div className="grid gap-6 mt-14 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur h-full xl:row-span-2">
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

          <div className="rounded-2xl border border-white/10 bg-[#050b1d]/80 p-6 backdrop-blur h-full flex flex-col xl:row-span-2">
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
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Operation Status</p>
            <div className="mt-4 space-y-4 text-sm">
              {[
                {
                  label: "To Build",
                  metric: `${formatNumber(orderStats.toBuild)} orders`,
                  detail: "Queued for assembly",
                  accent: "text-amber-300",
                },
                {
                  label: "Sent",
                  metric: `${formatNumber(orderStats.sent)} orders`,
                  detail: "On the way to customers",
                  accent: "text-emerald-300",
                },
                {
                  label: "Refunded",
                  metric: `${formatNumber(orderStats.refunded)} orders`,
                  detail: "Processed refunds",
                  accent: "text-rose-300",
                },
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

