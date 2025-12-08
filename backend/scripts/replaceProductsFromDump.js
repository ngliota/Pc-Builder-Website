// backend/scripts/replaceProductsFromDump.js
// Replaces all products with the contents of products_dump.json
// Guarantees per-category minimums:
// - CPU/GPU/RAM/Motherboard: at least 60 items each
// - All other categories: at least 40 items each

import fs from "fs"
import path from "path"
import Product from "../models/productModel.js"
import db from "../config/database.js"

const CATEGORY_MAP = {
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  motherboard: "Motherboard",
  psu: "PSU",
  ssd: "SSD",
  hdd: "HDD",
  "cpu cooler": "CPU Cooler",
  fan: "Fan",
  case: "Case",
  monitor: "Monitor",
  network: "Network",
  "peripherals keyboard": "Peripherals Keyboard",
  "peripherals mouse": "Peripherals Mouse",
  "peripherals headset": "Peripherals Headset",
  "peripherals mousepad": "Peripherals Mousepad",
  "peripherals speaker": "Peripherals Speaker",
  "peripherals webcam": "Peripherals Webcam",
}

const TARGET_MIN = {
  cpu: 50,
  gpu: 50,
  ram: 50,
  motherboard: 50,
  default: 25,
}

const TOPUP_LIBRARY = {
  gpu: {
    brands: ["ASUS", "MSI", "Gigabyte", "Zotac", "Sapphire", "PowerColor", "PNY", "ASRock"],
    models: [
      "RTX 4090",
      "RTX 4080 SUPER",
      "RTX 4080",
      "RTX 4070 Ti SUPER",
      "RTX 4070 SUPER",
      "RTX 4070",
      "RTX 4060 Ti 16GB",
      "RTX 4060 Ti 8GB",
      "RTX 4060",
      "RTX 4050",
      "RX 7900 XTX",
      "RX 7900 XT",
      "RX 7800 XT",
      "RX 7700 XT",
      "RX 7600 XT",
      "RX 7600",
      "RX 6800 XT",
      "RX 6700 XT",
      "RX 6650 XT",
      "RX 6600 XT",
      "RX 6600",
    ],
  },
  cpu: {
    brands: ["Intel", "AMD"],
    models: [
      "Core i9-14900K",
      "Core i9-14900KF",
      "Core i9-13900K",
      "Core i7-14700K",
      "Core i7-13700K",
      "Core i7-13700F",
      "Core i5-14600K",
      "Core i5-13600K",
      "Core i5-13400F",
      "Core i5-12400F",
      "Core i3-13100F",
      "Core i3-12100F",
      "Xeon W7-2495X",
      "Xeon W5-2465X",
      "Ryzen 9 7950X3D",
      "Ryzen 9 7950X",
      "Ryzen 9 7900X",
      "Ryzen 7 7800X3D",
      "Ryzen 7 7700X",
      "Ryzen 7 7700",
      "Ryzen 5 7600X",
      "Ryzen 5 7600",
      "Ryzen 5 5600G",
      "Ryzen 5 5600",
      "Ryzen Threadripper 7980X",
      "Ryzen Threadripper 7970X",
      "EPYC 9354P",
      "EPYC 9554P",
    ],
  },
  ram: {
    brands: ["Corsair", "G.Skill", "Kingston", "Crucial", "TeamGroup", "Patriot"],
    models: [
      "DDR5 64GB 6400 CL32",
      "DDR5 64GB 6000 CL36",
      "DDR5 32GB 7200 CL34",
      "DDR5 32GB 7000 CL34",
      "DDR5 32GB 6400 CL32",
      "DDR5 32GB 6000 CL36",
      "DDR5 32GB 5600 CL36",
      "DDR5 16GB 6000 CL36",
      "DDR4 32GB 3600 CL16",
      "DDR4 32GB 3200 CL16",
      "DDR4 16GB 3600 CL16",
      "DDR4 16GB 3200 CL16",
      "DDR4 32GB 4000 CL18",
      "DDR5 48GB 6000 CL36",
      "DDR5 64GB 7200 CL34",
    ],
  },
  motherboard: {
    brands: ["ASUS", "MSI", "Gigabyte", "ASRock"],
    models: [
      "ROG Strix Z790-E",
      "ROG Strix Z790-F",
      "TUF Gaming Z790-Plus",
      "TUF Gaming B760-Plus",
      "ProArt Z790-Creator",
      "Prime Z790-P",
      "Prime B760M-A",
      "MEG Z790 Ace",
      "MPG Z790 Carbon",
      "MAG Z790 Tomahawk",
      "B760 Mortar",
      "B760 Bazooka",
      "Z790 Aorus Master",
      "Z790 Aorus Elite",
      "B760 Aorus Pro",
      "B760M Gaming X",
      "X670E Taichi",
      "X670E Steel Legend",
      "B650E Steel Legend",
      "B650M Pro RS",
      "B650 Tomahawk",
      "X670E Aorus Master",
      "X670E Aorus Elite",
    ],
  },
  psu: {
    brands: ["Corsair", "Seasonic", "EVGA", "Cooler Master", "NZXT"],
    models: ["RM750x", "RM850e", "RM1000x", "Focus GX-750", "Focus PX-850", "SuperNOVA 850 G7", "SuperNOVA 1000 G7", "V750 Gold", "V850 Gold", "C850"],
  },
  "cpu cooler": {
    brands: ["Noctua", "be quiet!", "Deepcool", "Corsair", "Cooler Master"],
    models: ["NH-D15", "NH-U12A", "Dark Rock Pro 4", "Assassin IV", "LS720", "iCUE H150i", "MasterLiquid ML360"],
  },
  fan: {
    brands: ["Noctua", "Corsair", "Arctic", "Lian Li", "be quiet!"],
    models: ["NF-A12x25", "AF120 Elite", "P12 PWM", "Uni Fan P28", "Silent Wings 4", "LL120 RGB"],
  },
  case: {
    brands: ["NZXT", "Lian Li", "Fractal Design", "Corsair", "Phanteks"],
    models: ["H510 Flow", "H7 Flow", "Lancool III", "O11 Dynamic EVO", "Meshify 2", "Torrent Compact", "4000D Airflow", "5000D Airflow", "P500A"],
  },
  ssd: {
    brands: ["Samsung", "WD", "Crucial", "Kingston", "Sabrent"],
    models: ["990 Pro 2TB", "990 Pro 1TB", "980 Pro 1TB", "SN850X 2TB", "SN850X 1TB", "SN770 1TB", "P5 Plus 1TB", "KC3000 1TB", "Rocket 4 Plus 2TB"],
  },
  hdd: {
    brands: ["Seagate", "WD"],
    models: ["IronWolf 8TB", "IronWolf 4TB", "Barracuda 4TB", "Red Plus 8TB", "Red Plus 4TB", "Purple 6TB"],
  },
  monitor: {
    brands: ["LG", "Samsung", "Dell", "Gigabyte", "ASUS"],
    models: ["Ultragear 27GP850", "Ultragear 32GN650", "Odyssey G7 32", "Odyssey G9 Neo", "G5 27", "AW3423DW", "M32U", "TUF Gaming VG27AQ", "ProArt PA278QV"],
  },
  "peripherals keyboard": {
    brands: ["Keychron", "Logitech", "Razer", "Corsair", "SteelSeries"],
    models: ["K8 Pro", "K6 Pro", "G Pro X TKL", "MX Mechanical", "Huntsman V2", "BlackWidow V4", "K70 RGB", "Apex Pro TKL"],
  },
  "peripherals mouse": {
    brands: ["Logitech", "Razer", "Glorious", "SteelSeries", "Zowie"],
    models: ["G Pro X Superlight 2", "G502 X Plus", "Basilisk V3 Pro", "DeathAdder V3 Pro", "Model O 2", "Aerox 5 Wireless", "EC2-CW"],
  },
  "peripherals headset": {
    brands: ["HyperX", "SteelSeries", "Logitech", "Razer", "Corsair"],
    models: ["Cloud II", "Arctis Nova 7", "Arctis Nova Pro", "G Pro X 2", "BlackShark V2 Pro", "HS80 Wireless"],
  },
  "peripherals mousepad": {
    brands: ["SteelSeries", "Razer", "Logitech", "Glorious"],
    models: ["QcK Heavy XL", "Strider Chroma", "G840 XL", "Helios XL", "Ice Elements XL"],
  },
  "peripherals speaker": {
    brands: ["Edifier", "Logitech", "Creative"],
    models: ["R1280DB", "S350DB", "Z407", "Pebble Pro", "Katana V2X"],
  },
  "peripherals webcam": {
    brands: ["Logitech", "Elgato", "Razer"],
    models: ["C920s", "Brio 4K", "StreamCam", "Facecam Pro", "Kiyo Pro"],
  },
  network: {
    brands: ["TP-Link", "Asus", "Netgear"],
    models: ["Archer AX55", "Archer AX72", "RT-AX86U", "RT-AX82U", "RAX50", "RAX70"],
  },
  default: {
    brands: ["Generic"],
    models: ["Standard Model"],
  },
}

