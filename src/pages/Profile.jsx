import React, { useEffect, useState } from "react"

const Profile = () => {
  const [profile, setProfile] = useState({ userid: "", username: "", email: "", phone: "", address: "" })
  const [message, setMessage] = useState("")

  const decodeToken = () => {
    try {
      const token = localStorage.getItem("userToken") || localStorage.getItem("token")
      const payload = token?.split?.(".")?.[1]
      if (!payload) return {}
      const decoded = JSON.parse(atob(payload))
      return { id: decoded?.id, username: decoded?.username }
    } catch {
      return {}
    }
  }

  const getProfileKey = () => {
    const { id } = decodeToken()
    return id ? `userProfile_${id}` : "userProfile_guest"
  }

  useEffect(() => {
    try {
      const { id, username } = decodeToken()
      const key = getProfileKey()
      const raw = localStorage.getItem(key) || "{}"
      const parsed = JSON.parse(raw)
      const fallbackUsername = username || ""
      setProfile({
        userid: parsed.userid || id || "",
        username: parsed.username || fallbackUsername,
        email: parsed.email || "",
        phone: parsed.phone || "",
        address: parsed.address || "",
      })
    } catch {
      const { id, username } = decodeToken()
      setProfile({ userid: id || "", username: username || "", email: "", phone: "", address: "" })
    }
  }, [])

  const saveProfile = () => {
    const next = { ...profile }
    // persist per-user only
    localStorage.setItem(getProfileKey(), JSON.stringify(next))
    window.dispatchEvent(new Event("profile-update"))
    setMessage("Profile saved.")
    setTimeout(() => setMessage(""), 2000)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030617] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{
        background:
          "radial-gradient(circle at 25% 20%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(circle at 80% 10%, rgba(236,72,153,0.2), transparent 40%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.12), transparent 45%)",
      }} />
      <div className="pointer-events-none absolute inset-0 opacity-25" style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "140px 140px",
      }} />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-500/15 backdrop-blur space-y-4">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-200/80">Profile</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Account</h1>
            <p className="text-base text-slate-300">Update email, phone, and address. Username is fixed.</p>
          </div>

          {message && <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}

          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold tracking-[0.2em] text-slate-200">Username (read only)</label>
              <input value={profile.username} readOnly className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white opacity-60" />
            </div>
            <div>
              <label className="text-sm font-semibold tracking-[0.2em] text-slate-200">Email</label>
              <input
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-400/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold tracking-[0.2em] text-slate-200">Phone</label>
              <input
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-400/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold tracking-[0.2em] text-slate-200">Address (needed at checkout)</label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-cyan-400/60 focus:outline-none"
                rows={3}
              />
            </div>
          </div>

          <button
            onClick={saveProfile}
            className="w-full rounded-lg border border-cyan-300/50 bg-cyan-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-50 transition hover:border-cyan-300 hover:bg-cyan-500/30"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
