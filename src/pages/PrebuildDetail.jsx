// src/pages/PrebuildDetail.jsx
import React, { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"
const formatRM = (value) => `RM ${(Number(value ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function PrebuildDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [error, setError] = useState("")
  const userToken = localStorage.getItem("userToken") || localStorage.getItem("token")

useEffect(() => {
  // Ensure the detail view starts at the top
  window.scrollTo({ top: 0, behavior: "smooth" })
  let cancelled = false
  const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/prebuilts/${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || 'Failed to load prebuilt')
        if (!cancelled) setItem(data)
      } catch (e) {
        if (!cancelled) {
          setItem(null)
          setError(e.message || "Unable to load prebuilt details.")
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const pkg = useMemo(() => {
    const raw = item?.specs?.package
    if (!Array.isArray(raw)) return []
    return raw.map((row, idx) => ({
      key: `${row.name || row.category || "item"}-${idx}`,
      name: row.name || row.item || "Component",
      category: row.category || "Uncategorized",
      quantity: row.quantity || 1,
    }))
  }, [item])

  const componentList = useMemo(() => {
    if (Array.isArray(item?.components) && item.components.length) {
      return item.components.map((c, idx) => ({
        key: `${c.product_id || "comp"}-${idx}`,
        name: c.product?.name || "Component",
        category: c.product?.category || "Uncategorized",
        quantity: c.quantity || 1,
        price: c.product?.price || 0,
      }))
    }
    return pkg.map((row) => ({ ...row, price: 0 }))
  }, [item?.components, pkg])

  const groupedComponents = useMemo(() => {
    const map = new Map()
    componentList.forEach((row) => {
      const cat = (row.category || "Uncategorized").toString()
      const existing = map.get(cat) || { totalQty: 0, items: [] }
      existing.totalQty += Number(row.quantity || 0)
      existing.items.push(row)
      map.set(cat, existing)
    })
    return Array.from(map.entries())
  }, [componentList])

  const componentsTotal = useMemo(() => {
    return componentList.reduce((sum, row) => {
      const unit = Number(row.price || 0)
      const qty = Number(row.quantity || 1)
      return sum + unit * qty
    }, 0)
  }, [componentList])

  const savings = componentsTotal - Number(item?.price || 0)

  const [localSold, setLocalSold] = useState(0)

  useEffect(() => {
    try {
      const map = JSON.parse(localStorage.getItem("prebuiltSoldMap") || "{}")
      if (map && item?.id) {
        setLocalSold(Number(map[item.id] || 0))
      }
    } catch {
      setLocalSold(0)
    }
  }, [item?.id])

  const soldCount = (item?.specs?.sold ?? item?.sold ?? 0) + localSold
  const rating = item?.specs?.rating ?? item?.rating ?? 4.8
  const renderStars = (value) => {
    const stars = Math.round(Number(value || 0))
    return "★★★★★".slice(0, stars).padEnd(5, "☆")
  }

  const decodeToken = () => {
    try {
      const token = localStorage.getItem("userToken") || localStorage.getItem("token")
      const payload = token?.split?.(".")?.[1]
      if (!payload) return {}
      const decoded = JSON.parse(atob(payload))
      return { id: decoded?.id, username: decoded?.username }
    } catch {
      return {}
    }
  }

  const cartKey = () => {
    try {
      const { id } = decodeToken()
      const rawProfile = id ? (localStorage.getItem(`userProfile_${id}`) || "{}") : (localStorage.getItem("userProfile") || "{}")
      const parsed = JSON.parse(rawProfile)
      const uid = parsed?.userid || parsed?.id || id
      return uid ? `cartItems_${uid}` : "cartItems_guest"
    } catch {
      return "cartItems_guest"
    }
  }

  const updateCart = (payload) => {
    try {
      const raw = localStorage.getItem(cartKey())
      const list = raw ? JSON.parse(raw) : []
      if (Array.isArray(list)) {
        const existing = list.find((i) => i.id === payload.id)
        if (existing) {
          existing.quantity = Math.max(1, Number(existing.quantity || 1) + 1)
          localStorage.setItem(cartKey(), JSON.stringify(list))
        } else {
          payload.quantity = Math.max(1, Number(payload.quantity || 1))
          list.push(payload)
          localStorage.setItem(cartKey(), JSON.stringify(list))
        }
      } else {
        payload.quantity = Math.max(1, Number(payload.quantity || 1))
        localStorage.setItem(cartKey(), JSON.stringify([payload]))
      }
      window.dispatchEvent(new Event("cart-update"))
    } catch {
      payload.quantity = Math.max(1, Number(payload.quantity || 1))
      localStorage.setItem(cartKey(), JSON.stringify([payload]))
      window.dispatchEvent(new Event("cart-update"))
    }
  }

  const requireLogin = () => {
    const token = localStorage.getItem("userToken") || localStorage.getItem("token")
    if (!token) {
      alert("Please log in first to continue.")
      navigate("/login")
      return null
    }
    return token
  }

  const checkoutItemKey = () => {
    try {
      const { id } = decodeToken()
      const rawProfile = id ? (localStorage.getItem(`userProfile_${id}`) || "{}") : (localStorage.getItem("userProfile") || "{}")
      const parsed = JSON.parse(rawProfile)
      const uid = parsed?.userid || parsed?.id || id
      return uid ? `checkoutItem_${uid}` : "checkoutItem_guest"
    } catch {
      return "checkoutItem_guest"
    }
  }

  const addToCheckout = (redirect = false) => {
    if (!item) return
    if (!requireLogin()) return
    const payload = {
      id: item.id,
      product_id: item.id,
      type: "prebuilt",
      name: item.name,
      price: item.price,
      image_url: item.image_url || "",
      specs: item.specs || null,
      stock: item.stock ?? 0,
      category: "prebuilt",
      quantity: 1,
    }
    localStorage.setItem(checkoutItemKey(), JSON.stringify(payload))
    updateCart(payload)
    if (redirect) {
      navigate("/checkout")
    } else {
      // no popup; silent add
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded">{error}</div>}
      {!item && !error && (
        <div className="text-gray-300">Loading...</div>
      )}
      {item && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            <div className="rounded-2xl bg-black/50 ring-1 ring-white/10 p-5 flex items-center justify-center min-h-[420px]">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="max-h-[520px] w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="text-gray-500">No image</div>
              )}
            </div>
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Prebuilt</p>
                <h1 className="text-3xl font-bold text-white mt-2">{item.name}</h1>
                <p className="text-lg text-cyan-100 mt-1">{formatRM(item.price)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-200">
                  <span className="rounded-full bg-white/10 px-3 py-1">Components total: {formatRM(componentsTotal)}</span>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-100">
                    {savings > 0 ? `You save ${formatRM(savings)}` : `Savings: ${formatRM(0)}`}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-200">
                <span className="rounded-full bg-white/10 px-3 py-1">Stock: {item.stock ?? "-"}</span>
                <span className="rounded-full bg-white/10 px-3 py-1">Sold: {soldCount}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 flex items-center gap-2">
                  <span>{renderStars(rating)}</span>
                  <span className="text-xs text-slate-400">({rating}/5)</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => addToCheckout(false)}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-900/30 hover:brightness-110 transition"
                >
                  Add to Cart
                </button>
              <button
                onClick={() => addToCheckout(true)}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-900/30 hover:brightness-110 transition"
              >
                Buy Now
              </button>
              </div>
              {groupedComponents.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-white mb-2">Included components</p>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {groupedComponents.map(([category, info]) => (
                      <div key={category} className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-slate-200">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-semibold text-white">{category}</span>
                          <span className="text-xs text-slate-400">Total qty: {info.totalQty}</span>
                        </div>
                        <div className="space-y-2">
                          {info.items.map((row) => (
                            <div key={row.key} className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex items-center gap-2">
                                <span className="truncate text-slate-100">{row.name}</span>
                                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-200">x{row.quantity}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                {row.price !== undefined && <span>{formatRM(row.price)}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="mt-6">
        <Link to="/home" className="text-blue-400 hover:underline">Back to Home</Link>
      </div>
    </div>
  )
}
