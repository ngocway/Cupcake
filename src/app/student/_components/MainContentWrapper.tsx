'use client'

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export function MainContentWrapper({ 
  children,
  isTeacher
}: { 
  children: React.ReactNode
  isTeacher: boolean
}) {
  const pathname = usePathname()
  const [isAtTop, setIsAtTop] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const isLearningRoute = pathname?.includes('/lessons/') || 
                         pathname?.includes('/assignments/') && pathname?.includes('/run')

  const noSidebar = isLearningRoute || isTeacher

  return (
    <main className={`${!noSidebar ? (isAtTop ? 'md:ml-64 pt-32 px-6' : 'md:ml-64 pt-0 px-6') : 'max-w-full mx-auto pt-0 px-0'} pb-24 md:pb-0 transition-all duration-500 min-h-screen`}>
      {children}
    </main>
  )
}
