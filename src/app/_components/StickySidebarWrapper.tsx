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
  return (
    <aside
      className="hidden lg:flex w-[296px] flex-col p-[18px_16px_16px] bg-[#FBF3DF]/65 backdrop-blur-md border border-white/50 shadow-sm rounded-[20px] h-fit overflow-y-auto no-scrollbar sticky top-6 max-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out z-[45] touch-manipulation gap-4"
    >
      {children}
    </aside>
  )
}
