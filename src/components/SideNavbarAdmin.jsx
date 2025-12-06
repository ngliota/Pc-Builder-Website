// src/components/SideNavbarAdmin.jsx
import React from "react"
import { NavLink, useNavigate } from "react-router-dom"

const SideNavbarAdmin = () => {
  const navigate = useNavigate()

  const navItems = [
    { to: "/admin/dashboard", label: "Dashboard", code: "DB", desc: "Overview" },
    { to: "/admin/products", label: "Products", code: "PR", desc: "Catalog" },
    { to: "/admin/prebuilts", label: "Prebuilts", code: "PB", desc: "Custom" },
    { to: "/admin/orders", label: "Orders", code: "OR", desc: "To Build" },
  ]

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    navigate("/admin")
  }

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col overflow-hidden bg-[#050312] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.35), transparent 55%), radial-gradient(circle at 80% 10%, rgba(236,72,153,0.25), transparent 40%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.15), transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
        }}
      />

      <div className="relative z-10 flex max-h-screen flex-1 flex-col overflow-y-auto px-5 py-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/80">Admin</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Control Panel</h2>
          <p className="text-sm text-slate-300/90">Tools & monitoring</p>
        </div>

        <nav className="flex-1 space-y-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin/dashboard"}
              className={({ isActive }) =>
                [
                  "group block rounded-xl border border-white/5 bg-white/5 px-4 py-3 transition",
                  "hover:bg-white/10 hover:border-white/20",
                  isActive ? "border-cyan-300/60 bg-cyan-500/20 shadow-lg shadow-cyan-500/20" : "",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-semibold tracking-[0.2em] ${
                      isActive
                        ? "border-cyan-200/80 bg-cyan-400/20 text-cyan-50"
                        : "border-white/10 bg-black/30 text-slate-300"
                    }`}
                  >
                    {item.code}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.desc}</p>
                  </div>
                  <div className="ml-auto h-2 w-2 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 opacity-0 transition group-hover:opacity-100" />
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 space-y-3">
          <div className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-xs uppercase tracking-[0.3em] text-slate-400">
            Systems operational
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-rose-200/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-200/80 hover:bg-rose-500/20"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}

export default SideNavbarAdmin
