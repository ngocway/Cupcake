'use client'

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export function SideNavWrapper({ 
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
  
  // Routes where sidebar should be hidden
  const isLearningRoute = Boolean(
    pathname && (
      pathname.includes('/lessons/') || 
      pathname.match(/\/(run|quiz|game)/)
    )
  )
  
  if (isLearningRoute || isTeacher) return null

  return (
    <aside className={`h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-slate-900 flex-col h-full border-r border-slate-200/50 dark:border-slate-800/50 z-40 hidden md:flex transition-all duration-500 ${isAtTop ? 'pt-32' : 'pt-0'}`}>
      {children}
    </aside>
  )
}
