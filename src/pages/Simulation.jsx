// src/pages/Simulation.jsx
import React, { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"

const formatRM = (value) => `RM ${(Number(value ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const cpuOptions = [
  "AMD Ryzen 5 5600",
  "AMD Ryzen 7 5800X3D",
  "AMD Ryzen 5 7600",
  "Intel Core i5-12400F",
  "Intel Core i5-13400F",
  "Intel Core i7-13700F",
]

const gpuOptions = [
  "NVIDIA RTX 3060 Ti",
  "NVIDIA RTX 4060",
  "NVIDIA RTX 4070",
  "NVIDIA RTX 4080",
  "AMD Radeon RX 6600",
  "AMD Radeon RX 6800 XT",
]

const boardOptions = [
  "B550 (AM4)",
  "X570 (AM4)",
  "B650 (AM5)",
  "B660 (LGA1700)",
  "B760 (LGA1700)",
  "Z690 (LGA1700)",
]

const ramOptions = [
  "16GB (2x8) DDR4-3200",
  "32GB (2x16) DDR4-3600",
  "32GB (2x16) DDR5-5600",
]

const storageOptions = [
  "1TB NVMe SSD",
  "2TB NVMe SSD",
  "1TB SATA SSD + 2TB HDD",
]

const psuOptions = [
  "650W 80+ Bronze",
  "750W 80+ Gold",
  "850W 80+ Gold",
]

const caseOptions = [
  "Mid Tower Airflow",
  "Mini-ITX Compact",
  "Full Tower",
]

const coolerOptions = [
  "Stock Cooler",
  "Tower Air Cooler",
  "240mm AIO",
]

export default function Simulation() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState("guided")

  // Guided inputs
  const [useCase, setUseCase] = useState("gaming")
  const [budgetMin, setBudgetMin] = useState("3000")
  const [budgetMax, setBudgetMax] = useState("4500")
  const [resolution, setResolution] = useState("1080p") // 1080p | 1440p | 4k
  const [recommendation, setRecommendation] = useState(null)
  const [savedMsg, setSavedMsg] = useState("")
  const [products, setProducts] = useState([])
  const [productError, setProductError] = useState("")
  const [productLoading, setProductLoading] = useState(false)
  const [recLoading, setRecLoading] = useState(false)

  // Manual selections (dynamic rows like admin prebuilt list)
  const [manualRows, setManualRows] = useState([{ category: "cpu", productId: "", name: "", price: 0, quantity: 1 }])

  const loadSavedManual = () => {
    try {
      const raw = localStorage.getItem("simulationBuild")
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.rows && Array.isArray(parsed.rows) && parsed.rows.length) {
        setManualRows(parsed.rows)
      }
    } catch {
      /* ignore */
    }
  }

  const guideSummary = useMemo(() => {
    const min = budgetMin ? formatRM(budgetMin) : "-"
    const max = budgetMax ? formatRM(budgetMax) : "-"
    return `Use: ${useCase}, Budget: ${min}${budgetMax ? ` - ${max}` : ""}, Target: ${resolution}`
  }, [useCase, budgetMin, budgetMax, resolution])

  useEffect(() => {
    let cancelled = false
    const loadProducts = async () => {
      setProductLoading(true)
      setProductError("")
      try {
        const res = await fetch(`${API_URL}/api/products?exclude_prebuilt=true&include_inactive=true`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || "Failed to load products")
        if (!cancelled) setProducts(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setProductError(e.message || "Unable to load products for recommendations.")
      } finally {
        if (!cancelled) setProductLoading(false)
      }
    }
    loadProducts()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const manualParam = searchParams.get("manual")
    if (manualParam === "1") {
      loadSavedManual()
      setTab("manual")
    }
  }, [searchParams])

  const classifyProduct = (item = {}) => {
    const category = (item.category || "").toLowerCase().trim()
    const name = (item.name || "").toLowerCase()
    const tags = `${category} ${name}`
    const match = (needle) => tags.includes(needle)

    // Hard filter: ignore peripherals/accessories from core build suggestions
    const peripheralWords = ["headset", "keyboard", "mouse", "speaker", "monitor", "accessory", "peripheral", "network", "router", "modem"]
    if (peripheralWords.some((w) => match(w))) return null

    // Coolers before CPU/GPU to avoid misclassifying "CPU Cooler" as CPU
    if (category.includes("cooler") || match("cooler") || match("aio") || match("fan")) return "cooler"

    // GPU detection: require strong GPU hints
    const isGpuCategory = ["gpu", "graphics card", "vga"].some((w) => category.includes(w))
    const isGpuName = ["rtx", "gtx", "rx ", "rx-", "arc "].some((w) => match(w))
    if (isGpuCategory || isGpuName) return "gpu"

    // CPU detection
    const isCpuCategory = category.includes("cpu") || category.includes("processor")
    const isCpuName = ["ryzen", "intel core", " i3", " i5", " i7", " i9"].some((w) => match(w))
    if (isCpuCategory || isCpuName) return "cpu"

    // Motherboard
    if (category.includes("motherboard") || match("b550") || match("b650") || match("x570") || match("z690") || match("b660") || match("b760") || match("z790") || match("am4") || match("am5") || match("lga1700")) {
      return "motherboard"
    }

    // Memory
    if (category.includes("ram") || category.includes("memory") || match("ddr4") || match("ddr5")) return "ram"

    // Storage
    if (category.includes("storage") || category.includes("ssd") || category.includes("hdd") || match("nvme")) return "storage"

    // PSU
    if (category.includes("psu") || category.includes("power supply") || match("watt")) return "psu"

    // Case
    if (category.includes("case")) return "case"

    // Cooler
    if (category.includes("cooler") || match("aio") || match("fan")) return "cooler"

    return null
  }

  const productGroups = useMemo(() => {
    const groups = {
      cpu: [],
      gpu: [],
      motherboard: [],
      ram: [],
      storage: [],
      psu: [],
      case: [],
      cooler: [],
    }
    products.forEach((p) => {
      const key = classifyProduct(p)
      if (key) groups[key].push(p)
    })
    Object.keys(groups).forEach((key) => {
      groups[key] = groups[key].sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    })
    return groups
  }, [products])

  // Keep all products (except prebuilt filtered at API) so user categories mirror admin
  const filteredProducts = useMemo(() => products, [products])

  const manualProductGroups = useMemo(() => {
    const map = new Map()
    filteredProducts.forEach((p) => {
      const key = (p.category || "uncategorized").toLowerCase()
      const list = map.get(key) || []
      list.push(p)
      map.set(key, list)
    })
    map.forEach((list, key) => {
      map.set(
        key,
        [...list].sort((a, b) => {
          const priceDiff = (Number(b.price) || 0) - (Number(a.price) || 0)
          if (priceDiff !== 0) return priceDiff
          return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
        })
      )
    })
    return map
  }, [filteredProducts])

  const productCategories = useMemo(() => Array.from(manualProductGroups.keys()), [manualProductGroups])
  const normalizeCategory = (cat = "") => (cat || "").toString().toLowerCase()
  const formatCategoryLabel = (cat = "") => {
    const map = {
      cpu: "CPU",
      gpu: "GPU",
      ram: "RAM",
      ssd: "SSD",
      hdd: "HDD",
      psu: "PSU",
      motherboard: "Motherboard",
      case: "Case",
      cooler: "CPU Cooler",
      "cpu cooler": "CPU Cooler",
      fan: "Case Fan",
      "case fan": "Case Fan",
      monitor: "Monitor",
      network: "Network",
      "peripherals headset": "Peripherals Headset",
      "peripherals keyboard": "Peripherals Keyboard",
      "peripherals mouse": "Peripherals Mouse",
      "peripherals mousepad": "Peripherals Mousepad",
      "peripherals speaker": "Peripherals Speaker",
      "peripherals webcam": "Peripherals Webcam",
    }
    if (map[cat]) return map[cat]
    if (!cat) return "Uncategorized"
    return cat
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  }

  const manualTotal = useMemo(() => {
    return manualRows.reduce((sum, row) => sum + Number(row.price || 0) * Math.max(1, Number(row.quantity) || 1), 0)
  }, [manualRows])

  const addRow = () => {
    setManualRows((rows) => [...rows, { category: "", productId: "", name: "", price: 0, quantity: 1 }])
  }

  const removeRow = (index) => {
    setManualRows((rows) => rows.filter((_, i) => i !== index))
  }

  const updateRow = (index, field, value) => {
    setManualRows((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row
        if (field === "category") {
          return { ...row, category: value, productId: "", name: "", price: 0 }
        }
        if (field === "quantity") {
          const qty = Math.max(1, Number(value) || 1)
          return { ...row, quantity: qty }
        }
        return { ...row, [field]: value }
      })
    )
  }

  const handleProductSelect = (index, productId) => {
    const product = products.find((p) => String(p.id) === String(productId))
    setManualRows((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row
        return {
          ...row,
          productId,
          name: product?.name || row.name,
          price: product ? Number(product.price || 0) : row.price,
          category: row.category || product?.category || "",
        }
      })
    )
  }

  const pickBest = (list, ceiling) => {
    if (!Array.isArray(list) || !list.length) return null
    const under = list.filter((p) => Number(p.price || 0) <= ceiling)
    if (under.length) return under[under.length - 1]
    return list[0]
  }

  const detectCpuSocket = (name = "") => {
    const v = name.toLowerCase()
    if (v.includes("am5") || v.includes("7") && v.includes("7000")) return "am5"
    if (v.includes("am4") || v.includes("ryzen 5 5") || v.includes("ryzen 7 5")) return "am4"
    if (v.includes("lga1700") || v.includes("12400") || v.includes("13400") || v.includes("13700")) return "lga1700"
    return null
  }

  const detectBoardSocket = (name = "", category = "") => {
    const v = `${name} ${category}`.toLowerCase()
    if (v.includes("am5") || v.includes("b650") || v.includes("x670")) return "am5"
    if (v.includes("am4") || v.includes("b550") || v.includes("x570")) return "am4"
    if (v.includes("lga1700") || v.includes("b660") || v.includes("b760") || v.includes("z690") || v.includes("z790")) return "lga1700"
    return null
  }

  const detectGpuTier = (name = "") => {
    const v = name.toLowerCase()
    const hit = (s) => v.includes(s)
    if (hit("4090") || hit("7900")) return "extreme"
    if (hit("4080") || hit("4070 ti") || hit("7900 xt") || hit("7900xt")) return "4k-high"
    if (hit("4070") || hit("7800") || hit("7700") || hit("6800")) return "1440p-high"
    if (hit("4060") || hit("3060 ti") || hit("6700") || hit("6650")) return "1440p-mid"
    if (hit("3060") || hit("6600")) return "1080p-high"
    return "entry"
  }

  const pickCompatibleBoard = (socket, ceiling) => {
    const boards = productGroups.motherboard.filter((b) => {
      const s = detectBoardSocket(b.name, b.category)
      return socket ? s === socket : true
    })
    return pickBest(boards.length ? boards : productGroups.motherboard, ceiling)
  }

  const pickGpu = (budgetCeiling) => {
    // try to align GPU tier to resolution
    const desiredTiers = (() => {
      if (resolution === "4k") return ["4k-high", "extreme", "1440p-high", "1440p-mid"]
      if (resolution === "1440p") return ["1440p-high", "1440p-mid", "1080p-high", "entry"]
      return ["1080p-high", "entry"]
    })()
    const scored = productGroups.gpu.map((g) => ({
      item: g,
      tier: detectGpuTier(g.name),
      price: Number(g.price || 0),
    }))

    // Filter by budget
    const withinBudget = scored.filter((s) => s.price <= budgetCeiling)
    const pool = withinBudget.length ? withinBudget : scored

    for (const tier of desiredTiers) {
      const candidates = pool.filter((s) => s.tier === tier)
      if (candidates.length) {
        return candidates.sort((a, b) => a.price - b.price)[candidates.length - 1].item
      }
    }
    if (pool.length) return pool.sort((a, b) => a.price - b.price)[pool.length - 1].item
    return null
  }

  const pickCpu = (budgetCeiling) => {
    const scored = productGroups.cpu.map((c) => ({
      item: c,
      socket: detectCpuSocket(c.name),
      price: Number(c.price || 0),
    }))
    const withinBudget = scored.filter((s) => s.price <= budgetCeiling)
    const pool = withinBudget.length ? withinBudget : scored

    // Content creation needs more cores; prefer i7/7/9/8
    const heavy = pool.filter((s) => /i7|i9|ryzen 7|ryzen 9|5800x|13700/i.test(s.item.name))
    if (useCase === "content" && heavy.length) return heavy.sort((a, b) => a.price - b.price)[heavy.length - 1].item

    // Gaming/mixed: prefer higher clocks mid-tier
    const mid = pool.filter((s) => /i5|ryzen 5|5600|12400|13400/i.test(s.item.name))
    if (mid.length) return mid.sort((a, b) => a.price - b.price)[mid.length - 1].item

    if (pool.length) return pool.sort((a, b) => a.price - b.price)[pool.length - 1].item
    return null
  }

  const getBudgetNumber = () => {
    const min = Number(budgetMin || 0)
    const max = Number(budgetMax || 0)
    if (min && max) return (min + max) / 2
    return max || min || 0
  }

  const computeRecommendation = () => {
    setProductError("")
    setRecLoading(true)
    const payload = {
      useCase,
      resolution,
      budgetMin,
      budgetMax,
    }

    fetch(`${API_URL}/api/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || data?.error || "Failed to get recommendation")
        setRecommendation({
          parts: data.parts || {},
          display: data.display || {},
          total: Number(data.total || 0),
          source: data.source || "api",
        })
      })
      .catch(() => {
        setRecommendation(null)
        setProductError("Unable to fetch recommendation from server.")
      })
      .finally(() => setRecLoading(false))
  }

  const useRecommendation = () => {
    if (!recommendation || !recommendation.parts) return
    const findProductByName = (name) => {
      const target = (name || "").toLowerCase()
      return filteredProducts.find((p) => (p.name || "").toLowerCase() === target)
    }
    const map = recommendation.parts
    const nextRows = Object.entries(map).map(([category, info]) => {
      const product =
        (info && info.id && filteredProducts.find((p) => String(p.id) === String(info.id))) ||
        findProductByName(info?.name || info)
      const cat = normalizeCategory(info?.category || product?.category || category)
      return {
        category: cat,
        productId: product ? String(product.id) : info?.id ? String(info.id) : "",
        name: product?.name || info?.name || String(info || ""),
        price: product ? Number(product.price || 0) : Number(info?.price || 0),
        quantity: 1,
      }
    })
    setManualRows(nextRows.length ? nextRows : [{ category: "cpu", productId: "", name: "", price: 0, quantity: 1 }])
    setTab("manual")
  }

  const persistLocalSimulation = (payload) => {
    const list = (() => {
      try {
        const raw = localStorage.getItem("savedSimulations")
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    })()
    list.push(payload)
    localStorage.setItem("savedSimulations", JSON.stringify(list))
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

  const saveBuild = async () => {
    const title = `Custom Build - ${useCase} @ ${resolution}`
    const payload = { title, parts: manualRows, estimated_price: Number(manualTotal || 0) }
    const token = localStorage.getItem("userToken") || localStorage.getItem("token")
    try {
      if (token) {
        const res = await fetch(`${API_URL}/api/simulations`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || data?.error || "Failed to save build")
      } else {
        persistLocalSimulation({ ...payload, id: Date.now() })
      }
      localStorage.setItem("simulationBuild", JSON.stringify({ rows: manualRows }))
      setSavedMsg("Saved to Notes")
    } catch (e) {
      setSavedMsg(e.message || "Failed to save build.")
    } finally {
      setTimeout(() => setSavedMsg(""), 2500)
    }
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

  const addToCart = () => {
    if (!manualRows.length) {
      setSavedMsg("Add at least one part first.")
      setTimeout(() => setSavedMsg(""), 2000)
      return
    }
    const token = requireLogin()
    if (!token) return
    const payload = {
      id: `custom-${Date.now()}`,
      type: "custom-build",
      name: `Custom Build - ${useCase} @ ${resolution}`,
      price: Number(manualTotal || 0),
      image_url: "",
      specs: manualRows,
      stock: 1,
      category: "custom",
      quantity: 1,
    }
    try {
      const raw = localStorage.getItem(cartKey())
      const list = raw ? JSON.parse(raw) : []
      const filtered = Array.isArray(list) ? list.filter((item) => item.id !== payload.id) : []
      filtered.push(payload)
      localStorage.setItem(cartKey(), JSON.stringify(filtered))
      window.dispatchEvent(new Event("cart-update"))
      setSavedMsg("Added to cart")
    } catch {
      localStorage.setItem(cartKey(), JSON.stringify([payload]))
      window.dispatchEvent(new Event("cart-update"))
      setSavedMsg("Added to cart")
    } finally {
      setTimeout(() => setSavedMsg(""), 2000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-3xl md:text-4xl font-bold text-glow">PC Simulation</h1>
      <p className="text-white/80 mt-2">Step 1: tell us how you'll use the PC, Step 2: tweak parts manually.</p>

      {productError && (
        <div className="mt-4 rounded-lg border border-yellow-400/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
          {productError}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        <button
          className={`px-4 py-2 rounded-xl border ${tab === "guided" ? "bg-blue-600 border-blue-400" : "bg-black/50 border-white/20"}`}
          onClick={() => setTab("guided")}
        >
          Step 1: Guided Questions
        </button>
        <button
          className={`px-4 py-2 rounded-xl border ${tab === "manual" ? "bg-blue-600 border-blue-400" : "bg-black/50 border-white/20"}`}
          onClick={() => setTab("manual")}
        >
          Step 2: Manual Select
        </button>
      </div>

      {/* Guided */}
      {tab === "guided" && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="bg-black/60 rounded-xl p-4 ring-1 ring-white/10">
            <label className="block text-sm text-white/70 mb-1">Primary Use</label>
            <select className="w-full bg-black/70 p-2 rounded border border-white/10" value={useCase} onChange={(e)=>setUseCase(e.target.value)}>
              <option value="gaming">Gaming</option>
              <option value="content">Content Creation</option>
              <option value="mixed">Mixed</option>
              <option value="office">Office/General</option>
            </select>
          </div>
          <div className="bg-black/60 rounded-xl p-4 ring-1 ring-white/10">
            <label className="block text-sm text-white/70 mb-1">Budget (RM)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <span className="text-xs text-white/60">Min</span>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full mt-1 bg-black/70 p-2 rounded border border-white/10"
                  placeholder="1500"
                  value={budgetMin}
                  onChange={(e)=>setBudgetMin(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <span className="text-xs text-white/60">Max</span>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full mt-1 bg-black/70 p-2 rounded border border-white/10"
                  placeholder="3000"
                  value={budgetMax}
                  onChange={(e)=>setBudgetMax(e.target.value)}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-white/60">Enter your real RM range for smarter picks.</p>
          </div>
          <div className="bg-black/60 rounded-xl p-4 ring-1 ring-white/10">
            <label className="block text-sm text-white/70 mb-1">Target Resolution</label>
            <select className="w-full bg-black/70 p-2 rounded border border-white/10" value={resolution} onChange={(e)=>setResolution(e.target.value)}>
              <option value="1080p">1080p</option>
              <option value="1440p">1440p</option>
              <option value="4k">4K</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center justify-between bg-black/50 rounded-xl p-4 ring-1 ring-white/10">
            <div className="text-white/70">
              {guideSummary}
              {productLoading && <span className="ml-2 text-xs text-white/50">(loading products...)</span>}
              {recLoading && <span className="ml-2 text-xs text-emerald-200">(AI is searching the best parts...)</span>}
            </div>
            <button
              onClick={computeRecommendation}
              disabled={recLoading}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {recLoading ? "Searching..." : "Recommend Build"}
            </button>
          </div>

          {recLoading && (
            <div className="md:col-span-3 rounded-xl bg-black/60 p-4 ring-1 ring-white/10 animate-pulse text-white/80">
              AI is searching the best products for your specification...
            </div>
          )}

          {recommendation && (
            <div className="md:col-span-3 bg-black/60 rounded-xl p-4 ring-1 ring-white/10">
              <h3 className="text-xl font-semibold mb-2">Recommended Build</h3>
              {recommendation.source && (
                <p className="text-xs text-white/60 mb-2">
                  {recommendation.source === "llm+rules" ? "AI-assisted + rule validation" : "Generated by server automation"}
                </p>
              )}
              {recommendation.total > 0 && (
                <p className="text-sm text-white/80 mb-2">Approx. parts total: {formatRM(recommendation.total)}</p>
              )}
              {productError && recommendation.source === "api" && (
                <p className="text-xs text-amber-200 mb-2">{productError}</p>
              )}
              {(() => {
                const display = recommendation.display || {}
                return (
                  <ul className="grid md:grid-cols-2 gap-2 text-white/90">
                    <li><span className="text-white/60">CPU:</span> {display.cpu || "CPU not found"}</li>
                    <li><span className="text-white/60">GPU:</span> {display.gpu || "GPU not found"}</li>
                    <li><span className="text-white/60">Motherboard:</span> {display.motherboard || "Motherboard not found"}</li>
                    <li><span className="text-white/60">RAM:</span> {display.ram || "RAM not found"}</li>
                    <li><span className="text-white/60">SSD:</span> {display.ssd || "SSD not found"}</li>
                    <li><span className="text-white/60">HDD:</span> {display.hdd || "HDD not added"}</li>
                    <li><span className="text-white/60">PSU:</span> {display.psu || "PSU not found"}</li>
                    <li><span className="text-white/60">Case:</span> {display.case || "Case not found"}</li>
                    <li><span className="text-white/60">Cooler:</span> {display.cooler || "Cooler not found"}</li>
                    <li><span className="text-white/60">Case Fan:</span> {display.fan || "Fan not added"}</li>
                  </ul>
                )
              })()}
              <div className="mt-4">
                <button onClick={useRecommendation} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500">Use this in Manual</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual */}
      {tab === "manual" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-black/60 ring-1 ring-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Manual Parts List</h3>
              <button onClick={addRow} className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-sm text-white">Add Part</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-sm text-white">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/70">
                  <tr>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Line Total</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {manualRows.map((row, idx) => {
                    const valueProductId = row.productId ? String(row.productId) : ""
                    const baseOptions = row.category && manualProductGroups.get(row.category)?.length
                      ? manualProductGroups.get(row.category)
                      : filteredProducts
                    const selectedProduct =
                      valueProductId ? filteredProducts.find((p) => String(p.id) === valueProductId) : null
                    const options = selectedProduct && !baseOptions.some((p) => String(p.id) === valueProductId)
                      ? [selectedProduct, ...baseOptions]
                      : baseOptions
                    const lineTotal = row.price ? Number(row.price) * Math.max(1, Number(row.quantity) || 1) : 0
                    return (
                      <tr key={idx} className="border-t border-white/10">
                        <td className="px-3 py-2 align-middle">
                          <select
                            className="w-full rounded border border-white/10 bg-black/60 p-2 text-sm text-white"
                            value={row.category}
                            onChange={(e)=>updateRow(idx, "category", e.target.value)}
                          >
                            <option value="">Select category</option>
                            {productCategories.map((cat) => (
                              <option key={cat} value={cat}>{formatCategoryLabel(cat)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <select
                            className="w-full rounded border border-white/10 bg-black/60 p-2 text-sm text-white"
                            value={valueProductId}
                            onChange={(e)=>handleProductSelect(idx, e.target.value)}
                          >
                            <option value="">Select product</option>
                            {options.map((p) => (
                              <option key={p.id} value={String(p.id)}>
                                {p.name} ({formatRM(p.price)})
                              </option>
                            ))}
                          </select>
                          {!options.length && (
                            <p className="mt-1 text-[11px] text-amber-200">No products in this category.</p>
                          )}
                        </td>
                        <td className="px-3 py-2 align-middle text-right">
                          <input
                            type="number"
                            min="1"
                            className="w-20 rounded border border-white/10 bg-black/60 p-2 text-sm text-white text-right"
                            value={row.quantity}
                            onChange={(e)=>updateRow(idx, "quantity", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2 align-middle text-right">{lineTotal ? formatRM(lineTotal) : "RM 0"}</td>
                        <td className="px-3 py-2 align-middle text-right">
                          {manualRows.length > 1 && (
                            <button onClick={()=>removeRow(idx)} className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs">Remove</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-black/60 ring-1 ring-white/10 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">WCompLabs Pre-Receipt</h3>
              <span className="text-sm text-white/80">Total: {formatRM(manualTotal)}</span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm text-white">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/70">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Line</th>
                  </tr>
                </thead>
                <tbody>
                  {manualRows.map((row, idx) => {
                    const lineTotal = row.price ? Number(row.price) * Math.max(1, Number(row.quantity) || 1) : 0
                    return (
                      <tr key={idx} className="border-t border-white/10">
                        <td className="px-3 py-2 align-middle">
                          <div className="font-semibold text-white/90">{row.name || "Select a product"}</div>
                          <div className="text-xs text-white/50">{formatCategoryLabel(row.category)}</div>
                        </td>
                        <td className="px-3 py-2 align-middle text-right">{row.price ? formatRM(row.price) : "RM 0"}</td>
                        <td className="px-3 py-2 align-middle text-right">x{row.quantity || 1}</td>
                        <td className="px-3 py-2 align-middle text-right">{lineTotal ? formatRM(lineTotal) : "RM 0"}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-white/5">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold text-white">Total</td>
                    <td className="px-3 py-2 text-right font-semibold text-white">{formatRM(manualTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button onClick={addToCart} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500">Add to Cart</button>
              {savedMsg && <span className="text-sm text-white/70">{savedMsg}</span>}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Selector helper removed in favor of admin-style part rows
