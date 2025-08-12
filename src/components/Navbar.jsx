// src/components/Navbar.jsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate()

  // Simple JWT presence check
  const token = localStorage.getItem('token')
  const isLoggedIn = !!token

  const handleLogout = () => {
    // Remove token on logout
    localStorage.removeItem('token')
    navigate('/home')
    window.location.reload() // Optional: force refresh UI state
  }

  const scrollToElement = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav className="bg-gray-900 text-white py-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Navigation Links */}
        <div className="flex gap-6">
          <Link to="/home#" onClick={() => scrollToElement('home')} className="hover:text-blue-400">Home</Link>
          <Link to="/home#about" onClick={() => scrollToElement('about')} className="hover:text-blue-400">About</Link>
          <Link to="/home#experience" onClick={() => scrollToElement('experience')} className="hover:text-blue-400">Roadmap</Link>
          <Link to="/home#contact" onClick={() => scrollToElement('contact')} className="hover:text-blue-400">Contact</Link>

          {isLoggedIn && (
            <>
              <Link to="/simulation" className="hover:text-blue-400">Simulation</Link>
              <Link to="/history" className="hover:text-blue-400">History</Link>
            </>
          )}
        </div>

        {/* Auth Button */}
        <div>
          {isLoggedIn ? (
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white">
              Logout
            </button>
          ) : (
            <Link to="/login" className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
