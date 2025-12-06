import React, { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"
const formatRM = (value) =>
  `RM ${(Number(value ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const SERVICE_PRICES = { overclock: 50, windows: 30 }

export default function Checkout() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [services, setServices] = useState({ overclock: false, windows: true })
  const [deliveryOption, setDeliveryOption] = useState("standard")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [couponInput, setCouponInput] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [placing, setPlacing] = useState(false)
  const [profile, setProfile] = useState({ username: "", email: "", phone: "", address: "" })
  const [profileSaved, setProfileSaved] = useState("")
  const [cardDetails, setCardDetails] = useState({ name: "", number: "", expiry: "", cvv: "" })
  const [cardError, setCardError] = useState("")
  const [cardStage, setCardStage] = useState("")
  const [cardProcessing, setCardProcessing] = useState(false)
  const [cardSuccess, setCardSuccess] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
    const token = localStorage.getItem("userToken") || localStorage.getItem("token")
    if (!token) {
      setError("Please log in to continue to checkout.")
      const timer = setTimeout(() => navigate("/login"), 500)
      return () => clearTimeout(timer)
    }
    syncProfile()
    syncItems()
    const onCartChange = () => syncItems()
    const onStorage = (e) => {
      if (e.key && e.key.startsWith("cartItems")) syncItems()
      if (e.key && e.key.startsWith("userProfile")) syncProfile()
    }
    window.addEventListener("cart-update", onCartChange)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("cart-update", onCartChange)
      window.removeEventListener("storage", onStorage)
    }
  }, [navigate])

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

  const resolveUserId = () => {
    try {
      const { id } = decodeToken()
      const rawProfile = id
        ? localStorage.getItem(`userProfile_${id}`) || "{}"
        : localStorage.getItem("userProfile") || "{}"
      const parsed = JSON.parse(rawProfile)
      return parsed?.userid || parsed?.id || id || null
    } catch {
      return null
    }
  }

  const cartKey = () => {
    const uid = resolveUserId()
    return uid ? `cartItems_${uid}` : "cartItems_guest"
  }

  const checkoutItemKey = () => {
    const uid = resolveUserId()
    return uid ? `checkoutItem_${uid}` : "checkoutItem_guest"
  }

  const profileKey = () => {
    const uid = resolveUserId()
    return uid ? `userProfile_${uid}` : "userProfile_guest"
  }

  const readCart = () => {
    try {
      const raw = localStorage.getItem(cartKey())
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const readCheckoutItem = () => {
    try {
      const raw = localStorage.getItem(checkoutItemKey())
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const syncItems = () => {
    const cartItems = readCart()
    const checkoutItem = readCheckoutItem()
    let next = Array.isArray(cartItems) ? [...cartItems] : []
    if (checkoutItem) {
      const exists = next.find((it) => it.id === checkoutItem.id)
      if (!exists) {
        next.unshift({ ...checkoutItem, quantity: Math.max(1, Number(checkoutItem.quantity || 1)) })
      }
    }
    next = next
      .filter(Boolean)
      .map((item) => ({ ...item, quantity: Math.max(1, Number(item.quantity || 1)) }))
    setItems(next)
    setSelectedIds((prev) => {
      const ids = next.map((i) => i.id)
      const keep = prev.filter((id) => ids.includes(id))
      if (keep.length) return keep
      return ids
    })
  }

  const persistCart = (list) => {
    const safe = list
      .filter(Boolean)
      .map((item) => ({ ...item, quantity: Math.max(1, Number(item.quantity || 1)) }))
    if (safe.length) {
      localStorage.setItem(cartKey(), JSON.stringify(safe))
      localStorage.setItem(checkoutItemKey(), JSON.stringify(safe[0]))
    } else {
      localStorage.removeItem(cartKey())
      localStorage.removeItem(checkoutItemKey())
    }
    window.dispatchEvent(new Event("cart-update"))
  }

  const syncProfile = () => {
    try {
      const { username } = decodeToken()
      const raw = localStorage.getItem(profileKey()) || localStorage.getItem("userProfile") || "{}"
      const parsed = JSON.parse(raw)
      setProfile({
        username: parsed.username || username || "User",
        email: parsed.email || "",
        phone: parsed.phone || "",
        address: parsed.address || "",
      })
    } catch {
      const { username } = decodeToken()
      setProfile({ username: username || "User", email: "", phone: "", address: "" })
    }
  }

  const saveProfile = () => {
    const payload = { ...profile, userid: resolveUserId() || "" }
    localStorage.setItem(profileKey(), JSON.stringify(payload))
    localStorage.setItem("userProfile", JSON.stringify(payload))
    window.dispatchEvent(new Event("profile-update"))
    setProfileSaved("Contact info saved for this checkout.")
    setTimeout(() => setProfileSaved(""), 2000)
  }

  const deliveryFee = deliveryOption === "express" ? 40 : 0
  const servicesTotal = useMemo(() => {
    let total = 0
    if (services.overclock) total += SERVICE_PRICES.overclock
    if (services.windows) total += SERVICE_PRICES.windows
    return total
  }, [services])

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds]
  )

  const subtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const unit = Number(item.price || 0)
      const qty = Math.max(1, Number(item.quantity || 1))
      return sum + unit * qty
    }, 0)
  }, [selectedItems])

  const discountAmount = useMemo(() => {
    const code = appliedCoupon.trim().toUpperCase()
    if (!code) return 0
    if (code === "NGLIOTA") {
      const raw = subtotal * 0.2
      return Math.min(raw, 222)
    }
    return 0
  }, [appliedCoupon, subtotal])

  const appliedServicesTotal = selectedItems.length ? servicesTotal : 0
  const appliedDeliveryFee = selectedItems.length ? deliveryFee : 0

  const total = useMemo(() => {
    if (!selectedItems.length) return 0
    const raw = subtotal + appliedServicesTotal + appliedDeliveryFee - discountAmount
    return raw < 0 ? 0 : raw
  }, [subtotal, appliedServicesTotal, appliedDeliveryFee, discountAmount, selectedItems.length])

  const updateQuantity = (id, delta) => {
    setItems((prev) => {
      const next = prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Number(item.quantity || 1) + delta) }
          : item
      )
      persistCart(next)
      return next
    })
  }

  const toggleSelection = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const removeItem = (id) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id)
      persistCart(next)
      return next
    })
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }

  const applyCoupon = () => {
    setError("")
    const code = couponInput.trim().toUpperCase()
    if (!code) {
      setAppliedCoupon("")
      setStatus("Coupon cleared.")
      return
    }
    const allowed = ["NGLIOTA"]
    if (!allowed.includes(code)) {
      setAppliedCoupon("")
      setStatus("")
      setError("Coupon not recognized. Try NGLIOTA for 20% off (max RM 222).")
      return
    }
    setAppliedCoupon(code)
    setStatus(`Coupon ${code} applied: 20% off up to RM 222.`)
  }

  const validateCard = () => {
    if (!cardDetails.name.trim()) return "Cardholder name is required."
    const digits = cardDetails.number.replace(/\D/g, "")
    if (digits.length < 12 || digits.length > 19) return "Enter a valid card number."
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiry.trim())) return "Use expiry format MM/YY."
    if (!/^\d{3,4}$/.test(cardDetails.cvv.trim())) return "CVV must be 3-4 digits."
    return ""
  }

  const handleCardPay = async () => {
    if (!selectedItems.length) {
      setError("Select at least one item to pay.")
      return
    }
    const validation = validateCard()
    if (validation) {
      setCardError(validation)
      return
    }
    setCardError("")
    setCardSuccess(false)
    setCardProcessing(true)
    const steps = [
      "Checking card credentials...",
      "Authorizing the card provider...",
      "Wiring the payment...",
    ]
    for (const step of steps) {
      setCardStage(step)
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 700))
    }
    const ok = await placeOrder({ skipNavigate: true })
    setCardProcessing(false)
    if (ok) {
      setCardStage("Payment successful.")
      setCardSuccess(true)
    } else {
      setCardStage("")
    }
  }

  const paymentMask = (method) => {
    if (method === "card") return "VISA **** 4242"
    if (method === "cod") return "Pay on delivery"
    return "FPX Online Banking"
  }

  const incrementLocalSold = (list) => {
    try {
      const map = JSON.parse(localStorage.getItem("prebuiltSoldMap") || "{}")
      list.forEach((it) => {
        const isPrebuilt = (it.category || it.type || "").toLowerCase() === "prebuilt"
        if (!isPrebuilt) return
        const pid = it.id || it.product_id || it.productId
        const qty = Math.max(1, Number(it.quantity || 1))
        if (pid) map[pid] = Number(map[pid] || 0) + qty
      })
      localStorage.setItem("prebuiltSoldMap", JSON.stringify(map))
    } catch {
      /* ignore */
    }
  }

  const placeOrder = async (options = {}) => {
    const { skipNavigate = false } = options
    setError("")
    setStatus("")
    if (!selectedItems.length) {
      setError("Select at least one item to pay.")
      return false
    }
    const token = localStorage.getItem("userToken") || localStorage.getItem("token")
    if (!token) {
      setError("Please log in to continue.")
      navigate("/login")
      return false
    }
    setPlacing(true)
    let success = false
    try {
      const payload = {
        items: selectedItems.map((it) => ({
          id: it.id,
          product_id: it.product_id ?? it.productId ?? it.id,
          productId: it.product_id ?? it.productId ?? it.id,
          name: it.name,
          category: it.category || it.type || "custom",
          price: Number(it.price || 0),
          quantity: Math.max(1, Number(it.quantity || 1)),
          image_url: it.image_url || it.imageUrl || "",
          specs: it.specs || null,
          parts: it.parts || null,
          components: it.components || null,
        })),
        deliveryOption,
        services,
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discountAmount.toFixed(2)),
        deliveryFee: Number(appliedDeliveryFee.toFixed(2)),
        servicesTotal: Number(appliedServicesTotal.toFixed(2)),
        total: Number(total.toFixed(2)),
        paymentMethod,
        paymentMasked: paymentMask(paymentMethod),
      }

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed to place order.")
      success = true
      setStatus(skipNavigate ? "Payment successful. You can review or proceed." : "Order placed successfully. Redirecting to transactions...")
      const remaining = items.filter((it) => !selectedItems.find((sel) => sel.id === it.id))
      persistCart(remaining)
      incrementLocalSold(selectedItems)
      setItems(remaining)
      setSelectedIds(remaining.map((it) => it.id))
      setAppliedCoupon("")
      setCouponInput("")
      if (!skipNavigate) {
        setTimeout(() => navigate("/transactions"), 900)
      }
    } catch (e) {
      success = false
      setError(e.message || "Failed to place order.")
    } finally {
      setPlacing(false)
    }
    return success
  }

  const specsPreview = (item) => {
    if (!Array.isArray(item?.specs)) return ""
    const names = item.specs
      .map((row) => row.name || row.item || row.category || row.type || "")
      .filter(Boolean)
      .slice(0, 3)
    return names.join(", ")
  }

  const formatCategoryLabel = (value) => {
    if (!value) return "Custom"
    const str = String(value)
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  return (
    <div className="relative min-h-screen bg-[#030617] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.18), transparent 35%), radial-gradient(circle at 80% 0%, rgba(168,85,247,0.16), transparent 30%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.16), transparent 35%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "140px 140px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">Checkout</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Secure your build</h1>
            <p className="text-sm text-slate-300">
              Review your cart, pick services, and place the order. Orders go straight to the build queue.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200">
            Encrypted checkout
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}
        {status && (
          <div className="mt-4 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {status}
          </div>
        )}
        {profileSaved && (
          <div className="mt-3 rounded-lg border border-blue-400/40 bg-blue-500/10 px-4 py-2 text-xs text-blue-100">
            {profileSaved}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/30">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Items</h2>
                <span className="text-sm text-slate-300">
                  {selectedItems.length} selected / {items.length} total
                </span>
              </div>
              {!items.length && (
                <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-black/30 p-6 text-center text-slate-300">
                  No items ready for checkout.{" "}
                  <Link to="/home" className="text-cyan-300 hover:underline">
                    Browse builds
                  </Link>
                </div>
              )}
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-black/40 p-3 ring-1 ring-white/5"
                  >
                    <div className="flex gap-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
                        {item.image_url || item.imageUrl ? (
                          <img
                            src={item.image_url || item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item.id)}
                                onChange={() => toggleSelection(item.id)}
                                className="h-4 w-4 rounded border-white/30 bg-white/10"
                                aria-label="Select item for payment"
                              />
                              <div className="text-base font-semibold text-white">{item.name}</div>
                            </div>
                            <div className="text-xs text-slate-400">#{item.id}</div>
                            {specsPreview(item) && (
                              <div className="text-xs text-slate-300">Includes: {specsPreview(item)}</div>
                            )}
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-200">
                              <span className="rounded-full bg-white/10 px-2 py-1">
                                {formatCategoryLabel(item.category || item.type || "Custom")}
                              </span>
                              {item.stock !== undefined && (
                                <span className="rounded-full bg-white/10 px-2 py-1">Stock: {item.stock}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="rounded-full bg-white/5 p-2 text-slate-300 hover:bg-white/10"
                            aria-label="Remove item"
                          >
                          x
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm text-slate-200">{formatRM(item.price)}</div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              className="h-8 w-8 rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white disabled:opacity-40"
                            >
                              -
                            </button>
                            <span className="min-w-[36px] text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-8 w-8 rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!selectedItems.length && items.length > 0 && (
                  <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    Select at least one item above to include in this payment.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Delivery</h2>
                  <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Malaysia</span>
                </div>
                <div className="mt-3 space-y-3">
                  {[
                    { key: "standard", title: "Standard (3-5 days)", fee: 0, desc: "Insured ground delivery" },
                    { key: "express", title: "Express (1-2 days)", fee: 40, desc: "Priority handling + courier" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setDeliveryOption(opt.key)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        deliveryOption === opt.key
                          ? "border-cyan-400/60 bg-cyan-500/10 text-white"
                          : "border-white/10 bg-black/40 text-slate-200 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">{opt.title}</div>
                          <div className="text-xs text-slate-400">{opt.desc}</div>
                        </div>
                        <div className="text-sm font-semibold">{opt.fee === 0 ? "Free" : formatRM(opt.fee)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Optional services</h2>
                  <span className="text-xs text-slate-400">Boost or OS prep</span>
                </div>
                <div className="mt-3 space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-3 hover:border-white/20">
                    <input
                      type="checkbox"
                      checked={services.overclock}
                      onChange={(e) => setServices((s) => ({ ...s, overclock: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">Custom overclock & stress test</span>
                        <span className="text-sm">{formatRM(SERVICE_PRICES.overclock)}</span>
                      </div>
                      <p className="text-xs text-slate-400">We tune CPU/GPU within safe thermals and validate stability.</p>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-3 hover:border-white/20">
                    <input
                      type="checkbox"
                      checked={services.windows}
                      onChange={(e) => setServices((s) => ({ ...s, windows: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">Windows install + drivers</span>
                        <span className="text-sm">{formatRM(SERVICE_PRICES.windows)}</span>
                      </div>
                      <p className="text-xs text-slate-400">Clean install, latest drivers, BIOS update, and stress test.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/30">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Contact & address</h2>
                <span className="text-xs text-slate-400">Used for delivery + receipts</span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold tracking-[0.2em] text-slate-200">Name</label>
                  <input
                    value={profile.username}
                    onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-[0.2em] text-slate-200">Email</label>
                  <input
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-[0.2em] text-slate-200">Phone</label>
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold tracking-[0.2em] text-slate-200">Address</label>
                  <textarea
                    value={profile.address}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                    rows={3}
                    placeholder="Street, city, state, postcode"
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={saveProfile}
                  className="rounded-lg border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-50 hover:border-cyan-300"
                >
                  Save contact locally
                </button>
                <Link
                  to="/profile"
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-100 hover:border-white/20"
                >
                  Manage in profile
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/30">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Summary</h2>
                <span className="text-xs text-slate-400">Auto-updates</span>
              </div>
              <div className="mt-3 space-y-3 text-sm text-slate-200">
                <div className="flex justify-between">
                  <span>Items ({selectedItems.length} of {items.length})</span>
                  <span className="font-semibold text-white">{formatRM(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Services</span>
                  <span className="font-semibold text-white">{formatRM(appliedServicesTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="font-semibold text-white">
                    {appliedDeliveryFee === 0 ? "Free" : formatRM(appliedDeliveryFee)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-200">
                    <span>Discount ({appliedCoupon})</span>
                    <span>- {formatRM(discountAmount)}</span>
                  </div>
                )}
                <div className="h-px bg-white/10" />
                <div className="flex items-center justify-between text-base font-semibold text-white">
                  <span>Total</span>
                  <span>{formatRM(total)}</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Payment</div>
                <div className="mt-2 space-y-2 text-sm">
                  {[
                    {
                      key: "card",
                      label: "Card",
                      note: "Visa / Mastercard / Amex / UnionPay",
                      logos: ["/payment/visa.png", "/payment/mastercard.png", "/payment/amex.png", "/payment/unionpay.png"],
                    },
                    { key: "fpx", label: "Online banking (FPX)", note: "Instant confirmation" },
                    { key: "cod", label: "Pay on delivery", note: "Full payment on arrival" },
                  ].map((opt) => (
                    <label
                      key={opt.key}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:border-white/20"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={paymentMethod === opt.key}
                          onChange={() => setPaymentMethod(opt.key)}
                          className="h-4 w-4 border-white/30 bg-white/10"
                        />
                        <div>
                          <div className="font-semibold text-white">{opt.label}</div>
                          <div className="text-xs text-slate-400">{opt.note}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {opt.logos && (
                          <div className="flex items-center gap-1">
                            {opt.logos.map((src) => (
                              <img
                                key={src}
                                src={src}
                                alt="Card logo"
                                className="h-6 w-auto rounded border border-white/10 bg-white/90 p-0.5 shadow-sm"
                              />
                            ))}
                          </div>
                        )}
                        {paymentMethod === opt.key && (
                          <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-cyan-200">
                            Selected
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {paymentMethod === "card" && (
                  <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-black/60 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Card details</div>
                    {cardError && (
                      <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                        {cardError}
                      </div>
                    )}
                    <div className="grid gap-2">
                      <div className="grid gap-2">
                        <label className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Cardholder name</label>
                        <input
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails((d) => ({ ...d, name: e.target.value }))}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                          placeholder="Name as on card"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Card number</label>
                        <input
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails((d) => ({ ...d, number: e.target.value }))}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                          placeholder="1234 5678 9012 3456"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Exp (MM/YY)</label>
                          <input
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails((d) => ({ ...d, expiry: e.target.value }))}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                            placeholder="09/27"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-300">CVV</label>
                          <input
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails((d) => ({ ...d, cvv: e.target.value }))}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                            placeholder="123"
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                    </div>
                    {cardStage && (
                      <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 animate-pulse">
                        {cardStage}
                      </div>
                    )}
                    {cardSuccess && (
                      <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                        Payment successful. Choose an option below.
                      </div>
                    )}
                    {!cardSuccess && (
                      <button
                        onClick={handleCardPay}
                        disabled={cardProcessing || placing}
                        className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-blue-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {cardProcessing ? "Processing..." : "Pay Now"}
                      </button>
                    )}
                    {cardSuccess && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setCardSuccess(false)
                            setCardStage("")
                            setStatus("Payment successful.")
                          }}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:border-white/20"
                        >
                          Ok
                        </button>
                        <button
                          onClick={() => navigate("/transactions")}
                          className="rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-50 hover:border-emerald-300"
                        >
                          Check Transaction
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Coupon</div>
                    <div className="text-[11px] text-slate-400">Try NGLIOTA for 20% off (max RM 222)</div>
                  </div>
                  {appliedCoupon && (
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-100">
                      {appliedCoupon}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                  />
                  <button
                    onClick={applyCoupon}
                    className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {paymentMethod !== "card" && (
                <button
                  onClick={() => placeOrder()}
                  disabled={!selectedItems.length || placing}
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-center text-base font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {placing ? "Placing order..." : `Place order (${formatRM(total)})`}
                </button>
              )}
              {paymentMethod === "card" && (
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  Enter card details above and tap Pay Now to continue.
                </p>
              )}
              <p className="mt-2 text-center text-[11px] text-slate-400">
                By placing the order you agree to our build queue and delivery timelines.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-600/10 p-4 text-sm text-slate-200 shadow-xl shadow-black/30">
              <div className="text-xs uppercase tracking-[0.25em] text-indigo-200">Need help?</div>
              <p className="mt-2">We can adjust parts, upgrade cooling, or match delivery dates.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href="mailto:support@wcomplabs.test"
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-white/30"
                >
                  Email support
                </a>
                <a
                  href="https://wa.me/60123456789"
                  className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100 hover:border-emerald-300"
                >
                  Whatsapp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




