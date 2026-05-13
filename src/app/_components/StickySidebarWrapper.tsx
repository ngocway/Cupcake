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
      className={`hidden lg:flex w-80 flex-col p-8 gap-10 glass rounded-3xl h-fit overflow-y-auto no-scrollbar sticky shadow-xl transition-all duration-700 ease-in-out ${
        headerVisible
          ? "top-32 max-h-[calc(100vh-10rem)]"
          : "top-6  max-h-[calc(100vh-3rem)]"
      }`}
    >
      {children}
    </aside>
  )
}
