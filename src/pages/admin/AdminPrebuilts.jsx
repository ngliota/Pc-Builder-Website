// admin/AdminPrebuilts.jsx
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"
const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-400 focus:border-cyan-400/60 focus:outline-none"
const formatRM = (value) => `RM ${(Number(value || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const categoryPriority = [
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "memory",
  "storage",
  "ssd",
  "hdd",
  "psu",
  "power supply",
  "cooler",
  "cpu cooler",
  "case",
  "case fan",
  "fan",
  "monitor",
  "keyboard",
  "mouse",
  "headset",
  "accessories",
]
const sortForDropdown = (list = []) =>
  [...list].sort((a, b) => {
    const priceDiff = (Number(b.price) || 0) - (Number(a.price) || 0)
    if (priceDiff !== 0) return priceDiff
    return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
  })

const AdminPrebuilts = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
  const [packageRows, setPackageRows] = useState([{ category: "", productId: "", item: "", quantity: 1 }])
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState("")
  const fileInputRef = useRef(null)
  const objectUrlRef = useRef(null)

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    image_url: "",
    specs: "",
    is_active: true,
  })

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (!token) navigate("/admin")
  }, [navigate])

  const fetchAll = async () => {
    setLoading(true)
    setError("")
    try {
      const [productsRes, prebuiltsRes] = await Promise.all([
        fetch(`${API_URL}/api/products?include_inactive=true&exclude_prebuilt=true`),
        fetch(`${API_URL}/api/prebuilts?include_inactive=true`),
      ])

      const productsData = await productsRes.json()
      const prebuiltsData = await prebuiltsRes.json()
      if (!productsRes.ok) throw new Error(productsData?.message || "Failed to fetch products")
      if (!prebuiltsRes.ok) throw new Error(prebuiltsData?.message || "Failed to fetch prebuilts")

      const productList = Array.isArray(productsData) ? productsData : []
      setAllProducts(productList)
      const categories = Array.from(new Set(productList.map((p) => p.category).filter(Boolean))).sort((a, b) => {
        const aKey = (a || "").toLowerCase()
        const bKey = (b || "").toLowerCase()
        const aRank = categoryPriority.indexOf(aKey)
        const bRank = categoryPriority.indexOf(bKey)
        if (aRank !== -1 || bRank !== -1) {
          return (aRank === -1 ? Infinity : aRank) - (bRank === -1 ? Infinity : bRank)
        }
        return a.localeCompare(b, undefined, { sensitivity: "base" })
      })
      setCategoryOptions(categories)
      setItems(Array.isArray(prebuiltsData) ? prebuiltsData : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const productsByCategory = useMemo(() => {
    const map = new Map()
    allProducts
      .filter((p) => (p.category || "").toLowerCase() !== "prebuilt")
      .forEach((product) => {
        const key = (product.category || "uncategorized").toLowerCase()
        const list = map.get(key) || []
        list.push(product)
        map.set(key, list)
      })
    map.forEach((list, key) => {
      map.set(key, sortForDropdown(list))
    })
    return map
  }, [allProducts])

  const packageTotal = useMemo(() => {
    return packageRows.reduce((sum, row) => {
      const product = allProducts.find((p) => String(p.id) === String(row.productId))
      const qty = Math.max(1, Number(row.quantity) || 1)
      if (!product) return sum
      return sum + Number(product.price || 0) * qty
    }, 0)
  }, [packageRows, allProducts])

  const addPackageRow = () => setPackageRows((rows) => [...rows, { category: "", productId: "", item: "", quantity: 1 }])

  const removePackageRow = (index) => setPackageRows((rows) => rows.filter((_, i) => i !== index))

  const handleCategoryChange = (index, value) =>
    setPackageRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, category: value, productId: "" } : row))
    )

  const handleProductSelect = (index, productId) =>
    setPackageRows((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row
        const selected = allProducts.find((p) => String(p.id) === String(productId))
        return {
          ...row,
          productId,
          category: row.category || selected?.category || "",
          item: row.item || selected?.name || "",
        }
      })
    )

  const handlePackageField = (index, field, value) =>
    setPackageRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))

  const startEdit = (prebuilt) => {
    setEditingId(prebuilt.id)
    setError("")
    setImagePreview(prebuilt.image_url || "")
    setForm({
      name: prebuilt.name || "",
      price: prebuilt.price === null || prebuilt.price === undefined ? "" : String(prebuilt.price),
      stock: prebuilt.stock === null || prebuilt.stock === undefined ? "" : String(prebuilt.stock),
      image_url: prebuilt.image_url || "",
      specs: prebuilt.specs ? JSON.stringify(prebuilt.specs, null, 2) : "",
      is_active: !!prebuilt.is_active,
    })
    const rows =
      (prebuilt.components || []).map((component) => {
        const product = component.product
        return {
          category: product?.category || "",
          productId: String(component.product_id || ""),
          item: product?.name || "",
          quantity: component.quantity || 1,
        }
      }) || []
    setPackageRows(rows.length ? rows : [{ category: "", productId: "", item: "", quantity: 1 }])
  }

  const deletePrebuilt = async (id) => {
    const token = localStorage.getItem("adminToken")
    if (!token) return navigate("/admin")
    setError("")
    try {
      const res = await fetch(`${API_URL}/api/prebuilts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Failed to delete prebuilt")
      if (editingId === id) {
        setEditingId(null)
        setForm({ name: "", price: "", stock: "", image_url: "", specs: "", is_active: true })
        setPackageRows([{ category: "", productId: "", item: "", quantity: 1 }])
        setImagePreview("")
      }
      fetchAll()
    } catch (e) {
      setError(e.message)
    }
  }

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }))
  }

  const clearPreviewUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    clearPreviewUrl()
    setError("")

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      setError("Only PNG or JPG images are allowed.")
      event.target.value = ""
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.")
      event.target.value = ""
      return
    }

    const localUrl = URL.createObjectURL(file)
    objectUrlRef.current = localUrl
    setImagePreview(localUrl)

    const token = localStorage.getItem("adminToken")
    if (!token) {
      navigate("/admin")
      return
    }

    const formData = new FormData()
    formData.append("image", file)

    try {
      setUploading(true)
      const res = await fetch(`${API_URL}/api/uploads/product-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      const tokenError =
        res.status === 401 ||
        res.status === 403 ||
        /token/i.test(String(data?.message || data?.error || ""))

      if (!res.ok) {
        if (tokenError) {
          localStorage.removeItem("adminToken")
          navigate("/admin")
          throw new Error("Session expired. Please log in again.")
        }
        throw new Error(data?.message || data?.error || "Image upload failed")
      }

      clearPreviewUrl()
      setImagePreview(data.url || `${API_URL}${data.path}`)
      setForm((prev) => ({ ...prev, image_url: data.url || `${API_URL}${data.path}` }))
    } catch (err) {
      setImagePreview("")
      setForm((prev) => ({ ...prev, image_url: "" }))
      setError(err.message)
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  const addPrebuilt = async (e) => {
    e.preventDefault()
    setError("")
    const token = localStorage.getItem("adminToken")
    if (!token) return navigate("/admin")
    try {
      const packageSpecs = packageRows
        .filter((row) => row.category || row.productId || row.item)
        .map((row) => {
          const product = allProducts.find((p) => String(p.id) === String(row.productId))
          const qty = Math.max(1, Number(row.quantity) || 1)
          return {
            category: row.category || product?.category || "Uncategorized",
            name: row.item || product?.name || "",
            product_id: row.productId ? Number(row.productId) : undefined,
            quantity: qty,
          }
        })

      let specs = undefined
      if (form.specs.trim()) {
        try {
          specs = JSON.parse(form.specs)
        } catch {
          throw new Error("Specs must be valid JSON")
        }
      }
      if (packageSpecs.length) {
        const base = specs && typeof specs === "object" && !Array.isArray(specs) ? { ...specs } : {}
        base.package = packageSpecs
        specs = base
      }

      const components = packageSpecs
        .filter((item) => item.product_id)
        .map((item) => ({ product_id: item.product_id, quantity: item.quantity }))

      if (!components.length) throw new Error("Please select at least one catalog product for this prebuilt.")

      const payload = {
        name: form.name,
        price: form.price === "" ? 0 : Number(form.price),
        stock: form.stock === "" ? 0 : Number(form.stock),
        image_url: form.image_url || imagePreview || undefined,
        is_active: !!form.is_active,
        specs,
        components,
      }

      const res = await fetch(`${API_URL}/api/prebuilts${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || `Failed to ${editingId ? "update" : "create"} prebuilt`)
      setForm({ name: "", price: "", stock: "", image_url: "", specs: "", is_active: true })
      setPackageRows([{ category: "", productId: "", item: "", quantity: 1 }])
      setImagePreview("")
      setEditingId(null)
      clearPreviewUrl()
      fetchAll()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030617] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(circle at 80% 10%, rgba(236,72,153,0.18), transparent 40%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.12), transparent 45%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "140px 140px",
        }}
      />

      <div className="relative z-10 w-full space-y-8 px-6 py-10 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/80">Prebuilt Line</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Custom Builds</h1>
            <p className="text-sm text-slate-300">Publish curated rigs with photos, pricing, and specs.</p>
          </div>
          <a
            href="/admin/products/new"
            className="rounded-lg border border-cyan-300/50 bg-cyan-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-50 transition hover:border-cyan-300 hover:bg-cyan-500/30"
          >
            Advanced Editor
          </a>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={addPrebuilt} className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur md:grid-cols-2">
          <div className="md:col-span-2 flex items-center justify-between">
            <input name="name" value={form.name} onChange={onChange} placeholder="Prebuilt Name *" required className={`${inputClass} md:col-span-2`} />
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm({ name: "", price: "", stock: "", image_url: "", specs: "", is_active: true })
                  setPackageRows([{ category: "", productId: "", item: "", quantity: 1 }])
                  setImagePreview("")
                  clearPreviewUrl()
                }}
                className="ml-3 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-100 transition hover:border-rose-300 hover:bg-rose-500/10"
              >
                Cancel Edit
              </button>
            )}
          </div>
          <input name="price" value={form.price} onChange={onChange} placeholder="Price" type="number" step="0.01" className={inputClass} />
          <input name="stock" value={form.stock} onChange={onChange} placeholder="Stock" type="number" className={inputClass} />

          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Hero Image</p>
            <div
              className="relative mt-2 flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-black/20 text-center transition hover:border-cyan-400 hover:bg-black/30"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview || form.image_url ? (
                <img src={imagePreview || form.image_url} alt="Preview" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <span className="text-3xl text-white/70">+</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                    Click or drop PNG/JPG
                    <br />
                    <span className="text-xs text-slate-500">Max 5MB</span>
                  </p>
                </>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 text-white">Uploading...</div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="md:col-span-2 rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Package contents</p>
                <p className="text-sm text-slate-300">Use your product categories to assemble the bundle.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Live catalog price shown for reference. Final prebuilt price still uses the manual field above.
                </p>
              </div>
              <button
                type="button"
                onClick={addPackageRow}
                className="rounded-lg border border-cyan-300/50 bg-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-50 transition hover:border-cyan-300 hover:bg-cyan-500/30"
              >
                Add line
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {packageRows.map((row, idx) => {
                const productOptions =
                  row.category && productsByCategory.size
                    ? productsByCategory.get(row.category.toLowerCase()) || []
                    : sortForDropdown(allProducts.filter((p) => (p.category || "").toLowerCase() !== "prebuilt"))
                return (
                  <div key={`package-${idx}`} className="grid grid-cols-1 gap-3 md:grid-cols-7">
                    <select
                      value={row.category}
                      onChange={(e) => handleCategoryChange(idx, e.target.value)}
                      className={`${inputClass} md:col-span-2 dark-select`}
                    >
                      <option value="">Select category</option>
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <select
                      value={row.productId}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className={`${inputClass} md:col-span-2 dark-select`}
                    >
                      <option value="">Pick product (optional)</option>
                      {productOptions.map((product) => (
                        <option key={product.id} value={product.id}>
                          {`${product.name} - ${formatRM(product.price)}`}
                        </option>
                      ))}
                    </select>
                    <input
                      value={row.item}
                      onChange={(e) => handlePackageField(idx, "item", e.target.value)}
                      placeholder="Custom label / notes"
                      className={`${inputClass} md:col-span-2`}
                    />
                    <div className="flex items-center gap-2 md:col-span-1">
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => handlePackageField(idx, "quantity", e.target.value)}
                        className={`${inputClass}`}
                      />
                      {packageRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePackageRow(idx)}
                          className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-100 transition hover:border-rose-300 hover:bg-rose-500/10"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              {!packageRows.length && (
                <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-300">
                  No package lines. Add one to outline what this build includes.
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm">
              <span className="text-slate-300">Reference total (catalog):</span>
              <span className="font-semibold text-cyan-200">{formatRM(packageTotal)}</span>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Categories and products are pulled from your main catalog (excluding prebuilts). Leave a product blank to enter a
              custom item.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={onChange}
              className="h-4 w-4 rounded border-white/20 bg-black/40 text-cyan-400 focus:ring-cyan-400"
            />
            Active listing
          </label>
          <textarea
            name="specs"
            value={form.specs}
            onChange={onChange}
            placeholder='Extra specs JSON (optional). Package items will be stored automatically.'
            className={`h-24 md:col-span-2 ${inputClass}`}
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full rounded-lg border border-cyan-300/50 bg-cyan-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-50 transition hover:border-cyan-300 hover:bg-cyan-500/30"
            >
              {editingId ? "Update Prebuilt" : "Add Prebuilt"}
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold text-white">Current Prebuilts</h3>
          {loading ? (
            <div className="mt-4 text-sm text-slate-300">Loading...</div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((p) => (
                <div key={p.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-lg bg-black/40">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="text-sm text-slate-500">No image</div>
                    )}
                  </div>
                  <div className="font-semibold text-white">{p.name}</div>
                  <div className="text-sm text-slate-300">{formatRM(p.price)}</div>
                  <div className="text-xs text-slate-500">Stock: {p.stock ?? "-"}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <a href={`/prebuild/${p.id}`} className="text-cyan-300 underline-offset-2 hover:underline">
                      View
                    </a>
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="rounded border border-white/15 px-2 py-1 text-xs text-white transition hover:border-cyan-300 hover:text-cyan-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePrebuilt(p.id)}
                      className="rounded border border-white/15 px-2 py-1 text-xs text-rose-200 transition hover:border-rose-300 hover:text-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="text-slate-400">No prebuilts yet</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPrebuilts
