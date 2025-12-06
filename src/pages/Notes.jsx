// src/pages/Notes.jsx
import React, { useEffect, useState } from 'react'
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

export default function Notes() {
  const [sims, setSims] = useState([])
  const [error, setError] = useState('')
  const [noteMap, setNoteMap] = useState({})

  useEffect(() => {
    // load per-simulation notes from local storage
    try {
      const rawNotes = localStorage.getItem('simulationNotesMap') || '{}'
      const parsed = JSON.parse(rawNotes)
      if (parsed && typeof parsed === 'object') setNoteMap(parsed)
    } catch {
      setNoteMap({})
    }

    const token = localStorage.getItem('userToken') || localStorage.getItem('token')
    const load = async () => {
      setError('')
      try {
        if (!token) {
          const local = JSON.parse(localStorage.getItem('savedSimulations') || '[]')
          setSims(Array.isArray(local) ? local : [])
          return
        }
        const res = await fetch(`${API_URL}/api/simulations`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to load simulations')
        setSims(Array.isArray(data) ? data : [])
      } catch (e) {
        setError(e.message)
      }
    }
    load()
  }, [])

  const persistNotes = (next) => {
    setNoteMap(next)
    localStorage.setItem('simulationNotesMap', JSON.stringify(next))
  }

  const handleNoteChange = (key, value) => {
    persistNotes({ ...noteMap, [key]: value })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Saved Simulations</h1>
      {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded">{error}</div>}

      {sims.length === 0 ? (
        <div className="text-gray-300">No saved simulations yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sims.map((s) => {
            const key = String(s.id || s.localId || s.title || s.estimated_price || Math.random())
            const note = noteMap[key] || ''
            return (
              <div key={key} className="rounded-xl bg-white/10 ring-1 ring-white/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{s.title || 'Untitled Build'}</div>
                    <div className="text-sm text-gray-200">RM {Number(s.estimated_price || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  </div>
                  <span className="text-xs text-gray-300">ID: {s.id || 'local'}</span>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => handleNoteChange(key, e.target.value)}
                  placeholder="Add a note for this build..."
                  className="w-full h-24 p-2 rounded bg-black/50 ring-1 ring-white/10 text-white text-sm"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
