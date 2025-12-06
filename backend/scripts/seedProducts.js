// backend/scripts/seedProducts.js
import Product from "../models/productModel.js"
import db from "../config/database.js"

const seedItems = [
  // CPUs
  { name: "AMD Ryzen 5 5600", brand: "AMD", category: "cpu", price: 650, stock: 20 },
  { name: "AMD Ryzen 7 5800X3D", brand: "AMD", category: "cpu", price: 1599, stock: 15 },
  { name: "AMD Ryzen 5 7600", brand: "AMD", category: "cpu", price: 999, stock: 20 },
  { name: "Intel Core i5-12400F", brand: "Intel", category: "cpu", price: 729, stock: 20 },
  { name: "Intel Core i5-13600K", brand: "Intel", category: "cpu", price: 1350, stock: 15 },
  { name: "Intel Core i7-13700K", brand: "Intel", category: "cpu", price: 1799, stock: 10 },

  // GPUs
  { name: "NVIDIA RTX 4060 8GB", brand: "NVIDIA", category: "gpu", price: 1450, stock: 18 },
  { name: "NVIDIA RTX 4070 12GB", brand: "NVIDIA", category: "gpu", price: 2499, stock: 12 },
  { name: "NVIDIA RTX 4080 16GB", brand: "NVIDIA", category: "gpu", price: 4799, stock: 6 },
  { name: "AMD Radeon RX 6600 8GB", brand: "AMD", category: "gpu", price: 1150, stock: 16 },
  { name: "AMD Radeon RX 7800 XT 16GB", brand: "AMD", category: "gpu", price: 2699, stock: 10 },

  // Motherboards
  { name: "MSI B550 Tomahawk", brand: "MSI", category: "motherboard", price: 699, stock: 18 },
  { name: "ASUS TUF B650-Plus WiFi", brand: "ASUS", category: "motherboard", price: 999, stock: 14 },
  { name: "Gigabyte B660M DS3H AX", brand: "Gigabyte", category: "motherboard", price: 689, stock: 20 },
  { name: "ASUS ROG Strix Z790-A", brand: "ASUS", category: "motherboard", price: 1899, stock: 8 },

  // RAM
  { name: "Corsair Vengeance 16GB (2x8) DDR4-3200", brand: "Corsair", category: "ram", price: 299, stock: 25 },
  { name: "G.Skill Trident Z 32GB (2x16) DDR4-3600", brand: "G.Skill", category: "ram", price: 499, stock: 20 },
  { name: "Kingston Fury Beast 32GB (2x16) DDR5-5600", brand: "Kingston", category: "ram", price: 699, stock: 18 },

  // Storage
  { name: "Samsung 970 EVO Plus 1TB NVMe", brand: "Samsung", category: "storage", price: 369, stock: 30 },
  { name: "WD Black SN770 2TB NVMe", brand: "Western Digital", category: "storage", price: 699, stock: 20 },
  { name: "Kingston KC3000 2TB NVMe", brand: "Kingston", category: "storage", price: 749, stock: 18 },
  { name: "Crucial MX500 1TB SATA SSD", brand: "Crucial", category: "storage", price: 289, stock: 22 },

  // PSUs
  { name: "Corsair CX650M 650W 80+ Bronze", brand: "Corsair", category: "psu", price: 329, stock: 20 },
  { name: "Seasonic Focus 750W 80+ Gold", brand: "Seasonic", category: "psu", price: 539, stock: 16 },
  { name: "Cooler Master V850 850W 80+ Gold", brand: "Cooler Master", category: "psu", price: 659, stock: 14 },

  // Cases
  { name: "NZXT H510 Flow (Black)", brand: "NZXT", category: "case", price: 329, stock: 18 },
  { name: "Lian Li Lancool II Mesh RGB", brand: "Lian Li", category: "case", price: 459, stock: 16 },
  { name: "Fractal Design Meshify 2", brand: "Fractal", category: "case", price: 599, stock: 12 },

  // Coolers
  { name: "be quiet! Pure Rock 2", brand: "be quiet!", category: "cooler", price: 189, stock: 20 },
  { name: "Noctua NH-D15", brand: "Noctua", category: "cooler", price: 469, stock: 10 },
  { name: "Deepcool LT720 360mm AIO", brand: "Deepcool", category: "cooler", price: 699, stock: 12 },
]

const seed = async () => {
  try {
    const inserted = []
    for (const item of seedItems) {
      const existing = await Product.findOne({ where: { name: item.name, category: item.category } })
      if (existing) {
        await existing.update(item)
        inserted.push({ name: item.name, action: "updated" })
      } else {
        await Product.create(item)
        inserted.push({ name: item.name, action: "created" })
      }
    }
    console.table(inserted)
    console.log(`Seed complete: ${inserted.length} products processed`)
  } catch (err) {
    console.error("Seed failed:", err.message)
  } finally {
    await db.close()
  }
}

seed()
