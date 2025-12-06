// src/pages/About.jsx
import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"

export default function About() {
  const [idx, setIdx] = useState(0)

  // Testimonial data with per-item star count and image aspect
  const testimonials = [
    { src: "/customer1.jpg", stars: 5, text: "This guy travel 400+ KM just to build me a PC, Thank You.", aspect: "4 / 3" },
    { src: "/customer2.jpg", stars: 5, text: "Trusing this man from the Elementary school a Tech Legend.", aspect: "4 / 3" },
    { src: "/customer3.jpg", stars: 5, text: "Smooth experience from order to setup. Getting excellent FPS in my games.", aspect: "4 / 3" },
  ]

  const renderStars = (n) => {
    const full = Math.max(0, Math.min(5, n || 0))
    const empty = 5 - full
    return "★".repeat(full) + "☆".repeat(empty)
  }

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % 3), 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-glow">About Me</h1>
      <p className="text-white/90 leading-relaxed text-justify">
        Hello, my name is Agung Yamora Zubara Siregar. I am a final year student from Asia e University Malaysia and a
        graduate of CCIT FTUI, University of Indonesia, majoring in Bachelor of Information and Communication Technology
        (B.ICT) and (DNIIT). I am passionate about computers and technology since 5 years old from PC building and embedded systems to IoT frameworks,
        computer systems, databases, networking, and cybersecurity. I love exploring emerging technologies, working on practical
        projects, and solving real-world problems with tech.
      </p>

      {/* Experience stats + gallery */}
      <section className="mt-10 rounded-3xl border border-white/10 bg-gradient-to-br from-[#050a1a] via-[#0b1839] to-[#06040d] px-6 py-10 text-center shadow-[0_0_45px_rgba(59,130,246,0.35)]">
        <h2 className="text-3xl font-semibold text-glow">Our Experience</h2>
        <p className="mt-2 text-sm uppercase tracking-[0.4em] text-slate-300">From silent rigs to flagship monsters.</p>
        <div className="mt-8 grid grid-cols-2 gap-6 text-center text-white/90 sm:grid-cols-4">
          {[
            { label: "Years Experience", value: "15+" },
            { label: "PCs Built", value: "12." },
            { label: "5★ Reviews", value: "5+" },
            { label: "Branches", value: "0" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-blue-300 drop-shadow-[0_0_12px_rgba(59,130,246,0.9)]">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.4em] text-slate-300">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-10 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#03060f] to-[#060b1b] shadow-[0_0_25px_rgba(15,23,42,0.65)]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 p-6">
            {[
              { src: "/experience/pcs1.webp", caption: "High End Custom PC Build" },
              { src: "/experience/pcs3.webp", caption: "Small Size Custom PC Build" },
              { src: "/experience/pcs2.webp", caption: "Dedicated Server PC Build" },
            ].map((item) => (
              <figure
                key={item.src}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/60 flex flex-col shadow-[0_0_20px_rgba(2,6,23,0.6)]"
              >
                <img
                  src={item.src}
                  alt={item.caption}
                  className="h-64 w-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
                <figcaption className="mt-auto border-t border-white/5 px-4 py-3 text-center text-sm text-white/80">
                  {item.caption}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="pb-6 text-xs uppercase tracking-[0.4em] text-cyan-100/80">We've got you covered.</p>
        </div>
      </section>

      {/* Customer satisfaction carousel */}
      <section className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-br from-[#050a1a] via-[#0b1839] to-[#06040d] px-6 py-10 text-center shadow-[0_0_45px_rgba(59,130,246,0.35)]">
        <h2 className="text-2xl md:text-3xl font-semibold text-glow">Customer Satisfaction</h2>
        <p className="mt-2 text-sm uppercase tracking-[0.4em] text-slate-300">Real builds. Real smiles.</p>
        <div className="relative mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#03060f] to-[#060b1b] shadow-[0_0_25px_rgba(15,23,42,0.65)]">
          <div
            className="flex items-stretch transition-transform duration-700 ease-out"
            style={{ width: `${testimonials.length * 100}%`, transform: `translateX(-${idx * (100 / testimonials.length)}%)` }}
          >
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 items-stretch rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-br from-[#070d1f] via-[#0a1431] to-[#05060f]"
                style={{ width: `${100 / testimonials.length}%` }}
              >
                {/* Left: image panel with glow */}
                <div className="relative flex items-center justify-center p-4 h-80 md:h-96 lg:h-[28rem] xl:h-[32rem]">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/5 blur-3xl" />
                  <img
                    src={t.src}
                    alt={`Customer ${i + 1}`}
                    className="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.65)]"
                    loading={i === 0 ? "eager" : "lazy"}
                    draggable={false}
                  />
                </div>
                {/* Right: testimony text */}
                <div className="p-8 flex flex-col justify-center bg-gradient-to-br from-[#050914]/90 via-[#070f23]/80 to-[#03050c]/90">
                  <div className="text-yellow-300 text-3xl tracking-[0.3em] select-none drop-shadow-[0_0_10px_rgba(250,204,21,0.35)]">
                    {renderStars(t.stars)}
                  </div>
                  <p className="mt-4 text-lg text-gray-100 leading-relaxed">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
          {/* dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`h-3 w-3 rounded-full border border-white/40 transition ${i === idx ? "bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.8)]" : "bg-white/30"}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        </div>
        <p className="mt-6 text-xs tracking-[0.3em] text-cyan-100/80">
          The images are real from the source — my customers.
        </p>
      </section>

      {/* Contact Me */}
      <div className="mt-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-glow">Contact Me</h2>
        <p className="mt-2 text-gray-100">I’d love to connect:</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <a href="https://github.com/ngliota" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="inline-flex items-center gap-2 px-6 py-3 text-lg rounded-xl bg-gray-800/80 hover:bg-gray-700 text-white ring-1 ring-gray-600 hover:ring-blue-400 transition">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path fillRule="evenodd" d="M12 2C6.48 2 2 6.49 2 12.02c0 4.43 2.87 8.19 6.85 9.51.5.09.65-.22.65-.49 0-.24-.01-.86-.02-1.69-2.78.6-3.37-1.35-3.37-1.35-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03.81-.22 1.67-.33 2.52-.33.85 0 1.71.11 2.52.33 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86 0 1.34-.01 2.42-.01 2.72 0 .27.18.58.66.48A10.03 10.03 0 0 0 22 12.02C22 6.49 17.52 2 12 2z" clipRule="evenodd"/></svg>
            GitHub
          </a>
          <a href="https://www.instagram.com/agungyzs" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="inline-flex items-center gap-2 px-6 py-3 text-lg rounded-xl bg-pink-600/90 hover:bg-pink-500 text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2.2A2.8 2.8 0 1 0 12 16.8 2.8 2.8 0 0 0 12 9.2zM17.5 6.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/></svg>
            Instagram
          </a>
          <a href="https://www.linkedin.com/in/agungsiregar" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="inline-flex items-center gap-2 px-6 py-3 text-lg rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4v15h-4V8zm7.5 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V23h-4v-6.55c0-1.56-.03-3.56-2.17-3.56-2.18 0-2.52 1.7-2.52 3.45V23h-4V8z"/></svg>
            LinkedIn
          </a>
        </div>
      </div>
    </motion.div>
  )
}
