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
  const headerVisible = true

  return (
    <aside
      className="hidden lg:flex w-80 flex-col p-10 gap-10 bg-white/95 border border-primary/5 rounded-[2.5rem] h-fit overflow-y-auto no-scrollbar sticky top-6 max-h-[calc(100vh-4rem)] shadow-2xl shadow-primary/5 transition-all duration-700 ease-in-out z-[45] touch-manipulation"
    >
      {children}
    </aside>
  )
}
