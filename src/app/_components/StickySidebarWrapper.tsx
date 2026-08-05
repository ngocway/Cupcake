"use client"
import { useEffect, useRef } from "react"
import { useContentStore } from "@/store/useContentStore"

/**
 * StickySidebarWrapper
 * ─ Desktop (lg+): sticky sidebar, always visible on the left.
 * ─ Mobile (<lg):  hidden by default. Opens as a slide-in drawer from the left
 *   controlled by `mobileSidebarOpen` in the Zustand store.
 *   Supports two gestures on the page body:
 *     • Swipe RIGHT from the left edge (startX < 40px, Δx > 60px) → open
 *     • Swipe LEFT  (Δx < -60px)                                   → close
 */
export function StickySidebarWrapper({ children }: { children: React.ReactNode }) {
  const mobileSidebarOpen = useContentStore(s => (s as any).mobileSidebarOpen)
  const setMobileSidebarOpen = useContentStore(s => (s as any).setMobileSidebarOpen)

  // ─── Touch / swipe gesture ──────────────────────────────────────────────────
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return
      const dx = e.changedTouches[0].clientX - touchStart.current.x
      const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y)
      touchStart.current = null

      // Ignore mostly-vertical swipes
      if (dy > 60) return

      if (!mobileSidebarOpen && dx > 60 && (e.changedTouches[0].clientX - dx) < 40) {
        // Swipe right from left edge → open
        setMobileSidebarOpen(true)
      } else if (mobileSidebarOpen && dx < -60) {
        // Swipe left → close
        setMobileSidebarOpen(false)
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true })
    document.addEventListener("touchend", onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener("touchstart", onTouchStart)
      document.removeEventListener("touchend", onTouchEnd)
    }
  }, [mobileSidebarOpen, setMobileSidebarOpen])

  // ─── Lock body scroll when drawer is open ──────────────────────────────────
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobileSidebarOpen])

  return (
    <>
      {/* ─── Desktop: original sticky sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex w-[296px] flex-col p-[18px_16px_16px] bg-[#FBF3DF]/65 backdrop-blur-md border border-white/50 shadow-sm rounded-[20px] h-fit overflow-y-auto no-scrollbar sticky top-6 max-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out z-[45] touch-manipulation gap-4">
        {children}
      </aside>

      {/* ─── Mobile: drawer + backdrop ────────────────────────────────────── */}
      <div className="lg:hidden">
        {/* Backdrop overlay */}
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className={`fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            mobileSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden="true"
        />

        {/* Drawer panel */}
        <aside
          className={`fixed top-0 left-0 h-full w-[296px] z-[80] bg-[#FBF3DF]/98 backdrop-blur-xl border-r border-white/50 shadow-2xl flex flex-col gap-4 p-[18px_16px_16px] overflow-y-auto no-scrollbar transition-transform duration-300 ease-in-out ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer header: logo + close button */}
          <div className="flex items-center justify-between mb-1">
            <img src="/images/logo.png" alt="Dolcake" className="w-9 h-9 object-contain" />
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/8 hover:bg-primary/15 text-primary transition-all active:scale-90"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {mobileSidebarOpen && children}
        </aside>
      </div>
    </>
  )
}
