"use client"
import { useEffect, useState } from "react"

/**
 * Sticky sidebar wrapper that adjusts its top offset dynamically:
 * - top-32 (8rem) when header is visible (scrollY < 20)
 * - top-6  (1.5rem) when header has scrolled out of view
 *
 * Matches the -translate-y-40 hide animation in PublicHeader.
 */
export function StickySidebarWrapper({ children }: { children: React.ReactNode }) {
  const [headerVisible, setHeaderVisible] = useState(true)

  useEffect(() => {
    const onScroll = () => setHeaderVisible(window.scrollY < 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <aside
      className={`hidden lg:flex w-80 flex-col p-10 gap-10 bg-white/60 backdrop-blur-xl border border-primary/5 rounded-[2.5rem] h-fit overflow-y-auto no-scrollbar sticky shadow-2xl shadow-primary/5 transition-all duration-700 ease-in-out ${
        headerVisible
          ? "top-24 max-h-[calc(100vh-8rem)] scale-100"
          : "top-8  max-h-[calc(100vh-4rem)] scale-[0.98]"
      }`}
    >
      {children}
    </aside>
  )
}
