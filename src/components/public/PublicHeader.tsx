"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { LoginButton } from "@/components/LoginButton"
import { LanguageToggle } from "@/components/LanguageToggle"
import { signOut } from "next-auth/react"

interface PublicHeaderProps {
  session: { id: string; name: string | null; image: string | null; role: string | null } | null
  search?: string
  setSearch?: (val: string) => void
}

export function PublicHeader({ session, search, setSearch }: PublicHeaderProps) {
  const [isAtTop, setIsAtTop] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20)
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("mousedown", handleClickOutside)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const dashboardHref = session?.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard"

  return (
    <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center px-6 md:px-10 py-4 w-[95%] max-w-[1440px] glass rounded-[32px] shadow-2xl transition-all duration-700 ease-in-out ${isAtTop ? "translate-y-0 opacity-100" : "-translate-y-40 opacity-0 pointer-events-none"}`}>
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-primary text-on-primary rounded-[18px] flex items-center justify-center text-on-primary font-black group-hover:rotate-12 transition-all duration-500 shadow-xl shadow-primary/30">
            <span className="material-symbols-outlined text-[28px]">auto_stories</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-primary leading-none">Scholar Script</span>
            <span className="text-tiny font-black text-on-surface-variant tracking-[0.3em] uppercase opacity-60">The Fluid Academy</span>
          </div>
        </Link>
        <div className="hidden lg:flex gap-8 items-center">
          <Link className="text-small font-black uppercase tracking-widest text-primary border-b-2 border-primary pb-1" href="/">Trang chủ</Link>
          <Link className="text-small font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all duration-300" href="#">Thư viện</Link>
          <Link className="text-small font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all duration-300" href="#">Cộng đồng</Link>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {setSearch && (
          <div className="relative hidden xl:block group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors">search</span>
            <input 
              value={search || ""}
              onChange={e => setSearch(e.target.value)}
              className="bg-surface/50 border border-border rounded-2xl py-3 pl-12 pr-6 text-small font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary w-80 transition-all duration-300 outline-none" 
              placeholder="Tìm kiếm bài tập, bài học..." 
              type="text" 
            />
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <LanguageToggle />
          {session ? (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 pl-2 pr-5 py-2 rounded-2xl text-small font-black transition-all hover:bg-primary/5 active:scale-95 border border-border group"
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-primary/20 shrink-0 group-hover:border-primary transition-colors">
                  <img 
                    src={session.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.id}`} 
                    alt="User avatar" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate text-on-surface">{session.name || "User"}</span>
                <span className={`material-symbols-outlined text-[18px] transition-transform duration-500 ${isMenuOpen ? "rotate-180" : ""}`}>expand_more</span>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-4 w-64 glass-dark text-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-top-4 duration-300 origin-top-right z-[60]">
                  <div className="p-6 border-b border-white/10">
                    <p className="text-tiny font-black text-primary uppercase tracking-widest mb-2">{session.role || "MEMBER"}</p>
                    <p className="font-bold text-base truncate">{session.name}</p>
                  </div>
                  <div className="p-3">
                    <Link 
                      href={dashboardHref}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-small font-bold hover:bg-white/10 transition-all group"
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">dashboard</span>
                      Bảng điều khiển
                    </Link>
                    <Link 
                      href={`/profile/${session.id}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-small font-bold hover:bg-white/10 transition-all group"
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">person</span>
                      Hồ sơ cá nhân
                    </Link>
                  </div>
                  <div className="p-3 border-t border-white/10">
                    <button 
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-small font-bold text-tertiary hover:bg-tertiary/10 transition-all group"
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">logout</span>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <LoginButton className="bg-primary text-on-primary px-8 py-3 rounded-2xl font-black text-small uppercase tracking-widest hover:scale-105 hover:shadow-xl shadow-primary/30 transition-all">
              Bắt đầu ngay
            </LoginButton>
          )}
        </div>
      </div>
    </nav>

  )
}

