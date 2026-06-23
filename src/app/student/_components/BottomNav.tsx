'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, ClipboardList, Users, TrendingUp } from 'lucide-react'

const AUTH_PATHS = ['/student/login', '/student/signup', '/join']

interface BottomNavProps {
  labels: {
    dash: string
    lessons: string
    work: string
    class: string
    growth: string
  }
}

export function BottomNav({ labels }: BottomNavProps) {
  const pathname = usePathname()

  // Hide on auth pages and game/run pages (fullscreen)
  const isAuthPage = AUTH_PATHS.some(p => pathname?.startsWith(p))
  const isFullscreenPage = pathname?.includes('/run') || pathname?.includes('/game/match-words') || pathname?.includes('/game/sentence-builder')

  if (isAuthPage || isFullscreenPage) return null

  const navItems = [
    { href: '/student/dashboard', icon: LayoutDashboard, label: labels.dash, strokeWidth: 2.5 },
    { href: '/student/lessons', icon: BookOpen, label: labels.lessons, strokeWidth: 2 },
    { href: '/student/assignments', icon: ClipboardList, label: labels.work, strokeWidth: 2 },
    { href: '/student/classes', icon: Users, label: labels.class, strokeWidth: 2 },
    { href: '/student/growth', icon: TrendingUp, label: labels.growth, strokeWidth: 2 },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around items-center py-2 md:hidden z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
              isActive ? 'text-primary' : 'text-slate-400'
            }`}
          >
            <Icon
              className="w-6 h-6"
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="text-[10px] font-label font-bold">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
