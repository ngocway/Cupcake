"use client"
import { useThemeStore } from "@/store/useThemeStore"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { updateBackgroundPreference } from "@/actions/student-settings-actions"

export function SharedBackground() {
  const { isClearBackground, setClearBackground } = useThemeStore()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync session preference to store on initial load
  useEffect(() => {
    if (mounted && session?.user) {
      const userTheme = (session.user as any).studentViewTheme
      if (userTheme === "CLEAR") {
        setClearBackground(true)
      } else if (userTheme === "BLURRED") {
        setClearBackground(false)
      }
    }
  }, [mounted, session])

  // Save to DB when changed (if logged in)
  useEffect(() => {
    if (mounted && session?.user) {
      updateBackgroundPreference(isClearBackground)
    }
  }, [isClearBackground])

  if (!mounted) return null

  const isHomepage = pathname === "/"

  return (
    <div className={`fixed inset-0 -z-50 overflow-hidden transition-all duration-1000 ${isHomepage ? "bg-gradient-to-b from-[#87CEEB] to-[#FFF8E7]" : "bg-primary/10"}`}>
      {isHomepage && (
        <>
          {/* Solar Flare / Ambient Glow */}
          <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square bg-secondary/20 blur-[120px] rounded-full animate-float" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] aspect-square bg-primary/10 blur-[100px] rounded-full" />
          
          {/* Organic botanical texture overlay (SVG or subtle image) */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]" />
        </>
      )}
    </div>
  )
}