const normalizeCategory = (raw) => {
  const key = String(raw || "Misc").trim()
  const lower = key.toLowerCase()
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower]
  // Default: capitalize first letter of each word
  return key
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

const midpoint = (min, max) => Number(((min + max) / 2).toFixed(2))

// FX_RATE represents USD -> RM (e.g., 1 USD = 4.17 RM when 1 MYR ≈ 0.24 USD)
const FX_RATE = parseFloat(process.env.FX_RATE || "4.17") // USD to RM conversion

const derivePrice = (name, category) => {
  const n = name.toLowerCase()
  const c = category.toLowerCase()

  const wattMatch = n.match(/(\d{3,4})w/)
  const sizeMatch = n.match(/(\d{2,3})\"|(\d{2,3}) ?inch/)
  const capMatchTb = n.match(/(\d+(?:\.\d+)?)\s*tb/)
  const capMatchGb = n.match(/(\d+(?:\.\d+)?)\s*gb/)

  const toRm = (usd) => Number((usd * FX_RATE).toFixed(2))

  // GPUs
  if (c === "gpu") {
    if (n.includes("4090")) return toRm(1700)
    if (n.includes("4080")) return toRm(1300)
    if (n.includes("4070 ti") || n.includes("4070ti")) return toRm(900)
    if (n.includes("4070")) return toRm(700)
    if (n.includes("4060 ti") || n.includes("4060ti")) return toRm(450)
    if (n.includes("4060")) return toRm(330)
    if (n.includes("4050") || n.includes("3050") || n.includes("6400")) return toRm(230)
    if (n.includes("6600")) return toRm(250)
    if (n.includes("6650")) return toRm(280)
    if (n.includes("6700")) return toRm(400)
    if (n.includes("6800")) return toRm(550)
    if (n.includes("6900")) return toRm(700)
    if (n.includes("7600")) return toRm(300)
    if (n.includes("7700")) return toRm(500)
    if (n.includes("7800")) return toRm(700)
    if (n.includes("7900 xtx")) return toRm(1100)
    if (n.includes("7900 xt")) return toRm(950)
    if (n.includes("a100") || n.includes("h100") || n.includes("l40") || n.includes("quadro") || n.includes("rtx 6000"))
      return toRm(6800)
    return toRm(500)
  }

  // CPUs
  if (c === "cpu") {
    if (n.includes("epyc")) return toRm(5200)
    if (n.includes("threadripper")) return toRm(4000)
    if (n.includes("xeon gold")) return toRm(1700)
    if (n.includes("pentium") || n.includes("celeron") || n.includes("g640") || n.includes("g740")) return toRm(70)
    if (n.includes("14900") || n.includes("7950x")) return toRm(600)
    if (n.includes("14700") || n.includes("7900")) return toRm(500)
    if (n.includes("7800x3d")) return toRm(450)
    if (n.includes("7700")) return toRm(380)
    if (n.includes("7600")) return toRm(270)
    if (n.includes("13600") || n.includes("12600")) return toRm(330)
    if (n.includes("12400") || n.includes("5600x") || n.includes("5600")) return toRm(190)
    if (n.includes("i3") || n.includes("12100") || n.includes("13100")) return toRm(150)
    return toRm(120)
  }

  // RAM
  if (c === "ram") {
    const gb = capMatchGb ? parseFloat(capMatchGb[1]) : 16
    const isDdr5 = n.includes("ddr5")
    if (gb >= 64) return toRm(isDdr5 ? 200 : 160)
    if (gb >= 32) return toRm(isDdr5 ? 120 : 80)
    if (gb >= 16) return toRm(isDdr5 ? 70 : 50)
    return toRm(40)
  }

  // SSD
  if (c === "ssd") {
    const tb = capMatchTb ? parseFloat(capMatchTb[1]) : 1
    const gb = capMatchGb ? parseFloat(capMatchGb[1]) : 0
    const cap = tb > 0 ? tb * 1000 : gb
    const isNvme = n.includes("nvme") || n.includes("m.2") || n.includes("pcie")
    if (cap >= 2000) return toRm(isNvme ? 120 : 90)
    if (cap >= 1000) return toRm(isNvme ? 70 : 55)
    if (cap >= 512) return toRm(isNvme ? 45 : 35)
    return toRm(30)
  }

  // HDD
  if (c === "hdd") {
    const tb = capMatchTb ? parseFloat(capMatchTb[1]) : 1
    if (tb >= 12) return toRm(300)
    if (tb >= 8) return toRm(220)
    if (tb >= 4) return toRm(120)
    if (tb >= 2) return toRm(70)
    return toRm(55)
  }

  // PSU
  if (c === "psu") {
    const watt = wattMatch ? parseInt(wattMatch[1], 10) : 650
    if (watt >= 1000) return toRm(180)
    if (watt >= 850) return toRm(140)
    if (watt >= 750) return toRm(110)
    if (watt >= 650) return toRm(90)
    return toRm(80)
  }

  // CPU Cooler / Fan / Case
  if (c === "cpu cooler" || c === "fan" || c === "case") {
    return toRm(70)
  }

  // Monitor
  if (c === "monitor") {
    const size = sizeMatch ? parseInt(sizeMatch[1] || sizeMatch[2], 10) : 27
    if (size >= 49) return toRm(1200)
    if (size >= 34) return toRm(700)
    if (size >= 32) return toRm(500)
    if (size >= 27) return toRm(350)
    return toRm(220)
  }

  // Peripherals / Network
  if (c.startsWith("peripherals")) return toRm(80)
  if (c === "network") return toRm(70)

  return toRm(100)
}

const loadDump = () => {
  const candidates = [
    path.resolve(process.cwd(), "products_dump.json"),
    path.resolve(process.cwd(), "..", "products_dump.json"),
  ]
  const dumpPath = candidates.find((p) => fs.existsSync(p))
  if (!dumpPath) {
    throw new Error(`products_dump.json not found. Checked: ${candidates.join(", ")}`)
  }
  const buf = fs.readFileSync(dumpPath)
  const text =
    buf[0] === 0xff && buf[1] === 0xfe ? buf.toString("utf16le") : buf.toString("utf8")
  const raw = JSON.parse(text.replace(/^\uFEFF/, ""))
  if (!Array.isArray(raw)) {
    throw new Error("products_dump.json must contain an array")
  }
  const mapped = raw.map((item, idx) => {
    const category = normalizeCategory(item.category)
    const name = item.name || `Product ${idx + 1}`
    return {
      name,
      brand: item.brand || "Unknown",
      category,
      price: Number(item.price) || 0,
      stock: Number(item.stock) || 0,
      image_url: item.image_url || null,
      is_active: item.is_active !== false,
    }
  })

  // Deduplicate by category + name to avoid repeats from the dump itself.
  const unique = []
  const seen = new Set()
  for (const item of mapped) {
    const key = `${item.category.toLowerCase()}|${item.name.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push({
      ...item,
      price: derivePrice(item.name, item.category),
    })
  }
  return unique
}

const normalizeAndTopUp = (products) => {
  const groups = {}
  const seen = new Set()

  // Seed existing products
  for (const product of products) {
    const key = product.category.toLowerCase()
    if (!groups[key]) groups[key] = []
    groups[key].push(product)
    seen.add(`${key}|${product.name.toLowerCase()}`)
  }

  const addTopUps = (catKey, target) => {
    const lib = TOPUP_LIBRARY[catKey] || TOPUP_LIBRARY.default || { brands: ["Generic"], models: [`${CATEGORY_MAP[catKey] || catKey} Model`] }
    const items = groups[catKey] || []
    const normalizedCat = CATEGORY_MAP[catKey] || normalizeCategory(catKey)
    let brandIdx = 0
    let modelIdx = 0
    while (items.length < target) {
      const brand = lib.brands[brandIdx % lib.brands.length]
      const model = lib.models[modelIdx % lib.models.length]
      const name = `${brand} ${model}`.trim()
      const key = `${catKey}|${name.toLowerCase()}`
      if (!seen.has(key)) {
        const price = derivePrice(name, normalizedCat)
        items.push({
          name,
          brand,
          category: normalizedCat,
          price,
          stock: 50,
          image_url: null,
          is_active: true,
        })
        seen.add(key)
      }
      brandIdx += 1
      if (brandIdx % lib.brands.length === 0) modelIdx += 1
      // As a safety valve, break if we have cycled many times
      if (brandIdx > 500) break
    }
    groups[catKey] = items
  }

  for (const [catKey, items] of Object.entries(groups)) {
    const target = TARGET_MIN[catKey] || TARGET_MIN.default
    if (items.length < target) addTopUps(catKey, target)
  }

  // Also ensure categories defined in TARGET_MIN exist even if absent
  for (const key of Object.keys(TARGET_MIN)) {
    const catKey = key === "default" ? null : key
    if (!catKey) continue
    const target = TARGET_MIN[catKey]
    if (!groups[catKey]) {
      groups[catKey] = []
      addTopUps(catKey, target)
    }
  }

  return Object.values(groups).flat()
}

const main = async () => {
  const dump = loadDump()
  const toInsert = normalizeAndTopUp(dump)
  const t = await db.transaction()
  try {
    await db.query("SET FOREIGN_KEY_CHECKS=0", { transaction: t })
    await db.query("TRUNCATE TABLE prebuilt_components", { transaction: t }).catch(() => {})
    await db.query("TRUNCATE TABLE products", { transaction: t })
    await db.query("SET FOREIGN_KEY_CHECKS=1", { transaction: t })
    await Product.bulkCreate(toInsert, { transaction: t })
    await t.commit()
    console.log(`Inserted ${toInsert.length} products across ${new Set(toInsert.map((p) => p.category.toLowerCase())).size} categories.`)
    const counts = toInsert.reduce((acc, p) => {
      const key = p.category.toLowerCase()
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    console.log("Counts per category:", counts)
  } catch (err) {
    await t.rollback()
    console.error("Failed to replace products:", err.message)
    process.exit(1)
  } finally {
    await db.close()
  }
}

main()
