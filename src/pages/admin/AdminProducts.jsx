// admin/AdminProducts.jsx
import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-400 focus:border-cyan-400/60 focus:outline-none"

const AdminProducts = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [editingId, setEditingId] = useState(null)
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "",
    price: "",
    stock: "",
    is_active: true,
  })

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (!token) navigate("/admin")
  }, [navigate])

  const fetchProducts = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/api/products?include_inactive=true`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Failed to fetch products")
      setProducts(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = useMemo(() => {
    const set = new Set()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [products])

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const filtered = products.filter((product) => {
      const matchesCategory = categoryFilter === "all" || (product.category || "").toLowerCase() === categoryFilter.toLowerCase()
      const matchesTerm =
        !term ||
        [product.name, product.brand, product.category]
          .filter(Boolean)
          .some((value) => value.toString().toLowerCase().includes(term))
      return matchesCategory && matchesTerm
    })
    const deduped = new Map()
    filtered.forEach((item) => {
      const key = [
        (item.name || "").toLowerCase(),
        (item.brand || "").toLowerCase(),
        (item.category || "").toLowerCase(),
        item.price ?? "",
        item.stock ?? "",
        item.is_active ? "1" : "0",
      ].join("|")
      if (!deduped.has(key)) {
        deduped.set(key, item)
      }
    })
    return Array.from(deduped.values())
  }, [products, searchTerm, categoryFilter])

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    const token = localStorage.getItem("adminToken")
    if (!token) return navigate("/admin")

    try {
      const payload = {
        ...form,
        price: form.price === "" ? null : Number(form.price),
        stock: form.stock === "" ? null : Number(form.stock),
      }
      const endpoint = editingId ? `${API_URL}/api/products/${editingId}` : `${API_URL}/api/products`
      const method = editingId ? "PUT" : "POST"
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      const errorMessage = editingId ? "Failed to update product" : "Failed to create product"
      if (!res.ok) throw new Error(data?.message || errorMessage)
      setSuccess(editingId ? "Product updated" : "Product added")
      setForm({ name: "", brand: "", category: "", price: "", stock: "", is_active: true })
      setEditingId(null)
      fetchProducts()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setForm({
      name: product.name || "",
      brand: product.brand || "",
      category: product.category || "",
      price: product.price === null || product.price === undefined ? "" : product.price,
      stock: product.stock === null || product.stock === undefined ? "" : product.stock,
      is_active: !!product.is_active,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ name: "", brand: "", category: "", price: "", stock: "", is_active: true })
  }

  const confirmDelete = async (productId) => {
    const token = localStorage.getItem("adminToken")
    if (!token) return navigate("/admin")
    setError("")
    setSuccess("")
    setDeletingId(productId)
    try {
      const res = await fetch(`${API_URL}/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Failed to delete product")
      setSuccess("Product deleted")
      if (editingId === productId) {
        cancelEdit()
      }
      fetchProducts()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
      setDeleteCandidate(null)
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
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/80">Catalog</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Product Management</h1>
            <p className="text-sm text-slate-300">Add new hardware, adjust stock, and keep details synchronized.</p>
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
        {success && (
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur md:grid-cols-2">
          {editingId && (
            <div className="md:col-span-2 rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              Editing product #{editingId}
            </div>
          )}
          <input name="name" value={form.name} onChange={onChange} placeholder="Name *" required className={inputClass} />
          <input name="brand" value={form.brand} onChange={onChange} placeholder="Brand" className={inputClass} />
          <input name="category" value={form.category} onChange={onChange} placeholder="Category" className={inputClass} />
          <input name="price" value={form.price} onChange={onChange} placeholder="Price" type="number" step="0.01" className={inputClass} />
          <input name="stock" value={form.stock} onChange={onChange} placeholder="Stock" type="number" className={inputClass} />

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
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full rounded-lg border border-cyan-300/50 bg-cyan-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-50 transition hover:border-cyan-300 hover:bg-cyan-500/30"
            >
              {editingId ? "Update Product" : "Add Product"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="mt-3 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/20"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Current Products</h3>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{filteredProducts.length} visible</span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, brand, category..."
                className={`${inputClass} w-56`}
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`${inputClass} w-40 dark-select`}
              >
                <option value="all">All categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loading ? (
            <div className="mt-6 text-sm text-slate-300">Loading...</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm text-slate-200">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.3em] text-slate-400">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Brand</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Price</th>
                    <th className="py-3 pr-4">Stock</th>
                    <th className="py-3 pr-4">Active</th>
                    <th className="py-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id || p.name} className="border-b border-white/5">
                      <td className="py-3 pr-4">{p.name}</td>
                      <td className="py-3 pr-4">{p.brand || "-"}</td>
                      <td className="py-3 pr-4">{p.category || "-"}</td>
                      <td className="py-3 pr-4">{p.price ?? "-"}</td>
                      <td className="py-3 pr-4">{p.stock ?? "-"}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${p.is_active ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/10 text-rose-200"}`}
                        >
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {deleteCandidate === p.id ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => confirmDelete(p.id)}
                              disabled={deletingId === p.id}
                              className="rounded border border-rose-400/50 px-3 py-1 text-xs uppercase tracking-[0.3em] text-rose-100 hover:bg-rose-500/20 disabled:opacity-60"
                            >
                              {deletingId === p.id ? "Deleting..." : "Confirm"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteCandidate(null)}
                              className="rounded border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-200 hover:bg-white/10"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(p)}
                              className="rounded border border-cyan-300/50 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100 hover:bg-cyan-500/20"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteCandidate(p.id)}
                              className="rounded border border-rose-400/50 px-3 py-1 text-xs uppercase tracking-[0.3em] text-rose-200 hover:bg-rose-500/20"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        {products.length === 0 ? "No products yet" : "No items match your filters"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminProducts
