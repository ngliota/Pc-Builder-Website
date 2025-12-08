// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const differentiators = [
  { title: "Lifetime free technical support", icon: "SUP", emoji: "\u{1F6E0}\uFE0F" },
  { title: "Professional cable management", icon: "CBL", emoji: "\u{1F9F5}" },
  { title: "Lifetime free dust cleaning services", icon: "CLS", emoji: "\u{1F9F9}" },
  { title: "Full year 1-to-1 warranty exchange", icon: "WRN", emoji: "\u{1F6E1}\uFE0F" },
  { title: "Free delivery & installation", icon: "DEL", emoji: "\u{1F69A}" },
  { title: "Professional stress testing", icon: "TST", emoji: "\u{1F4CA}" },
  { title: "Free on-site service / repair (JB)", icon: "SRV", emoji: "\u{1F9F0}" },
  { title: "Delivery to whole Indonesia", icon: "MY", emoji: "\u{1F30F}" },
  { title: "Free nationwide warranty pickup/return", icon: "P/R", emoji: "\u{1F501}" },
]

const partnerLogos = [
  { name: "AMD", src: "/partners/partner1.png" },
  { name: "Intel", src: "/partners/partner2.png" },
  { name: "NVIDIA", src: "/partners/partner3.png" },
  { name: "ASUS", src: "/partners/partner4.png" },
  { name: "MSI", src: "/partners/partner5.png" },
  { name: "Corsair", src: "/partners/partner6.png" },
  { name: "Cooler Master", src: "/partners/partner7.png" },
  { name: "Ballistix", src: "/partners/partner8.png" },
]

