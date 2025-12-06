import { Op } from "sequelize"
import Product from "../models/productModel.js"

const formatRM = (value) =>
  `RM ${(Number(value ?? 0)).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`

const peripheralWords = ["headset", "keyboard", "mouse", "speaker", "accessory", "peripheral", "mousepad", "webcam"]

const classifyProduct = (item = {}) => {
  const category = (item.category || "").toLowerCase().trim()
  const name = (item.name || "").toLowerCase()
  const tags = `${category} ${name}`
  const match = (needle) => tags.includes(needle)

  if (category.includes("peripherals") || category.includes("prebuilt")) return null
  if (peripheralWords.some((w) => match(w))) return null

  if (category.includes("cpu cooler") || category.includes("cooler") || match("cooler") || match("aio")) return "cooler"
  if (category === "fan") return "fan"

  const isGpuCategory = ["gpu", "graphics card", "vga"].some((w) => category.includes(w))
  const isGpuName = ["rtx", "gtx", "rx ", "rx-", "arc "].some((w) => match(w))
  if (isGpuCategory || isGpuName) return "gpu"

  const isCpuCategory = category.includes("cpu") || category.includes("processor")
  const isCpuName = ["ryzen", "intel core", " i3", " i5", " i7", " i9"].some((w) => match(w))
  if (isCpuCategory || isCpuName) return "cpu"

  if (
    category.includes("motherboard") ||
    match("b550") ||
    match("b650") ||
    match("x570") ||
    match("z690") ||
    match("b660") ||
    match("b760") ||
    match("z790") ||
    match("am4") ||
    match("am5") ||
    match("lga1700")
  ) {
    return "motherboard"
  }

  if (category.includes("ram") || category.includes("memory") || match("ddr4") || match("ddr5")) return "ram"
  if (category.includes("ssd") || match("nvme")) return "ssd"
  if (category.includes("hdd")) return "hdd"
  if (category.includes("storage")) return "ssd"
  if (category.includes("psu") || category.includes("power supply") || match("watt")) return "psu"
  if (category.includes("case")) return "case"

  return null
}

const detectCpuSocket = (name = "") => {
  const v = name.toLowerCase()
  if (v.includes("am5") || /7[0-9]{3}/.test(v)) return "am5"
  if (v.includes("am4") || v.includes("5600") || v.includes("5800") || v.includes("5900") || v.includes("5950")) return "am4"
  if (
    v.includes("lga1700") ||
    v.includes("12400") ||
    v.includes("13400") ||
    v.includes("13600") ||
    v.includes("13700") ||
    v.includes("13900") ||
    v.includes("14900") ||
    v.includes("i3") ||
    v.includes("i5") ||
    v.includes("i7") ||
    v.includes("i9")
  )
    return "lga1700"
  if (v.includes("lga1200") || v.includes("10400") || v.includes("10700") || v.includes("10900") || v.includes("11400") || v.includes("11700") || v.includes("11900")) return "lga1200"
  return null
}

