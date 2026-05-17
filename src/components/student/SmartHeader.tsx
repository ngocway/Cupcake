"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { LoginButton } from "@/components/LoginButton"
import { LanguageToggle } from "@/components/LanguageToggle"
import { signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useScrollDirection } from "@/hooks/useScrollDirection"

interface SmartHeaderProps {
  session: { id: string; name: string | null; image: string | null; role: string | null } | null
}

export function SmartHeader({ session }: SmartHeaderProps) {
  const t = useTranslations("header")
  const pathname = usePathname()
  const isDetailOrRunPage = (pathname?.includes('/lessons/') && pathname !== '/student/lessons') || 
                            (pathname?.includes('/assignments/') && pathname !== '/student/assignments')
  
  const { isHidden } = useScrollDirection()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  if (isDetailOrRunPage) return null;

  const dashboardHref = session?.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard"

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* Spacer - maintains space when header is hidden */}
      <div 
        className="h-[96px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ display: isHidden ? 'none' : 'block' }}
      />
      
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isHidden 
            ? '-translate-y-full opacity-0' 
            : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="w-[95%] max-w-[1440px] pt-6">
          <nav className="glass rounded-[32px] shadow-2xl flex justify-between items-center px-6 md:px-10 py-4">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-12 h-12 bg-primary text-on-primary rounded-[18px] flex items-center justify-center font-black group-hover:rotate-12 transition-all duration-500 shadow-xl shadow-primary/30">
                  <span className="material-symbols-outlined text-[28px]">auto_stories</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-2xl tracking-tighter text-primary leading-none">Scholar Script</span>
                  <span className="text-tiny font-black text-on-surface-variant tracking-[0.3em] uppercase opacity-60">The Fluid Academy</span>
                </div>
              </Link>
              <div className="hidden lg:flex gap-8 items-center">
                <Link 
                  className={`text-small font-black uppercase tracking-widest transition-all duration-300 ${isActive('/') ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary'}`} 
                  href="/"
                >
                  {t("home")}
                </Link>
                <Link className="text-small font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all duration-300" href="#">{t("library")}</Link>
                <Link className="text-small font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all duration-300" href="#">{t("community")}</Link>
              </div>
            </div>

            <div className="flex items-center gap-6">
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
                    <span className="hidden sm:inline-block max-w-[120px] truncate">{session.name || t("profile")}</span>
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
                          href="/student/my-reviews"
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-small font-bold hover:bg-white/10 transition-all group ${isActive('/student/my-reviews') ? 'bg-white/10 text-primary' : 'text-white/70'}`}
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
          </nav>
        </div>
      </header>
    </>
  )
}
