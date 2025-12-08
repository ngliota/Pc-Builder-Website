// backend/scripts/importDumpIfNew.js
// Adds products from products_dump.json only if they don't already exist (match by name, case-insensitive).

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

const normalizeCategory = (raw) => {
  const key = String(raw || "Misc").trim()
  const lower = key.toLowerCase()
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower]
  return key
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

const loadDump = () => {
  const candidates = [
    path.resolve(process.cwd(), "products_dump.json"),
    path.resolve(process.cwd(), "..", "products_dump.json"),
  ]
  const dumpPath = candidates.find((p) => fs.existsSync(p))
  if (!dumpPath) throw new Error(`products_dump.json not found. Checked: ${candidates.join(", ")}`)

  const buf = fs.readFileSync(dumpPath)
  const text = buf[0] === 0xff && buf[1] === 0xfe ? buf.toString("utf16le") : buf.toString("utf8")
  const raw = JSON.parse(text.replace(/^\uFEFF/, ""))
  if (!Array.isArray(raw)) throw new Error("products_dump.json must contain an array")

  const seen = new Set()
  return raw
    .map((item, idx) => {
      const name = String(item.name || `Product ${idx + 1}`).trim()
      const category = normalizeCategory(item.category)
      const key = name.toLowerCase()
      if (seen.has(key)) return null
      seen.add(key)
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
    .filter(Boolean)
}

const main = async () => {
  const dumpItems = loadDump()
  let created = 0
  let skipped = 0
  try {
    for (const item of dumpItems) {
      const existing = await Product.findOne({ where: { name: item.name } })
      if (existing) {
        skipped += 1
        continue
      }
      await Product.create(item)
      created += 1
    }
    console.log(`Import complete. Created: ${created}, Skipped (existing): ${skipped}`)
  } catch (err) {
    console.error("Import failed:", err)
    process.exit(1)
  } finally {
    await db.close()
  }
}

main()
