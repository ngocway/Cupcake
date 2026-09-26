'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, ClipboardList, Bookmark, TrendingUp, GraduationCap } from 'lucide-react'

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

  // Only show BottomNav on main student portal pages (hide during quiz/game/run)
  const isExcluded = pathname?.includes('/run') || pathname?.includes('/play') || pathname?.includes('/quiz') || pathname?.includes('/login') || pathname?.includes('/signup')
  if (isExcluded) return null

  const isVisible = pathname === '/student/classes' || pathname?.startsWith('/student/classes') ||
                    pathname === '/student/dashboard' || pathname === '/student' ||
                    pathname === '/student/lessons' || pathname?.startsWith('/student/lessons') ||
                    pathname === '/student/assignments' || pathname?.startsWith('/student/assignments') ||
                    pathname === '/student/bookmarks' || pathname === '/student/growth'

  if (!isVisible) return null

  const navItems = [
    { href: '/student/classes', icon: GraduationCap, label: 'Class', strokeWidth: 2.5 },
    { href: '/student/lessons', icon: BookOpen, label: labels.lessons, strokeWidth: 2 },
    { href: '/student/assignments', icon: ClipboardList, label: labels.work, strokeWidth: 2 },
    { href: '/student/bookmarks', icon: Bookmark, label: 'Đã lưu', strokeWidth: 2 },
    { href: '/student/growth', icon: TrendingUp, label: labels.growth, strokeWidth: 2 },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around items-center py-2 md:hidden z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/student' && pathname?.startsWith(item.href))
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
