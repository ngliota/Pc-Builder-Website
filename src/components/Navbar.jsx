// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate()
  const [cartCount, setCartCount] = useState(0)
  const [cartHop, setCartHop] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profile, setProfile] = useState({ username: '', email: '', phone: '', address: '' })
  const dropdownRef = useRef(null)

  // Simple JWT presence check (support legacy 'token' and new 'userToken')
  const userToken = localStorage.getItem('userToken') || localStorage.getItem('token')
  const isLoggedIn = !!userToken

  const getUsernameFromToken = () => {
    try {
      const payload = userToken?.split?.('.')?.[1]
      if (!payload) return ''
      const decoded = JSON.parse(atob(payload))
      return decoded?.username || ''
    } catch {
      return ''
    }
  }

  const decodeToken = () => {
    try {
      const token = userToken
      const payload = token?.split?.('.')?.[1]
      if (!payload) return {}
      const decoded = JSON.parse(atob(payload))
      return { id: decoded?.id, username: decoded?.username }
    } catch {
      return {}
    }
  }

  const syncCartCount = () => {
    try {
      const key = getCartKey()
      const raw = key ? localStorage.getItem(key) : null
      const list = raw ? JSON.parse(raw) : []
      setCartCount(Array.isArray(list) ? list.length : 0)
    } catch {
      setCartCount(0)
    }
  }

  const getCartKey = () => {
    try {
      const { id } = decodeToken()
      const rawProfile = id ? (localStorage.getItem(`userProfile_${id}`) || '{}') : (localStorage.getItem('userProfile') || '{}')
      const parsedProfile = JSON.parse(rawProfile)
      const currentUserId = parsedProfile?.userid || parsedProfile?.id || id
      return currentUserId ? `cartItems_${currentUserId}` : 'cartItems_guest'
    } catch {
      return 'cartItems_guest'
    }
  }

  const syncProfile = () => {
    try {
      const { id } = decodeToken()
      const raw = id ? (localStorage.getItem(`userProfile_${id}`) || '{}') : (localStorage.getItem('userProfile') || '{}')
      const parsed = JSON.parse(raw)
      const fallbackUsername = getUsernameFromToken()
      setProfile({
        username: parsed.username || fallbackUsername,
        email: parsed.email || '',
        phone: parsed.phone || '',
        address: parsed.address || '',
      })
    } catch {
      const fallbackUsername = getUsernameFromToken()
      setProfile({ username: fallbackUsername, email: '', phone: '', address: '' })
    }
  }

  useEffect(() => {
    syncCartCount()
    syncProfile()
    const onStorage = (e) => {
      if (e.key && e.key.startsWith('cartItems')) syncCartCount()
      if (e.key === 'userProfile') syncProfile()
    }
    const onCartEvent = (e) => {
      syncCartCount()
      if (e?.detail === "remove") {
        return
      }
      setCartHop(true)
      setTimeout(() => setCartHop(false), 2000)
    }
    const onProfileEvent = () => syncProfile()
    window.addEventListener('storage', onStorage)
    window.addEventListener('cart-update', onCartEvent)
    window.addEventListener('profile-update', onProfileEvent)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('cart-update', onCartEvent)
      window.removeEventListener('profile-update', onProfileEvent)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    // Remove token on logout
    localStorage.removeItem('token')
    localStorage.removeItem('userToken')
    navigate('/home')
    window.location.reload() // Optional: force refresh UI state
  }

  // Hash-based scrolling removed; use route navigation only

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#050b1f]/95 via-[#0b1f3f]/90 to-[#16061f]/95 shadow-lg shadow-blue-900/30 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-8">
          <Link
            to="/home"
            className="text-2xl font-semibold uppercase tracking-[0.4em] text-blue-100 drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]"
          >
            W<span className="text-purple-500">Comp</span>Labs
          </Link>
          {/* Navigation Links */}
          <div className="flex items-center gap-6 md:gap-8">
            <Link to="/home" className="link-glow text-lg md:text-xl font-semibold">Home</Link>
            <Link to="/simulation" className="link-glow text-lg md:text-xl font-semibold">Simulation</Link>
            <Link to="/about" className="link-glow text-lg md:text-xl font-semibold">About</Link>
          </div>
        </div>

        {/* Cart + Profile + Auth */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => navigate('/checkout')}
                className={`relative rounded-full bg-white/10 px-4 py-3 text-white hover:bg-white/20 transition ${cartHop ? 'animate-bounce' : ''}`}
                aria-label="Cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                  <path d="M3 4h2l1.6 9.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L18.5 8H7" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="19" r="1.2" />
                  <circle cx="16" cy="19" r="1.2" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-rose-500 px-1 text-center text-xs font-semibold">
                    {cartCount}
                  </span>
                )}
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:border-white/30 hover:bg-white/20"
                  aria-label="Profile menu"
                >
                  <span className="sr-only">Profile</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.25 7.75a3.25 3.25 0 1 1-6.5 0 3.25 3.25 0 0 1 6.5 0Zm-9 11.5a6.25 6.25 0 1 1 12.5 0v.25H6.25v-.25Z"
                    />
                  </svg>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl border border-white/10 bg-[#0b1224] p-4 shadow-2xl shadow-black/40">
                    <div className="mb-3 text-sm text-slate-200">
                      <div className="font-semibold text-white">{profile.username || 'User'}</div>
                      <div className="text-xs text-slate-400">{profile.email || 'No email set'}</div>
                    </div>
                    <div className="space-y-2 text-xs text-slate-300">
                      <div>Phone: {profile.phone || 'Add phone'}</div>
                      <div>Address: {profile.address || 'Add address before checkout'}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      <Link
                        to="/transactions"
                        className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-center font-semibold text-white transition hover:bg-white/20"
                      >
                        Transactions
                      </Link>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm">
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-center text-white transition hover:bg-blue-500"
                      >
                        Manage Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="rounded-lg bg-rose-600 px-3 py-2 text-white hover:bg-rose-500"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              to="/login"
              aria-label="Login"
              className="btn-glow px-5 py-2.5 rounded-xl text-base md:text-lg"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
