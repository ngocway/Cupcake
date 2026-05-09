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
    <div className={`fixed inset-0 -z-50 overflow-hidden transition-colors duration-1000 ${isHomepage ? "bg-[#f0f9ff]" : "bg-primary/10"}`}>
      {isHomepage && (
        <img 
          src="/bg-kid.png" 
          alt="" 
          className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${
            isClearBackground 
              ? "blur-none opacity-100 scale-100" 
              : "blur-xl opacity-80 scale-105"
          }`}
        />
      )}
    </div>
  )
}
