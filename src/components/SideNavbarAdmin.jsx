// src/components/SideNavbarAdmin.jsx
import React from 'react'

const SideNavbarAdmin = () => {
  return (
    <aside className="w-64 h-screen bg-gray-900 text-white p-4">
      <h2 className="text-lg font-bold mb-4">Admin Panel</h2>
      <ul className="space-y-2">
        <li>Dashboard</li>
        <li>Users</li>
        <li>Settings</li>
      </ul>
    </aside>
  )
}

export default SideNavbarAdmin