const detectBoardSocket = (name = "", category = "") => {
  const v = `${name} ${category}`.toLowerCase()
  if (v.includes("am5") || v.includes("b650") || v.includes("x670")) return "am5"
  if (v.includes("am4") || v.includes("b550") || v.includes("x570") || v.includes("b450") || v.includes("x470") || v.includes("x370")) return "am4"
  if (v.includes("lga1700") || v.includes("b660") || v.includes("b760") || v.includes("z690") || v.includes("z790") || v.includes("h610") || v.includes("h670")) return "lga1700"
  if (v.includes("lga1200") || v.includes("b460") || v.includes("z490") || v.includes("h510") || v.includes("b560") || v.includes("z590")) return "lga1200"
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

const pickBest = (list, ceiling) => {
  if (!Array.isArray(list) || !list.length) return null
  const under = list.filter((p) => Number(p.price || 0) <= ceiling)
  if (under.length) return under[under.length - 1]
  return list[0] // fallback to cheapest if nothing fits ceiling
}

const pickMax = (list) => {
  if (!Array.isArray(list) || !list.length) return null
  return list.reduce((a, b) => (Number(a?.price || 0) >= Number(b?.price || 0) ? a : b))
}

const isSSD = (item = {}) => {
  const tags = `${item.category || ""} ${item.name || ""}`.toLowerCase()
  return tags.includes("ssd") || tags.includes("nvme")
}

const isHDD = (item = {}) => {
  const tags = `${item.category || ""} ${item.name || ""}`.toLowerCase()
  return tags.includes("hdd")
}

const LLM_ENABLED = process.env.RECS_USE_LLM === "true"
const LLM_ENDPOINT = process.env.LLM_ENDPOINT || "http://localhost:11434/api/generate"
const LLM_MODEL = process.env.LLM_MODEL || "llama3"

export const recommendBuild = async (req, res) => {
  try {
    const useCase = (req.body.useCase || "gaming").toLowerCase()
    const resolution = (req.body.resolution || "1440p").toLowerCase()
    const budgetMin = Number(req.body.budgetMin || 0)
    const budgetMax = Number(req.body.budgetMax || 0)
    const targetBudget = budgetMin && budgetMax ? (budgetMin + budgetMax) / 2 : budgetMax || budgetMin || 0

    const products = await Product.findAll({
      where: {
        is_active: true,
        category: { [Op.ne]: "prebuilt" },
      },
    })

    const grouped = {
      cpu: [],
      gpu: [],
      motherboard: [],
      ram: [],
      ssd: [],
      hdd: [],
      psu: [],
      case: [],
      cooler: [],
      fan: [],
    }

    products.forEach((p) => {
      if (!p || p.price === null || p.price === undefined) return
      const key = classifyProduct(p)
      if (!key) return
      const list = grouped[key] || []
      list.push(p)
      grouped[key] = list
    })

    Object.keys(grouped).forEach((key) => {
      grouped[key] = grouped[key].sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    })

    const pickCompatibleBoard = (socket, ceiling) => {
      const boards = grouped.motherboard.filter((b) => {
        const s = detectBoardSocket(b.name, b.category)
        return socket ? s === socket : true
      })
      return pickBest(boards.length ? boards : grouped.motherboard, ceiling)
    }

    const pickStorageSsd = (budgetCeiling) => {
      const ssds = grouped.ssd
      const primaryList = ssds.length ? ssds : []
      const filtered = primaryList.filter((p) => Number(p.price || 0) <= budgetCeiling)
      if (filtered.length) return filtered[filtered.length - 1]
      if (ssds.length) return ssds[0]
      // Fallback to cheapest HDD if no SSD exists at all
      if (grouped.hdd.length) return grouped.hdd[0]
      return null
    }

    const pickStorageHdd = (budgetCeiling) => {
      const hdds = grouped.hdd
      const filtered = hdds.filter((p) => Number(p.price || 0) <= budgetCeiling)
      if (filtered.length) return filtered[filtered.length - 1]
      return hdds.length ? hdds[0] : null
    }

    const pickGpu = (budgetCeiling) => {
      const desiredTiers = (() => {
        if (resolution === "4k") return ["4k-high", "extreme", "1440p-high", "1440p-mid"]
        if (resolution === "1440p") return ["1440p-high", "1440p-mid", "1080p-high", "entry"]
        return ["1080p-high", "entry"]
      })()
      const scored = grouped.gpu.map((g) => ({
        item: g,
        tier: detectGpuTier(g.name),
        price: Number(g.price || 0),
      }))
      const withinBudget = scored.filter((s) => s.price <= budgetCeiling)
      let pool = withinBudget.length ? withinBudget : scored

      // If the budget is high, prefer the most expensive card within ceiling
      if (budgetCeiling >= 3000 || targetBudget >= 8000) {
        const maxUnder = pool.sort((a, b) => a.price - b.price).filter((s) => s.price <= budgetCeiling)
        if (maxUnder.length) return maxUnder[maxUnder.length - 1].item
      }

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
      const scored = grouped.cpu.map((c) => ({
        item: c,
        socket: detectCpuSocket(c.name),
        price: Number(c.price || 0),
      }))
      const withinBudget = scored.filter((s) => s.price <= budgetCeiling)
      const pool = withinBudget.length ? withinBudget : scored

      // High budget: pick the highest-priced CPU within ceiling for gaming/content
      if (budgetCeiling >= 2000 || targetBudget >= 8000) {
        const sorted = pool.sort((a, b) => a.price - b.price)
        if (sorted.length) return sorted[sorted.length - 1].item
      }

      const heavy = pool.filter((s) => /i7|i9|ryzen 7|ryzen 9|5800x|13700/i.test(s.item.name))
      if (useCase === "content" && heavy.length) return heavy.sort((a, b) => a.price - b.price)[heavy.length - 1].item
      const mid = pool.filter((s) => /i5|ryzen 5|5600|12400|13400/i.test(s.item.name))
      if (mid.length) return mid.sort((a, b) => a.price - b.price)[mid.length - 1].item
      if (pool.length) return pool.sort((a, b) => a.price - b.price)[pool.length - 1].item
      return null
    }

    if (!grouped.cpu.length || !grouped.gpu.length) {
      return res.status(400).json({ message: "Not enough component data to recommend." })
    }

    const allocations = (() => {
      // Separate budgets: ssd + optional hdd + fan
      const gaming = { cpu: 0.25, gpu: 0.5, ram: 0.1, ssd: 0.06, hdd: 0, motherboard: 0.04, psu: 0.03, case: 0.015, cooler: 0.015, fan: 0.01 }
      const content = { cpu: 0.28, gpu: 0.22, ram: 0.15, ssd: 0.1, hdd: 0.03, motherboard: 0.1, psu: 0.05, case: 0.015, cooler: 0.015, fan: 0.01 }
      const office = { cpu: 0.22, gpu: 0.15, ram: 0.12, ssd: 0.06, hdd: 0.05, motherboard: 0.1, psu: 0.05, case: 0.02, cooler: 0.02, fan: 0.03 }
      let base = gaming
      if (useCase === "content") base = content
      if (useCase === "office") base = office
      if (useCase === "mixed") base = { ...gaming, hdd: 0.02, ssd: 0.08 }
      // Resolution nudge: more GPU for 4K, less for 1080p
      if (resolution === "4k") base = { ...base, gpu: base.gpu + 0.05, cpu: base.cpu - 0.02 }
      if (resolution === "1080p") base = { ...base, gpu: base.gpu - 0.03, cpu: base.cpu + 0.01 }
      return base
    })()

    const cpuPick = pickCpu(targetBudget * allocations.cpu)
    const socket = detectCpuSocket(cpuPick?.name)

    const ruleRec = {
      cpu: cpuPick,
      gpu: pickGpu(targetBudget * allocations.gpu),
      ram: pickBest(grouped.ram, targetBudget * allocations.ram),
      ssd: pickStorageSsd(targetBudget * allocations.ssd),
      hdd: null, // decide later based on remaining budget/useCase
      psu: pickBest(grouped.psu, targetBudget * allocations.psu),
      motherboard: pickCompatibleBoard(socket, targetBudget * allocations.motherboard),
      case: pickBest(grouped.case, targetBudget * allocations.case),
      cooler: pickBest(grouped.cooler, targetBudget * allocations.cooler),
      fan: pickBest(grouped.fan, targetBudget * allocations.fan),
    }

    // Decide HDD only if budget and useCase allow
    const preliminaryTotal = Object.entries(ruleRec).reduce((sum, [, val]) => sum + Number(val?.price || 0), 0)
    const remaining = targetBudget ? targetBudget - preliminaryTotal : 0
    const allowHdd = useCase === "content" || useCase === "office" || useCase === "mixed" || useCase === "gaming"
    if (allowHdd && remaining > targetBudget * allocations.hdd * 0.6) {
      ruleRec.hdd = pickStorageHdd(targetBudget * allocations.hdd)
    }

    const parts = Object.fromEntries(
      Object.entries(ruleRec).map(([key, value]) => [
        key,
        value ? { id: value.id, name: value.name, price: Number(value.price || 0), category: value.category } : null,
      ])
    )

    const labelMap = {
      cpu: "CPU",
      gpu: "GPU",
      motherboard: "Motherboard",
      ram: "RAM",
      ssd: "SSD",
      hdd: "HDD",
      psu: "PSU",
      case: "Case",
      cooler: "CPU Cooler",
      fan: "Case Fan",
    }

    const display = Object.fromEntries(
      Object.entries(parts).map(([key, value]) => [
        key,
        value ? `${value.name} (${formatRM(value.price)})` : `${labelMap[key] || key} not found`,
      ])
    )

    const totalRule = Object.values(parts).reduce((sum, value) => sum + Number(value?.price || 0), 0)

    // Alternative "high" pick to avoid under-spending but stay within category ceilings
    const highRec = {
      cpu: pickBest(grouped.cpu, targetBudget * allocations.cpu),
      gpu: pickBest(grouped.gpu, targetBudget * allocations.gpu),
      ram: pickBest(grouped.ram, targetBudget * allocations.ram),
      ssd: pickStorageSsd(targetBudget * allocations.ssd),
      hdd: null,
      psu: pickBest(grouped.psu, targetBudget * allocations.psu),
      motherboard: pickBest(grouped.motherboard, targetBudget * allocations.motherboard),
      case: pickBest(grouped.case, targetBudget * allocations.case),
      cooler: pickBest(grouped.cooler, targetBudget * allocations.cooler),
      fan: pickBest(grouped.fan, targetBudget * allocations.fan),
    }
    // Decide HDD for highRec if budget allows and use-case permits
    const highPrelimTotal = Object.entries(highRec).reduce((sum, [, val]) => sum + Number(val?.price || 0), 0)
    const highRemaining = targetBudget ? targetBudget - highPrelimTotal : 0
    const allowHddHigh = allowHdd
    if (allowHddHigh && highRemaining > targetBudget * allocations.hdd * 0.6) {
      highRec.hdd = pickStorageHdd(targetBudget * allocations.hdd)
    }

    const highParts = Object.fromEntries(
      Object.entries(highRec).map(([key, value]) => [
        key,
        value ? { id: value.id, name: value.name, price: Number(value.price || 0), category: value.category } : null,
      ])
    )
    const totalHigh = Object.values(highParts).reduce((sum, value) => sum + Number(value?.price || 0), 0)

    // === Optional LLM assist ===
    const llmTry = async () => {
      if (!LLM_ENABLED) return null
      try {
        const topN = 12
        const candidates = Object.fromEntries(
          Object.entries(grouped).map(([key, list]) => [
            key,
            list
              .slice(0, topN)
              .map((p) => ({
                id: p.id,
                name: p.name,
                price: Number(p.price || 0),
                category: p.category,
              })),
          ])
        )

        const prompt = [
          "You are a PC part selector.",
          `User: useCase=${useCase}, resolution=${resolution}, budgetMin=${budgetMin}, budgetMax=${budgetMax}, targetBudget=${targetBudget}`,
          "Pick one ID per category: cpu, gpu, motherboard, ram, ssd, hdd (optional), psu, case, cooler, fan (optional).",
          "Rules:",
          "- CPU and motherboard sockets must match (AM4/AM5/LGA1700).",
          "- Keep total near the target budget; prefer value if over.",
          "- Prefer GPUs suited to the resolution (4k > 1440p > 1080p tiers).",
          "- Gaming/content: prefer SSD; add HDD only if budget allows (office/mixed can use HDD if budget remains).",
          "- Output ONLY JSON: {\"cpu_id\":number,\"gpu_id\":number,\"motherboard_id\":number,\"ram_id\":number,\"ssd_id\":number,\"hdd_id\":number|null,\"psu_id\":number,\"case_id\":number,\"cooler_id\":number,\"fan_id\":number|null}",
          "Candidates (ids/names/prices/categories):",
          JSON.stringify(candidates),
        ].join("\n")

        const resp = await fetch(LLM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: LLM_MODEL,
            prompt,
            stream: false,
            temperature: 0,
          }),
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data?.error || "LLM request failed")

        // Ollama returns { response: "...json..." }
        const rawText = data?.response || ""
        const match = rawText.match(/\{[\s\S]*\}/)
        if (!match) throw new Error("No JSON in LLM response")
        const parsed = JSON.parse(match[0])
        return parsed
      } catch (e) {
        console.error("LLM assist failed:", e.message)
        return null
      }
    }

    const validatePick = (ids) => {
      if (!ids) return null
      const getById = (id) => {
        const all = Object.values(grouped).flat()
        return all.find((p) => String(p.id) === String(id))
      }

      const cpu = getById(ids.cpu_id)
      const gpu = getById(ids.gpu_id)
      const motherboard = getById(ids.motherboard_id)
      const ram = getById(ids.ram_id)
      const ssd = getById(ids.ssd_id)
      const hdd = ids.hdd_id ? getById(ids.hdd_id) : null
      const psu = getById(ids.psu_id)
      const pcCase = getById(ids.case_id)
      const cooler = getById(ids.cooler_id)
      const fan = ids.fan_id ? getById(ids.fan_id) : null

      if (!cpu || !gpu || !motherboard || !ssd || !psu || !pcCase || !cooler) return null

      // Socket check
      const cpuSocket = detectCpuSocket(cpu.name)
      const boardSocket = detectBoardSocket(motherboard.name, motherboard.category)
      if (cpuSocket && boardSocket && cpuSocket !== boardSocket) return null

      const selected = { cpu, gpu, motherboard, ram, ssd, hdd, psu, case: pcCase, cooler, fan }
      const totalPrice = Object.values(selected).reduce((sum, v) => sum + Number(v?.price || 0), 0)
      if (targetBudget && totalPrice < targetBudget * 0.9) return null
      if (targetBudget && totalPrice > targetBudget * 1.15) return null

      return selected
    }

    let finalParts = parts
    let finalDisplay = display
    let finalTotal = totalRule
    let finalSource = "rule-based"

    const llmPick = await llmTry()
    const validated = validatePick(llmPick)
    if (validated) {
      finalParts = Object.fromEntries(
        Object.entries(validated).map(([key, value]) => [
          key,
          value ? { id: value.id, name: value.name, price: Number(value.price || 0), category: value.category } : null,
        ])
      )
      finalDisplay = Object.fromEntries(
        Object.entries(finalParts).map(([key, value]) => [
          key,
          value ? `${value.name} (${formatRM(value.price)})` : `${key} not found`,
        ])
      )
      finalTotal = Object.values(finalParts).reduce((sum, value) => sum + Number(value?.price || 0), 0)
      finalSource = "llm+rules"
    } else {
      // If rule-based is far under budget and highRec is closer, prefer highRec
      if (targetBudget && totalHigh && totalRule < targetBudget * 0.9) {
        const ruleDiff = Math.abs(targetBudget - totalRule)
        const highDiff = Math.abs(targetBudget - totalHigh)
        if (highDiff < ruleDiff) {
          finalParts = highParts
          finalDisplay = Object.fromEntries(
            Object.entries(finalParts).map(([key, value]) => [
              key,
              value ? `${value.name} (${formatRM(value.price)})` : `${key} not found`,
            ])
          )
          finalTotal = totalHigh
        }
      }
    }

    res.json({
      useCase,
      resolution,
      budgetMin,
      budgetMax,
      targetBudget,
      parts: finalParts,
      display: finalDisplay,
      total: finalTotal,
      source: finalSource,
    })
  } catch (e) {
    console.error("recommendBuild error:", e)
    res.status(500).json({ message: "Failed to compute recommendation" })
  }
}

