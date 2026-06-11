"use client";

import { usePathname } from "next/navigation"
import { Lexend } from "next/font/google"
import Link from "next/link"
import React, { useState, useRef, useEffect } from "react"
import { signOut, useSession, SessionProvider } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Bell, BellOff, ClipboardList, UserPlus, Star, FileText, Eye, Settings, HelpCircle, LogOut, ShieldAlert, ArrowLeft, BookOpen, Search, LayoutGrid, GraduationCap, Archive, Clock, Share2, Trash2, Book } from "lucide-react"
import { useScrollDirection } from "@/hooks/useScrollDirection"

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;
    const { getMyNotifications, getUnreadCount } = await import("@/actions/notification-actions");
    const [notifs, count] = await Promise.all([getMyNotifications(), getUnreadCount()]);
    setNotifications(notifs as any[]);
    setUnreadCount(count as number);
  };

  useEffect(() => {
    if (session?.user?.id) {
       fetchNotifications();
       // Poll every 30 seconds for new notifications
       const interval = setInterval(fetchNotifications, 30000);
       return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, link?: string) => {
    const { markAsRead } = await import("@/actions/notification-actions");
    await markAsRead(id);
    await fetchNotifications();
    if (link) window.location.href = link;
  };

  const handleMarkAllAsRead = async () => {
    const { markAllAsRead } = await import("@/actions/notification-actions");
    await markAllAsRead();
    await fetchNotifications();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="size-10 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-blue-500 transition-colors relative border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
      >
        <Bell className="w-5 h-5 stroke-[2px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Thông báo</h3>
            {unreadCount > 0 && (
               <button 
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline"
               >
                 Đọc tất cả
               </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
               notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.link)}
                  className={`w-full text-left px-4 py-4 border-b border-slate-50 dark:border-slate-700/50 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${!n.isRead ? 'bg-blue-500/5' : ''}`}
                >
                  <div className={`shrink-0 size-8 rounded-full flex items-center justify-center ${!n.isRead ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    {n.type === 'NEW_ASSIGNMENT' ? <ClipboardList className="w-4 h-4 stroke-[2px]" /> : 
                     n.type === 'ENROLLMENT_REQUEST' ? <UserPlus className="w-4 h-4 stroke-[2px]" /> : 
                     n.type === 'NEW_REVIEW' ? <Star className="w-4 h-4 stroke-[2px]" /> : 
                     <Bell className="w-4 h-4 stroke-[2px]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!n.isRead ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-400'} leading-tight`}>{n.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                    <p className="text-[9px] text-slate-400 mt-2 uppercase font-black tracking-widest">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </button>
               ))
            ) : (
              <div className="px-4 py-12 text-center">
                <BellOff className="text-slate-300 dark:text-slate-600 w-10 h-10 mx-auto mb-4 stroke-[1.5px]" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Không có thông báo mới</p>
              </div>
            )}
          </div>
          <Link href="/teacher/notifications" className="block w-full text-center py-3 bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-[2px] border-t border-slate-100 dark:border-slate-700 hover:text-slate-600 transition-colors">
            Xem tất cả
          </Link>
        </div>

      )}
    </div>
  );
}

function TeacherProfile() {
  const { data: session } = useSession()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 focus:outline-none"
      >
        <div className="size-10 rounded-full bg-cover bg-center border-2 border-primary/20 cursor-pointer hover:border-primary/50 transition-colors" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB1Zf9RjuWzeL1szre4pXTwbbp2PXCUB5X_IFJkoc0sEef2cuvkpg85dEkKkr4_Lgr1oclyfiukzcMGXWpaa1jWmxRd7-fYisZMxeIB6RqtGl8jtZGe2AX6NvrO0LhGfXOWhnbU5ytRpY2k5t9uZG6xF9HQF2xRqevJ5ztANtym4kKf3du5hYfxmhI2WAM80p7U44cBai5c3uqR-3Io1S6UJlhVEllfGPjrg0MGZGTYYjTGxFM31B35FXYb-K3Qyd6F8CovyIq6c8KL")' }}></div>
      </button>
      
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Info */}
          <div className="px-4 py-3 mb-2">
            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{session?.user?.name || "Giáo viên"}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{session?.user?.email || "teacher@clarified.com"}</p>
          </div>
          
          <div className="h-px bg-slate-100 dark:bg-slate-700 mx-3 mb-2" />

          {/* Group 1: Branding */}
          <Link 
            href="/teacher/profile"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-bold transition-colors group"
          >
            <FileText className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform stroke-[2px]" />
            Quản lý Portfolio
          </Link>
          <Link 
            href={`/teacher/profile/${session?.user?.id}`}
            target="_blank"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-bold transition-colors group"
          >
            <Eye className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all stroke-[2px]" />
            Xem Portfolio thực tế
          </Link>

          <div className="h-px bg-slate-100 dark:bg-slate-700 mx-3 my-2" />

          {/* Group 2: System */}
          <Link 
            href="/teacher/settings"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-bold transition-colors group"
          >
            <Settings className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all stroke-[2px]" />
            Cài đặt hệ thống
          </Link>
          <Link 
            href="#"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-bold transition-colors group"
          >
            <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all stroke-[2px]" />
            Trợ giúp & Hướng dẫn
          </Link>

          <div className="h-px bg-slate-100 dark:bg-slate-700 mx-3 my-2" />

          {/* Logout */}
          <button 
            onClick={() => signOut({ callbackUrl: '/teacher/login' })}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-black transition-colors"
          >
            <LogOut className="w-5 h-5 stroke-[2px]" />
            Đăng xuất
          </button>
        </div>

      )}
    </div>
  )
}