const formatPrice = (value) => `RM ${(Number(value ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Home() {
  const images = useMemo(
    () => ["/ads/ad1.jpg", "/ads/ad2.jpg", "/ads/ad3.jpg", "/ads/ad4.jpg", "/ads/ad5.jpg", "/ads/ad6.jpg"],
    []
  )
  const [index, setIndex] = useState(0)
  const [prebuilts, setPrebuilts] = useState([])
  const [prebuiltError, setPrebuiltError] = useState("")
  const [prebuiltLoading, setPrebuiltLoading] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, 3500)

    return () => clearInterval(id)
  }, [images.length])

  useEffect(() => {
    let ignore = false

    const loadPrebuilts = async () => {
      setPrebuiltLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/prebuilts`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || "Failed to load prebuilts")

        const activePrebuilts = (Array.isArray(data) ? data : []).filter((p) => p.is_active)

        if (!ignore) {
          if (activePrebuilts.length) {
            setPrebuilts(activePrebuilts)
            setPrebuiltError("")
          } else {
            setPrebuilts([])
            setPrebuiltError("No prebuilts published yet. Ask an admin to add one.")
          }
        }
      } catch (error) {
        if (!ignore) {
          setPrebuilts([])
          setPrebuiltError(error?.message || "Unable to load prebuilts. Please try again later.")
        }
      } finally {
        if (!ignore) setPrebuiltLoading(false)
      }
    }

    loadPrebuilts()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 pt-0 pb-6"
    >
      {/* Hero Carousel (full-bleed) */}
      <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden shadow-lg h-56 sm:h-72 md:h-[28rem] lg:h-[32rem] bg-black">
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ width: `${images.length * 100}%`, transform: `translateX(-${index * (100 / images.length)}%)` }}
        >
          {images.map((src, i) => (
            <div
              key={src}
              className="relative w-full h-full flex-shrink-0 bg-black overflow-hidden"
              style={{ width: `${100 / images.length}%` }}
            >
              <div
                className="absolute inset-0 scale-110 blur-3xl opacity-70"
                style={{ backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
              <img
                src={src}
                alt={`Ad ${i + 1}`}
                className="relative z-10 w-full h-full object-contain"
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          ))}
        </div>
        {/* Dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={`dot-${i}`}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>

      {/* Tagline */}
      <h2 className="text-3xl md:text-4xl font-semibold text-center mt-10 text-glow">
        Build your PCs today or save them for later
      </h2>

      {prebuiltError && (
        <p className="mt-4 rounded border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-100">
          {prebuiltError}
        </p>
      )}

      {/* Prebuilt PCs grid (from products with category="prebuilt") */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-10">
        {prebuiltLoading && (
          <div className="col-span-full text-center text-gray-300">Loading prebuilts...</div>
        )}

        {!prebuiltLoading &&
          prebuilts.map((p) => (
            <Link
              to={`/prebuild/${p.id}`}
              key={p.id}
              className="group block rounded-xl overflow-hidden bg-gray-800/60 ring-1 ring-gray-700 hover:ring-blue-500 transition shadow-md"
            >
              <div className="h-72 sm:h-80 md:h-96 bg-black overflow-hidden flex items-center justify-center">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <div className="text-gray-400">No image</div>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-glow-soft">{p.name}</h3>
                  <p className="text-lg font-bold text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.45)]">
                    {formatPrice(p.price)}
                  </p>
                </div>
                <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </div>
            </Link>
          ))}

        {!prebuiltLoading && !prebuilts.length && (
          <div className="col-span-full text-gray-200">No prebuilt PCs yet.</div>
        )}
      </div>

      {/* Roadmap (under prebuilt grid) */}
      <section className="mt-12">
        <h3 className="text-2xl md:text-3xl font-bold text-glow">PC Build Roadmap</h3>
        <p className="text-gray-100 mt-2">
          Two simple ways to get your next PC: buy a ready-to-go Prebuilt, or build your own by following the steps below.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl bg-gray-800/60 ring-1 ring-gray-700 p-6">
            <h4 className="text-xl font-semibold text-glow-soft">Buy a Prebuilt</h4>
            <p className="text-gray-100 mt-2">Curated configurations, tested and ready. Just choose and go.</p>
            <a href="/home" className="inline-block mt-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">
              Browse Prebuilt PCs
            </a>
          </div>
          <div className="rounded-xl bg-gray-800/60 ring-1 ring-gray-700 p-6">
            <h4 className="text-xl font-semibold text-glow-soft">Build Your Own</h4>
            <ol className="mt-3 space-y-2 text-gray-100 list-decimal list-inside">
              <li>
                <span className="font-medium text-white">Note</span> - write down the parts you want.
              </li>
              <li>
                <span className="font-medium text-white">Plan</span> - set a budget and refine choices.
              </li>
              <li>
                <span className="font-medium text-white">Build</span> - we assemble, cable-manage, and test.
              </li>
              <li>
                <span className="font-medium text-white">Play</span> - fast delivery, game or work right away.
              </li>
            </ol>
            <Link
              to="/simulation"
              className="inline-block mt-5 rounded bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-500"
            >
              Build Now!
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-xl overflow-hidden bg-black ring-1 ring-gray-700">
          <img
            src="/roadmap.png"
            alt="PC Build Roadmap: Note, Plan, Build, Play"
            className="w-full h-auto object-contain"
            loading="lazy"
            draggable={false}
          />
        </div>
        <p className="text-xs text-gray-300 mt-2">
          *This image is only for an example for the customer satisfactory.
        </p>
      </section>

      {/* Partners */}
      <section className="mt-16 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0b1025] via-[#111735] to-[#04050f] px-4 py-12 text-center shadow-[0_25px_80px_rgba(5,8,20,0.75)]">
        <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Our Partners</p>
        <h3 className="mt-2 text-2xl font-semibold text-glow-soft">Trusted by the hardware we swear by.</h3>
        <div className="mt-10 grid grid-cols-2 gap-y-12 gap-x-8 text-center sm:grid-cols-4">
          {partnerLogos.map((partner) => (
            <div key={partner.name} className="flex items-center justify-center">
              <img
                src={partner.src}
                alt={partner.name}
                className="h-16 w-auto object-contain filter brightness-0 invert drop-shadow-[0_0_15px_rgba(255,255,255,0.25)] sm:h-20"
                loading="lazy"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Differentiators */}
      <section className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1025] via-[#111735] to-[#04050f] px-6 py-10 shadow-2xl shadow-blue-900/30">
        <h3 className="text-center text-3xl font-semibold text-glow">Why Choose WCompLabs?</h3>
        <p className="mt-2 text-center text-slate-300">Premium service with zero compromises.</p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {differentiators.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center rounded-2xl bg-white/5 px-6 py-8 text-center ring-1 ring-white/10 transition hover:bg-white/10"
            >
              <span className="text-4xl drop-shadow-[0_0_12px_rgba(59,130,246,0.45)]">
                <span aria-hidden="true" role="img">
                  {item.emoji}
                </span>
                <span className="sr-only">{item.icon}</span>
              </span>
              <p className="mt-4 text-base font-semibold text-slate-100">{item.title}</p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  )
}

