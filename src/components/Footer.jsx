// src/components/Footer.jsx
import React from "react"

const contactLinks = [
  {
    label: "GitHub",
    href: "https://github.com/ngliota",
    bg: "bg-gray-800/80 hover:bg-gray-700 ring-gray-600 hover:ring-blue-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M12 2C6.48 2 2 6.49 2 12.02c0 4.43 2.87 8.19 6.85 9.51.5.09.65-.22.65-.49 0-.24-.01-.86-.02-1.69-2.78.6-3.37-1.35-3.37-1.35-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03.81-.22 1.67-.33 2.52-.33.85 0 1.71.11 2.52.33 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86 0 1.34-.01 2.42-.01 2.72 0 .27.18.58.66.48A10.03 10.03 0 0 0 22 12.02C22 6.49 17.52 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/agungyzs",
    bg: "bg-pink-600/90 hover:bg-pink-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2.2A2.8 2.8 0 1 0 12 16.8 2.8 2.8 0 0 0 12 9.2zM17.5 6.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/agungsiregar",
    bg: "bg-blue-600/90 hover:bg-blue-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4v15h-4V8zm7.5 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V23h-4v-6.55c0-1.56-.03-3.56-2.17-3.56-2.18 0-2.52 1.7-2.52 3.45V23h-4V8z" />
      </svg>
    ),
  },
]

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-[#050816] text-white shadow-[0_-30px_80px_rgba(3,6,23,0.9)]">
      <div className="container mx-auto flex flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Contact Me</p>
          <p className="mt-1 text-sm text-slate-300">I'd love to connect:</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {contactLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${link.bg} ring-1 ring-transparent`}
              >
                {link.icon}
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-300">&copy; {year} WCompLabs | All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
