// backend/scripts/cleanSyntheticProducts.js
// Removes synthetic variants inserted by the wide seed (names ending with suffix + number)
import Product from "../models/productModel.js"
import db from "../config/database.js"

const suffixes = [" SE", " Plus", " Edge", " Prime", " Carbon", " Ultra", " Elite", " Phantom", " Striker", " Nova"]
const suffixPattern = new RegExp(`(${suffixes.map((s) => s.trim()).join("|")})\\s+\\d+$`, "i")
const categories = ["CPU", "GPU", "RAM", "Motherboard"]

const run = async () => {
  try {
    const deleted = []
    for (const category of categories) {
      const items = await Product.findAll({ where: { category } })
      for (const item of items) {
        const name = item.name || ""
        if (suffixPattern.test(name)) {
          await item.destroy()
          deleted.push(name)
        }
      }
    }
    console.log(`Deleted ${deleted.length} synthetic products.`)
    if (deleted.length) {
      console.log("Examples:", deleted.slice(0, 10))
    }
  } catch (err) {
    console.error("Cleanup failed:", err.message)
  } finally {
    await db.close()
  }
}

run()
