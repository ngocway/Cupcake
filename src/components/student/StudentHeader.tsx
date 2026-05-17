"use client"
import { useEffect, useState } from "react"
import { PublicHeader } from "@/components/public/PublicHeader"
import { useScrollDirection } from "@/hooks/useScrollDirection"
import { usePathname } from "next/navigation"

interface StudentHeaderProps {
  session: { id: string; name: string | null; image: string | null; role: string | null } | null
}

export function StudentHeader({ session }: StudentHeaderProps) {
  const pathname = usePathname()
  const { isHidden, isAtTop } = useScrollDirection()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if this is a learning page (quiz/reading run mode)
  const isLearningPage = pathname?.includes('/lessons/') || 
                        (pathname?.includes('/assignments/') && pathname?.includes('/run'))

  // Don't render header on learning pages (quiz/reading mode)
  if (isLearningPage) return null

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center px-6 md:px-10 py-4 w-[95%] max-w-[1440px] glass rounded-[32px] shadow-2xl" style={{ minHeight: 72 }} />
    )
  }

  return (
    <>
      {/* Hidden spacer that maintains space when header is hidden */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out"
        style={{ 
          height: isHidden ? 0 : 96,
          opacity: isHidden ? 0 : 1,
          pointerEvents: isHidden ? 'none' : 'auto'
        }}
      />
      
      {/* Actual Header */}
      <nav 
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center px-6 md:px-10 py-4 w-[95%] max-w-[1440px] glass rounded-[32px] shadow-2xl transition-all duration-500 ease-in-out ${
          isHidden 
            ? '-translate-y-[120%] opacity-0 pointer-events-none' 
            : 'translate-y-0 opacity-100'
        }`}
      >
        <PublicHeader session={session} />
      </nav>
      
      {/* This is a trick: we render PublicHeader as a child, but we need to extract just its children */}
      {/* Actually, let me re-think this... */}
    </>
  )
}
