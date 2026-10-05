"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  GraduationCap, 
  ClipboardList, 
  BookOpen, 
  Layers, 
  Gamepad2, 
  Compass,
  ChevronDown, 
  User, 
  LogOut, 
  Menu, 
  X,
  LayoutDashboard,
  ShieldCheck,
  Briefcase
} from "lucide-react";
import { NotificationBell } from "@/components/common/NotificationBell";

interface StudentClassHeaderProps {
  session: {
    id: string;
    name: string | null;
    image: string | null;
    role: string | null;
    email?: string | null;
    studyAgeGroup?: string | null;
  } | null;
}

export function StudentClassHeader({ session }: StudentClassHeaderProps) {
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navigation Items according to Option A (Real Dolcake features)
  const navItems = [
    {
      label: "Lớp học",
      href: "/student/classes",
      icon: GraduationCap,
      isActive: true, // Always active on class pages
    },
    {
      label: "Bài tập",
      href: "/student/assignments",
      icon: ClipboardList,
      isActive: false,
    },
    {
      label: "Bài học & Ngữ pháp",
      href: "/student/lessons",
      icon: BookOpen,
      isActive: false,
    },
    {
      label: "Từ vựng",
      href: "/flashcards",
      icon: Layers,
      isActive: false,
    },
    {
      label: "Trò chơi",
      href: "/game",
      icon: Gamepad2,
      isActive: false,
    },
    {
      label: "Lộ trình",
      href: "/student/dashboard",
      icon: Compass,
      isActive: false,
    },
  ];

  const isTeacherAccount = session?.role === "TEACHER" || session?.role === "ADMIN";
  const isAdmin = session?.role?.toUpperCase() === "ADMIN";

  return (
    <header className="sticky top-0 z-50 w-full h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* ════════════════════════════════════════════════════════════════
            LEFT: LOGO DOLCAKE (Không kèm dòng phụ theo yêu cầu)
            ════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img 
              src="/images/logo.png" 
              alt="Dolcake" 
              className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-105" 
            />
            <span className="font-headline font-black text-xl tracking-tight text-primary">
              Dolcake
            </span>
          </Link>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            CENTER: HORIZONTAL NAVIGATION MENU (Anhngu24h style)
            ════════════════════════════════════════════════════════════════ */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  item.isActive
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-extrabold shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 stroke-[2.2px] ${item.isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT: NOTIFICATIONS & USER PROFILE
            ════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Notification Bell */}
          <div className="relative">
            <NotificationBell />
          </div>

          {/* User Profile Dropdown */}
          {session ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                  <img
                    src={session.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.id}`}
                    alt="Avatar"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.id}`;
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="hidden sm:inline-block max-w-[110px] truncate text-xs font-bold text-slate-700 dark:text-slate-200">
                  {session.name || "Học sinh"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{session.name}</p>
                    {session.email && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{session.email}</p>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      href="/student/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      <span>Bảng điều khiển</span>
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>

                    {isTeacherAccount && (
                      <Link
                        href="/teacher/classes"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2.5 transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-blue-500" />
                        <span>Chuyển sang Giáo viên</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full px-4 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <span>Trang Quản trị Admin</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/student/login"
              className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              Đăng nhập
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(prev => !prev)}
            className="lg:hidden p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Navigation"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MOBILE NAVIGATION DRAWER
          ════════════════════════════════════════════════════════════════ */}
      {isMobileNavOpen && (
        <div className="lg:hidden w-full bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    item.isActive
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
