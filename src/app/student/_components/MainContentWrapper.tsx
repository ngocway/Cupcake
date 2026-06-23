'use client'

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useScrollDirection } from "@/hooks/useScrollDirection"

export function MainContentWrapper({ 
  children,
  isTeacher
}: { 
  children: React.ReactNode
  isTeacher: boolean
}) {
  const pathname = usePathname()
  const { isHidden, isAtTop } = useScrollDirection()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isLearningRoute = Boolean(
    pathname && (
      pathname.includes('/lessons/') || 
      pathname.match(/\/(run|quiz|game)/)
    )
  )



  const noSidebar = isLearningRoute || isTeacher

  // Calculate top padding based on header visibility
  const topPadding = mounted ? (isHidden ? 'pt-0' : 'pt-8') : 'pt-8'

  return (
    <main className={`${!noSidebar ? (isAtTop ? `md:ml-64 ${topPadding} px-6` : `md:ml-64 pt-0 px-6`) : 'w-full max-w-none pt-0 px-0'} pb-24 md:pb-0 transition-all duration-500 min-h-screen flex flex-col`}>
      {children}
    </main>
  )
}