function AdminModeBanner({ mode }: { mode: 'TEACHER' | 'STUDENT' }) {
  const router = useRouter()
  const { isHidden } = useScrollDirection()
  return (
    <div className={`sticky top-0 z-[100] w-full bg-amber-500/90 backdrop-blur-md text-amber-950 flex items-center justify-between px-6 py-2.5 shadow-sm border-b border-amber-600/20 transition-transform duration-500 ease-in-out ${isHidden ? '-translate-y-full pointer-events-none' : 'translate-y-0'}`}>
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 stroke-[2.5px]" />
        <span className="text-xs font-black uppercase tracking-widest">
          Admin đang xem giao diện {mode === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
        </span>
      </div>
      <button
        onClick={() => router.push('/admin/staff')}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-950/10 hover:bg-amber-950/20 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all border border-amber-950/20"
      >
        <ArrowLeft className="w-4 h-4 stroke-[2.5px]" />
        Thoát về Admin
      </button>
    </div>
  )
}

function TeacherLayoutContent({ children, session, pathname }: { children: React.ReactNode, session: any, pathname: string }) {
  const IconMap: Record<string, any> = {
    grid_view: LayoutGrid,
    school: GraduationCap,
    contact_page: FileText,
    menu_book: Book,
    inventory_2: Archive,
    schedule: Clock,
    share: Share2,
    delete: Trash2
  };

  const navItems = [
    { name: "Bảng điều khiển", href: "/teacher/dashboard", icon: "grid_view" },
    { name: "Lớp học", href: "/teacher/classes", icon: "school" },
    { name: "Hồ sơ năng lực", href: "/teacher/profile", icon: "contact_page" },
  ];

  const libraryItems = [
    { name: "Tất cả bài học", href: "/teacher/lessons", icon: "menu_book" },
    { name: "Tất cả bài tập", href: "/teacher/materials", icon: "grid_view" },
    { name: "Ngân hàng câu hỏi", href: "/teacher/question-bank", icon: "inventory_2" },
    { name: "Gần đây", href: "#", icon: "schedule" },
    { name: "Đã chia sẻ", href: "#", icon: "share" },
    { name: "Thùng rác", href: "/teacher/materials/trash", icon: "delete" },
  ];

  const isEditMode = pathname.endsWith('/edit') || pathname.includes('/edit/');
  const { isHidden } = useScrollDirection();

  return (
    <div className={`teacher-theme ${lexend.variable} font-display bg-[#eef8fa] dark:bg-slate-900 text-slate-900 dark:text-white antialiased flex flex-col min-h-screen transition-colors duration-300`}>
      {session?.user?.role === 'ADMIN' && <AdminModeBanner mode="TEACHER" />}
      {!isEditMode && (
        <header id="teacher-header" className={`sticky top-0 z-50 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-3 shadow-sm transition-transform duration-500 ease-in-out ${isHidden ? '-translate-y-[120%] pointer-events-none' : 'translate-y-0'}`}>
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8">
            <div className="flex items-center gap-8 flex-1">
              <div className="flex items-center gap-3 shrink-0">
                <div className="size-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <BookOpen className="w-5 h-5 stroke-[2px]" />
                </div>
                <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight hidden lg:block">Teacher's Library</h2>
              </div>
              <div className="flex-1 max-w-xl">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Search className="w-5 h-5 stroke-[2px]" />
                  </div>
                  <input 
                    className="block w-full rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm py-2.5 pl-10 pr-4 text-base placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all font-medium" 
                    placeholder="Tìm kiếm bài tập, tài liệu..." 
                    type="text"
                    defaultValue={new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('q') || ''}
                    onChange={(e) => {
                      const params = new URLSearchParams(window.location.search);
                      if (e.target.value) {
                        params.set('q', e.target.value);
                      } else {
                        params.delete('q');
                      }
                      const newPath = `${window.location.pathname}?${params.toString()}`;
                      window.history.replaceState({}, '', newPath);
                      window.dispatchEvent(new Event('search-change'));
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <TeacherProfile />
            </div>
          </div>
        </header>
      )}

      <div id="teacher-layout-wrapper" className={`flex flex-1 ${isEditMode ? 'w-full' : 'max-w-[1440px] mx-auto px-6 py-8 gap-8'} w-full`}>
        {!isEditMode && (
          <aside id="teacher-sidebar" className="w-64 shrink-0 hidden md:flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Điều hướng</p>
              {navItems.map((item) => {
                const Icon = IconMap[item.icon] || LayoutGrid;
                return (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group ${
                      pathname === item.href 
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold" 
                        : "hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className={`w-5 h-5 group-hover:scale-110 transition-transform ${pathname === item.href ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
            <div className="flex flex-col gap-1">
              <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Thư viện của tôi</p>
              {libraryItems.map((item) => {
                const Icon = IconMap[item.icon] || LayoutGrid;
                return (
                  <Link 
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group ${
                      pathname === item.href 
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold" 
                        : "hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className={`w-5 h-5 group-hover:scale-110 transition-transform ${pathname === item.href ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </aside>
        )}
        
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

function TeacherLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  return <TeacherLayoutContent children={children} session={session} pathname={pathname} />
}

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Skip layout chrome for login page
  if (pathname === '/teacher/login') {
    return (
      <SessionProvider>
        {children}
      </SessionProvider>
    )
  }

  return (
    <SessionProvider>
      <TeacherLayoutWrapper>
        {children}
      </TeacherLayoutWrapper>
    </SessionProvider>
  )
}
