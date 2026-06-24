"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { LoginButton } from "@/components/LoginButton"
import { signOut } from "next-auth/react"

import { usePathname } from "next/navigation"

import { useTranslations } from "next-intl"
import { useContentStore } from "@/store/useContentStore"

interface PublicHeaderProps {
  session: { id: string; name: string | null; image: string | null; role: string | null; studyAgeGroup?: string | null } | null
  search?: string
  setSearch?: (val: string) => void
  isPendingSearch?: boolean
}

export function PublicHeader({ session, search, setSearch, isPendingSearch }: PublicHeaderProps) {
  const t = useTranslations("header")
  const pathname = usePathname()
  
  const isDetailOrRunPage = (pathname?.includes('/lessons/') && pathname !== '/student/lessons') || 
                            (pathname?.includes('/assignments/') && pathname !== '/student/assignments')
  
  const studyAgeGroup = useContentStore(s => (s as any).studyAgeGroup)
  const effectiveAgeGroup = session?.studyAgeGroup || studyAgeGroup || "";
  const isKindergarten = 
    effectiveAgeGroup.toLowerCase().includes("kindergarten") || 
    effectiveAgeGroup.toLowerCase().includes("kindergarden") || 
    effectiveAgeGroup === "KINDERGARTEN (< 6 YEARS)" ||
    effectiveAgeGroup === "kids-2-5";

  if (isDetailOrRunPage) return null;

  const [isAtTop, setIsAtTop] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [localSearch, setLocalSearch] = useState(search || "")

  useEffect(() => {
    setLocalSearch(search || "")
  }, [search])

  const handleTriggerSearch = () => {
    if (setSearch && localSearch !== (search || "")) {
      setSearch(localSearch)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20)
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("mousedown", handleClickOutside)
    
    // Also run once on mount to set initial state correctly
    handleScroll()
    
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const dashboardHref = session?.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard"

  const isActive = (path: string) => pathname === path

  return (
    <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center px-3 sm:px-6 md:px-10 py-2.5 sm:py-4 w-[95%] max-w-[1440px] bg-white/70 backdrop-blur-xl border border-primary/10 rounded-full shadow-2xl transition-all duration-700 ease-in-out ${isAtTop ? "translate-y-0 opacity-100" : "-translate-y-40 opacity-0 pointer-events-none"}`}>
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-3 group">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-primary text-on-primary rounded-full flex items-center justify-center font-black group-hover:rotate-12 transition-all duration-700 shadow-xl shadow-primary/20 shrink-0">
            <span className="material-symbols-outlined text-[20px] sm:text-[28px] animate-leaf-sway">eco</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-black text-lg sm:text-2xl tracking-tighter text-primary leading-none">Cupcakes</span>
            <span className="text-[8px] font-black text-primary/40 tracking-[0.4em] uppercase hidden sm:block">Student Portal</span>
          </div>
        </Link>
        <div className="hidden lg:flex gap-8 items-center">
          {!isKindergarten && (
            <>
              <Link 
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${isActive('/flashcards') ? 'text-primary scale-110' : 'text-primary/80 hover:text-primary hover:scale-105'}`} 
                href="/flashcards"
              >
                {t("flashcards")}
              </Link>
              <Link 
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${isActive('/student/game') ? 'text-primary scale-110' : 'text-primary/80 hover:text-primary hover:scale-105'}`} 
                href="/student/game"
              >
                {t("game")}
              </Link>
              <Link 
                className="px-4 py-2 rounded-full font-black uppercase tracking-[0.1em] text-[10px] text-white bg-gradient-to-r from-primary to-primary-container shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.05] active:scale-95 transition-all duration-300 flex items-center gap-1.5 shrink-0" 
                href="/student/game/robot-chat"
              >
                <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                <span>{t("chatWithDolbot")}</span>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {setSearch && (
          <div className="relative hidden xl:block group">
            {isPendingSearch ? (
              <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <span 
                onClick={handleTriggerSearch}
                className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-all duration-500 cursor-pointer hover:scale-110 z-10"
              >
                search
              </span>
            )}
            <input 
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTriggerSearch()}
              className="bg-primary/5 border-transparent rounded-full py-3.5 pl-14 pr-8 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary/20 w-80 transition-all duration-500 outline-none placeholder:text-primary/20" 
              placeholder={t("searchPlaceholder")} 
              type="text" 
            />
          </div>
        )}
        
        <div className="flex items-center gap-4">
          {session ? (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 pl-1.5 pr-4 py-1.5 bg-surface-container-low border border-primary/10 rounded-full text-on-surface-variant/80 hover:text-primary transition-all active:scale-95 group"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-primary/20 shrink-0 group-hover:border-primary transition-colors">
                  <img 
                    src={session.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.id}`} 
                    alt="User avatar" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate text-xs font-bold">{session.name || t("profile")}</span>
                <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${isMenuOpen ? "rotate-180" : ""}`}>expand_more</span>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-primary/10 rounded-[24px] shadow-2xl py-2 z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-5 py-4 border-b border-primary/10 mb-2">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{session.role || "MEMBER"}</p>
                    <p className="font-bold text-sm text-on-surface truncate">{session.name}</p>
                  </div>
                  <div className="flex flex-col">
                    <Link 
                      href={dashboardHref}
                      onClick={() => setIsMenuOpen(false)}
                      className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors flex items-center gap-3 ${
                        isActive(dashboardHref) 
                          ? "bg-primary/5 text-primary" 
                          : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">dashboard</span>
                      <span>{t("dashboard")}</span>
                    </Link>
                    <Link 
                      href={`/profile/${session.id}`}
                      onClick={() => setIsMenuOpen(false)}
                      className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors flex items-center gap-3 ${
                        isActive(`/profile/${session.id}`) 
                          ? "bg-primary/5 text-primary" 
                          : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      <span>{t("profile")}</span>
                    </Link>
                    
                    <div className="h-px bg-primary/5 my-2 mx-4" />
                    
                    <Link 
                      href="/student/my-learning/assignments"
                      onClick={() => setIsMenuOpen(false)}
                      className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors flex items-center gap-3 ${
                        isActive('/student/my-learning/assignments') 
                          ? "bg-primary/5 text-primary" 
                          : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">assignment</span>
                      <span>{t("myAssignments")}</span>
                    </Link>
                    <Link 
                      href="/student/lessons?filter=completed"
                      onClick={() => setIsMenuOpen(false)}
                      className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors flex items-center gap-3 ${
                        pathname.includes('/student/lessons') 
                          ? "bg-primary/5 text-primary" 
                          : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">history_edu</span>
                      <span>{t("learnedLessons")}</span>
                    </Link>
                    <Link 
                      href="/student/bookmarks"
                      onClick={() => setIsMenuOpen(false)}
                      className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors flex items-center gap-3 ${
                        isActive('/student/bookmarks') 
                          ? "bg-primary/5 text-primary" 
                          : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">bookmark</span>
                      <span>{t("myBookmarks")}</span>
                    </Link>
                    <Link 
                      href="/student/reviews"
                      onClick={() => setIsMenuOpen(false)}
                      className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors flex items-center gap-3 ${
                        isActive('/student/reviews') 
                          ? "bg-primary/5 text-primary" 
                          : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">star</span>
                      <span>{t("myReviews")}</span>
                    </Link>
                    
                    <div className="h-px bg-primary/5 mt-2 mb-1" />
                    
                    <button 
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full text-left px-5 py-3 text-xs font-bold transition-colors flex items-center gap-3 text-error/80 hover:bg-error/10 hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>{t("logout")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <LoginButton className="bg-primary text-on-primary px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs md:text-small uppercase tracking-wider sm:tracking-widest hover:scale-105 hover:shadow-xl shadow-primary/30 transition-all">
              {t("getStarted")}
            </LoginButton>
          )}
        </div>
      </div>
    </nav>

  )
}

