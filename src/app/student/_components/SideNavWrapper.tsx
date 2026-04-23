'use client'

import { usePathname } from "next/navigation"

export function SideNavWrapper({ 
  children,
  isTeacher
}: { 
  children: React.ReactNode
  isTeacher: boolean
}) {
  const pathname = usePathname()
  
  // Routes where sidebar should be hidden
  const isLearningRoute = pathname?.includes('/lessons/') || 
                         pathname?.includes('/assignments/') && pathname?.includes('/run')
  
  if (isLearningRoute || isTeacher) return null

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 pt-20 bg-slate-50 dark:bg-slate-900 flex-col h-full border-r border-slate-200/50 dark:border-slate-800/50 z-40 hidden md:flex">
      {children}
    </aside>
  )
}
