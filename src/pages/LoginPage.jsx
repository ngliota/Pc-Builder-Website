// src/pages/LoginPage.jsx
import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const LoginPage = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("userToken", data.token)
        if (data.user && data.user.id) {
          const key = `userProfile_${data.user.id}`
          const profilePayload = {
            userid: data.user.id,
            username: data.user.username || username,
            email: data.user.email || "",
            phone: data.user.phone || "",
            address: "",
          }
          localStorage.setItem(key, JSON.stringify(profilePayload))
          window.dispatchEvent(new Event("profile-update"))
        }
        navigate("/")
      } else {
        let errorData = {}
        try {
          errorData = await response.json()
        } catch {}
        setError(errorData.message || errorData.error || "Login failed. Please try again.")
      }
    } catch (error) {
      setError("An error occurred. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030617] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 25% 20%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(circle at 80% 10%, rgba(236,72,153,0.2), transparent 40%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.12), transparent 45%)",
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

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-500/15 backdrop-blur">
          <div className="mb-6 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/80">User</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Welcome back</h1>
            <p className="text-sm text-slate-300">Log in to continue.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Username
              </label>
              <input
                type="text"
                id="username"
                placeholder=""
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-400 focus:border-cyan-400/60 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="��������"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-400 focus:border-cyan-400/60 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg border border-cyan-300/50 bg-cyan-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-50 transition hover:border-cyan-300 hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-300">
            Don�t have an account?{" "}
            <Link to="/signup" className="font-semibold text-cyan-200 hover:text-cyan-100 underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
