'use client'

import { usePathname } from "next/navigation"

export function MainContentWrapper({ 
  children,
  isTeacher
}: { 
  children: React.ReactNode
  isTeacher: boolean
}) {
  const pathname = usePathname()
  
  const isLearningRoute = pathname?.includes('/lessons/') || 
                         pathname?.includes('/assignments/') && pathname?.includes('/run')

  const noSidebar = isLearningRoute || isTeacher

  return (
    <main className={`${!noSidebar ? 'md:ml-64 pt-24 px-6' : 'max-w-full mx-auto pt-0 px-0'} pb-24 md:pb-0 transition-all duration-300 min-h-screen`}>
      {children}
    </main>
  )
}
