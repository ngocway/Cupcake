"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { LoginButton } from "@/components/LoginButton"
import { LanguageToggle } from "@/components/LanguageToggle"
import { signOut } from "next-auth/react"

import { usePathname } from "next/navigation"

import { useTranslations } from "next-intl"

interface PublicHeaderProps {
  session: { id: string; name: string | null; image: string | null; role: string | null } | null
  search?: string
  setSearch?: (val: string) => void
}

export function PublicHeader({ session, search, setSearch }: PublicHeaderProps) {
  const t = useTranslations("header")
  const pathname = usePathname()
  
  const isDetailOrRunPage = (pathname?.includes('/lessons/') && pathname !== '/student/lessons') || 
                            (pathname?.includes('/assignments/') && pathname !== '/student/assignments')
  
  if (isDetailOrRunPage) return null;

  const [isAtTop, setIsAtTop] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = (e: Event) => {
      let scrollY = window.scrollY
      if (e.target && e.target !== document) {
        const target = e.target as HTMLElement
        if (target.scrollTop !== undefined) {
          scrollY = target.scrollTop
        }
      }
      setIsAtTop(scrollY < 20)
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("scroll", handleScroll, { passive: true, capture: true })
    window.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("scroll", handleScroll, { capture: true })
      window.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const dashboardHref = session?.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard"

  const isActive = (path: string) => pathname === path

  return (
    <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center px-6 md:px-10 py-4 w-[95%] max-w-[1440px] bg-white/70 backdrop-blur-xl border border-primary/10 rounded-full shadow-2xl transition-all duration-700 ease-in-out ${isAtTop ? "translate-y-0 opacity-100" : "-translate-y-40 opacity-0 pointer-events-none"}`}>
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center text-on-primary font-black group-hover:rotate-12 transition-all duration-700 shadow-xl shadow-primary/20">
            <span className="material-symbols-outlined text-[28px] animate-leaf-sway">eco</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-black text-2xl tracking-tighter text-primary leading-none">Cupcakes</span>
            <span className="text-[8px] font-black text-primary/40 tracking-[0.4em] uppercase">Student Portal</span>
          </div>
        </Link>
        <div className="hidden lg:flex gap-8 items-center">
          <Link 
            className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${isActive('/') ? 'text-primary scale-110' : 'text-foreground/40 hover:text-primary hover:scale-105'}`} 
            href="/"
          >
            {t("home")}
          </Link>
          <Link className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 hover:text-primary transition-all duration-500 hover:scale-105" href="#">{t("library")}</Link>
          <Link className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 hover:text-primary transition-all duration-500 hover:scale-105" href="#">{t("community")}</Link>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {setSearch && (
          <div className="relative hidden xl:block group">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-all duration-500">search</span>
            <input 
              value={search || ""}
              onChange={e => setSearch(e.target.value)}
              className="bg-primary/5 border-transparent rounded-full py-3.5 pl-14 pr-8 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary/20 w-80 transition-all duration-500 outline-none placeholder:text-primary/20" 
              placeholder={t("searchPlaceholder")} 
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
                className="flex items-center gap-3 pl-2 pr-6 py-2 rounded-full text-sm font-black transition-all hover:bg-primary/5 active:scale-95 border border-primary/5 group"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/10 shrink-0 group-hover:border-primary transition-all duration-500">
                  <img 
                    src={session.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.id}`} 
                    alt="User avatar" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate text-primary/80">{session.name || t("profile")}</span>
                <span className={`material-symbols-outlined text-[20px] text-primary/40 transition-transform duration-700 ${isMenuOpen ? "rotate-180" : ""}`}>expand_more</span>
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
                      className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-small font-bold hover:bg-white/10 transition-all group ${isActive(dashboardHref) ? 'bg-white/10 text-primary' : 'text-white/70'}`}
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">dashboard</span>
                      <div className="flex items-center justify-between flex-1">
                        <span>{t("dashboard")}</span>
                      </div>
                    </Link>
                    <Link 
                      href={`/profile/${session.id}`}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-small font-bold hover:bg-white/10 transition-all group ${isActive(`/profile/${session.id}`) ? 'bg-white/10 text-primary' : 'text-white/70'}`}
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">person</span>
                      {t("profile")}
                    </Link>
                    
                    <div className="h-px bg-white/5 my-1 mx-2" />
                    
                    <Link 
                      href="/student/my-learning/assignments"
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-small font-bold hover:bg-white/10 transition-all group ${isActive('/student/my-learning/assignments') ? 'bg-white/10 text-primary' : 'text-white/70'}`}
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">assignment</span>
                      {t("myAssignments")}
                    </Link>
                    <Link 
                      href="/student/lessons?filter=completed"
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-small font-bold hover:bg-white/10 transition-all group ${pathname.includes('/student/lessons') ? 'bg-white/10 text-primary' : 'text-white/70'}`}
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">history_edu</span>
                      {t("learnedLessons")}
                    </Link>
                    <Link 
                      href="/student/bookmarks"
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-small font-bold hover:bg-white/10 transition-all group ${isActive('/student/bookmarks') ? 'bg-white/10 text-primary' : 'text-white/70'}`}
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">bookmark</span>
                      {t("myBookmarks")}
                    </Link>
                    <Link 
                      href="/student/reviews"
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-small font-bold hover:bg-white/10 transition-all group ${isActive('/student/reviews') ? 'bg-white/10 text-primary' : 'text-white/70'}`}
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">star</span>
                      {t("myReviews")}
                    </Link>
                  </div>
                  <div className="p-3 border-t border-white/10">
                    <button 
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-small font-bold text-tertiary hover:bg-tertiary/10 transition-all group"
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">logout</span>
                      {t("logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <LoginButton className="bg-primary text-on-primary px-8 py-3 rounded-2xl font-black text-small uppercase tracking-widest hover:scale-105 hover:shadow-xl shadow-primary/30 transition-all">
              {t("getStarted")}
            </LoginButton>
          )}
        </div>
      </div>
    </nav>

  )
}

