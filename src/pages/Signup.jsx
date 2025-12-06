import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"
console.log("API_URL =", API_URL)

const Signup = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email, phone }),
      })

      if (response.ok) {
        await response.json()
        navigate("/login")
      } else {
        let errorData = {}
        try {
          errorData = await response.json()
        } catch {
          errorData.message = "Signup failed with no error details."
        }
        setError(errorData.message || errorData.error || "Signup failed. Please try again.")
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
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-200/80">User</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Create account</h1>
            <p className="text-base text-slate-300">Join to start building.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="username" className="text-sm font-semibold tracking-[0.2em] text-slate-200">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-400/60 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-semibold tracking-[0.2em] text-slate-200">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-400/60 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="phone" className="text-sm font-semibold tracking-[0.2em] text-slate-200">
                Phone
              </label>
              <input
                type="text"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-400/60 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-semibold tracking-[0.2em] text-slate-200">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-400/60 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg border border-cyan-300/50 bg-cyan-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-50 transition hover:border-cyan-300 hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing up..." : "Signup"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-300">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-cyan-200 hover:text-cyan-100 underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
