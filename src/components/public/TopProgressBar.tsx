
"use client"
import { useEffect, useState, useTransition } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function TopProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [pathname, searchParams])

  // We can't easily detect the start of a navigation globally in App Router without intercepting clicks,
  // so we'll rely on the local useTransition in LandingPage for the tab-specific loading,
  // but this component can be used to show a global bar if needed.
  return null 
}

export function LoadingBar({ active }: { active: boolean }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let interval: any
    if (active) {
      setProgress(10)
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90
          return prev + (90 - prev) * 0.1
        })
      }, 200)
    } else {
      setProgress(100)
      setTimeout(() => setProgress(0), 500)
    }
    return () => clearInterval(interval)
  }, [active])

  if (progress === 0 || progress === 100) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
      <div 
        className="h-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-shimmer transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
      <div className="absolute top-0 right-0 h-full w-24 bg-primary blur-md" />
    </div>
  )
}
