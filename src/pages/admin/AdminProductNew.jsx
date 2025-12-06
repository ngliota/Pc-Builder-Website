// admin/AdminProductNew.jsx (dedicated add form)
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const AdminProductNew = () => {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    brand: '',
    category: '',
    price: '',
    stock: '',
    is_active: true,
  })

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) navigate('/admin')
  }, [navigate])

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    const token = localStorage.getItem('adminToken')
    if (!token) return navigate('/admin')
    try {
      const payload = {
        name: form.name,
        brand: form.brand || undefined,
        category: form.category || undefined,
        price: form.price === '' ? 0 : Number(form.price),
        stock: form.stock === '' ? 0 : Number(form.stock),
        is_active: !!form.is_active,
      }
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to create product')
      setSuccess('Product created')
      setTimeout(() => navigate('/admin/products'), 700)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full p-8">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Product</h2>
        {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded">{error}</div>}
        {success && <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 border border-green-300 rounded">{success}</div>}
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" value={form.name} onChange={onChange} placeholder="Name *" required className="px-3 py-2 border rounded" />
          <input name="brand" value={form.brand} onChange={onChange} placeholder="Brand" className="px-3 py-2 border rounded" />
          <input name="category" value={form.category} onChange={onChange} placeholder="Category (e.g., prebuilt)" className="px-3 py-2 border rounded" />
          <input name="price" value={form.price} onChange={onChange} placeholder="Price" type="number" step="0.01" className="px-3 py-2 border rounded" />
          <input name="stock" value={form.stock} onChange={onChange} placeholder="Stock" type="number" className="px-3 py-2 border rounded" />
          <label className="flex items-center gap-2 text-gray-700 md:col-span-2">
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={onChange} /> Active
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
              {saving ? 'Saving...' : 'Create'}
            </button>
            <button type="button" onClick={() => navigate('/admin/products')} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminProductNew
