"use client"
import { useEffect, useState } from "react"
import { useScrollDirection } from "@/hooks/useScrollDirection"
import { usePathname } from "next/navigation"

interface HeaderScrollWrapperProps {
  children: React.ReactNode
}

export function HeaderScrollWrapper({ children }: HeaderScrollWrapperProps) {
  const pathname = usePathname()
  const { isHidden, isAtTop } = useScrollDirection()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if this is a learning page (quiz/reading run mode) - hide header here too
  const isLearningPage = pathname?.includes('/lessons/') || 
                        (pathname?.includes('/assignments/') && pathname?.includes('/run'))

  // Don't render header on learning pages
  if (isLearningPage) {
    return <>{children}</>
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="relative">
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[1440px]" style={{ height: 72 }} />
        {children}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Spacer to prevent content jump when header hides */}
      <div 
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ 
          height: isHidden ? 0 : 96,
          pointerEvents: 'none'
        }}
      />
      
      {/* Header with scroll animation */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isHidden 
            ? '-translate-y-full' 
            : 'translate-y-0'
        }`}
      >
        <div className="w-[95%] max-w-[1440px] pt-6">
          {children}
        </div>
      </div>
    </div>
  )
}
