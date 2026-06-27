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
  const isAtTop = true
  
  // Routes where sidebar should be hidden
  const isLearningRoute = Boolean(
    pathname && (
      pathname.includes('/lessons/') || 
      pathname.match(/\/(run|quiz|game)/)
    )
  )
  
  if (isLearningRoute || isTeacher) return null

  return (
    <aside className="h-full w-64 absolute left-0 top-0 bg-slate-50 dark:bg-slate-900 flex-col border-r border-slate-200/50 dark:border-slate-800/50 z-40 hidden md:flex transition-all duration-500 pt-32">
      {children}
    </aside>
  )
}
