"use client"
import { useEffect } from "react"
import { useThemeStore } from "@/store/useThemeStore"

export default function LessonDetailClient({ children }: { children: React.ReactNode }) {
  const { setClearBackground } = useThemeStore()

  useEffect(() => {
    // Set to clear background for this premium editorial page
    setClearBackground(true)
    
    return () => {
      // Revert on unmount
      setClearBackground(false)
    }
  }, [setClearBackground])

  return <>{children}</>
}
