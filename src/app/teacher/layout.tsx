"use client";

import { usePathname } from "next/navigation"
import { Lexend } from "next/font/google"
import Link from "next/link"
import React from "react"

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  const navItems = [
    { name: "Khám phá", href: "/teacher/dashboard", icon: "explore" },
    { name: "Lớp học", href: "/teacher/classes", icon: "school" },
    { name: "Báo cáo", href: "/teacher/reports", icon: "analytics" },
  ];

  const libraryItems = [
    { name: "Tất cả bài học", href: "/teacher/lessons", icon: "menu_book" },
    { name: "Tất cả bài tập", href: "/teacher/materials", icon: "grid_view" },
    { name: "Gần đây", href: "#", icon: "schedule" },
    { name: "Đã chia sẻ", href: "#", icon: "share" },
    { name: "Thùng rác", href: "/teacher/materials/trash", icon: "delete" },
  ];

  return (
    <div className={`teacher-theme ${lexend.variable} font-display bg-background-light dark:bg-background-dark text-[#111418] dark:text-white antialiased flex flex-col min-h-screen transition-colors duration-300`}>
      <header className="sticky top-0 z-50 w-full bg-white dark:bg-background-dark border-b border-[#f0f2f4] dark:border-gray-800 px-6 py-3">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-8 flex-1">
            <div className="flex items-center gap-3 shrink-0">
              <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined">auto_stories</span>
              </div>
              <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-tight hidden lg:block">Teacher's Library</h2>
            </div>
            <div className="flex-1 max-w-xl">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#617589]">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input className="block w-full rounded-xl border-none bg-[#f0f2f4] dark:bg-gray-800 py-2.5 pl-10 pr-4 text-base placeholder-[#617589] focus:ring-2 focus:ring-primary/50 transition-all" placeholder="Tìm kiếm bài tập..." type="text"/>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-cover bg-center border-2 border-primary/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB1Zf9RjuWzeL1szre4pXTwbbp2PXCUB5X_IFJkoc0sEef2cuvkpg85dEkKkr4_Lgr1oclyfiukzcMGXWpaa1jWmxRd7-fYisZMxeIB6RqtGl8jtZGe2AX6NvrO0LhGfXOWhnbU5ytRpY2k5t9uZG6xF9HQF2xRqevJ5ztANtym4kKf3du5hYfxmhI2WAM80p7U44cBai5c3uqR-3Io1S6UJlhVEllfGPjrg0MGZGTYYjTGxFM31B35FXYb-K3Qyd6F8CovyIq6c8KL")' }}></div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-[1440px] mx-auto w-full px-6 py-8 gap-8">
        <aside className="w-64 shrink-0 hidden md:flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="px-3 text-xs font-bold text-[#617589] uppercase tracking-wider mb-2">Điều hướng</p>
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group ${
                  pathname === item.href 
                    ? "active-nav" 
                    : "hover:bg-[#f0f2f4] dark:hover:bg-gray-800 text-[#617589] dark:text-gray-400 hover:text-[#111418] dark:hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <p className="px-3 text-xs font-bold text-[#617589] uppercase tracking-wider mb-2">Thư viện của tôi</p>
            {libraryItems.map((item) => (
              <Link 
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group ${
                  pathname === item.href 
                    ? "active-nav" 
                    : "hover:bg-[#f0f2f4] dark:hover:bg-gray-800 text-[#617589] dark:text-gray-400 hover:text-[#111418] dark:hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </aside>
        
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
