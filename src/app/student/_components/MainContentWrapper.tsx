'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

export function MainContentWrapper({ 
  children,
  isTeacher
}: { 
  children: React.ReactNode
  isTeacher: boolean
}) {
  const pathname = usePathname()
  const isFullscreenRunner = pathname?.includes('/run') || pathname?.includes('/quiz') || pathname?.includes('/play')

  if (isFullscreenRunner) {
    return (
      <main className="w-full max-w-none p-0 m-0 min-h-screen flex flex-col">
        {children}
      </main>
    )
  }

  const isClassRoute = pathname?.includes('/student/classes')

  return (
    <main className="w-full max-w-none pt-0 px-4 sm:px-6 md:px-8 pb-24 md:pb-12 transition-all duration-300 min-h-screen flex flex-col">
      <div className={`w-full flex-1 transition-all duration-300 ${isClassRoute ? "pt-2 sm:pt-3" : "pt-6 sm:pt-8"}`}>
        {children}
      </div>
    </main>
  )
}
