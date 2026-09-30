'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function MainContentWrapper({ 
  children,
  isTeacher
}: { 
  children: React.ReactNode
  isTeacher: boolean
}) {
  const pathname = usePathname()
  const isFullscreenRunner = 
    pathname?.includes('/run') || 
    pathname?.includes('/quiz') || 
    pathname?.includes('/play') ||
    (pathname?.includes('/books/') && pathname !== '/student/books')

  const [isEmbedded, setIsEmbedded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search
      if (search && new URLSearchParams(search).get('embedded') === 'true') {
        setIsEmbedded(true)
      }
    }
  }, [])

  if (isFullscreenRunner || isEmbedded) {
    return (
      <main suppressHydrationWarning className="w-full max-w-none p-0 m-0 min-h-0 flex flex-col bg-transparent">
        {children}
      </main>
    )
  }

  const isStudentClassDetail = pathname?.startsWith('/student/classes/') && pathname !== '/student/classes'
  if (isStudentClassDetail) {
    return (
      <main suppressHydrationWarning className="w-full max-w-none p-0 m-0 min-h-screen flex flex-col bg-white dark:bg-slate-950">
        {children}
      </main>
    )
  }

  const isClassRoute = pathname?.includes('/student/classes')

  return (
    <main suppressHydrationWarning className="w-full max-w-none pt-0 px-4 sm:px-6 md:px-8 pb-24 md:pb-12 transition-all duration-300 min-h-screen flex flex-col">
      <div className={`w-full flex-1 transition-all duration-300 ${isClassRoute ? "pt-2 sm:pt-3" : "pt-6 sm:pt-8"}`}>
        {children}
      </div>
    </main>
  )
}
