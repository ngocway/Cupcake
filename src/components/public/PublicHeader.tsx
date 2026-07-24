"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { LoginButton } from "@/components/LoginButton"
import { signOut } from "next-auth/react"

import { usePathname } from "next/navigation"

import { useTranslations } from "next-intl"
import { useContentStore } from "@/store/useContentStore"

const LANG_LABELS: Record<string, string> = {
  vi: "Tiếng Việt", th: "ภาษาไทย", id: "Bahasa Indonesia",
  zh: "Mandarin Chinese", hi: "Hindi", ja: "Japanese",
  es: "Spanish", ar: "Arabic", fr: "French", ko: "Korean",
  pt: "Portuguese", ru: "Russian", de: "German", other: "Other language",
}

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
                            (pathname?.includes('/assignments/') && pathname !== '/student/assignments') ||
                            (pathname?.includes('/books/') && pathname !== '/student/books')
  
  const studyAgeGroup = useContentStore(s => (s as any).studyAgeGroup)
  const nativeLanguage = useContentStore(s => s.nativeLanguage)
  const setFilterModalOpen = useContentStore(s => (s as any).setFilterModalOpen)
  const effectiveAgeGroup = session?.studyAgeGroup || studyAgeGroup || "";
  const isKindergarten = 
    effectiveAgeGroup.toLowerCase().includes("kindergarten") || 
    effectiveAgeGroup.toLowerCase().includes("kindergarden") || 
    effectiveAgeGroup === "KINDERGARTEN (< 6 YEARS)" ||
    effectiveAgeGroup === "kids-2-5";

  const isAtTop = true
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [localSearch, setLocalSearch] = useState(search || "")

  useEffect(() => {
    setLocalSearch(search || "")
  }, [search])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener("mousedown", handleClickOutside)
    
    return () => {
      window.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  if (isDetailOrRunPage) return null;

  const handleTriggerSearch = () => {
    if (setSearch && localSearch !== (search || "")) {
      setSearch(localSearch)
    }
  }

  const dashboardHref = session?.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard"


  const isActive = (path: string) => pathname === path

  return (
    <nav className="relative mt-6 mx-auto z-50 flex justify-between items-center px-3 sm:px-6 md:px-10 py-2.5 sm:py-4 w-[95%] max-w-[1440px] bg-white/95 border border-primary/10 rounded-full shadow-2xl">
      <div className="flex items-center gap-2 sm:gap-10">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-3 group">
          <img 
            src="/images/logo.png" 
            alt="Dolcake" 
            className="w-9 h-9 sm:w-12 sm:h-12 object-contain group-hover:rotate-12 transition-transform duration-700 shrink-0" 
          />
          <div className="flex-col hidden sm:flex">
            <span className="font-headline font-black text-lg sm:text-2xl tracking-tighter text-primary leading-none">Dolcake</span>
            <span className="text-[8px] font-black text-primary/40 tracking-[0.4em] uppercase hidden sm:block">Student Portal</span>
          </div>
        </Link>
        {/* Removed top header buttons — moved to sidebar */}
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
                      href="/student/my-reviews"
                      onClick={() => setIsMenuOpen(false)}
                      className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors flex items-center gap-3 ${
                        isActive('/student/my-reviews') 
                          ? "bg-primary/5 text-primary" 
                          : "text-on-surface-variant/70 hover:bg-surface-container-low hover:text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">star</span>
                      <span>{t("myReviews")}</span>
                    </Link>
                    
                    <div className="h-px bg-primary/5 mt-2 mb-1" />

                    {/* Age group + native language — click to open preferences modal */}
                    <button
                      onClick={() => { setFilterModalOpen(true); setIsMenuOpen(false); }}
                      className="w-full text-left px-5 py-3 transition-colors group hover:bg-surface-container-low"
                    >
                      <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
                        <span className="text-primary/40 group-hover:text-primary/60">I&apos;m a</span>
                        <span className="border border-sky-300 px-1.5 py-0.5 bg-sky-50 text-sky-800 rounded-full">
                          {(effectiveAgeGroup === "kindergarten" || effectiveAgeGroup === "kindergarden") ? "< 6 years"
                            : effectiveAgeGroup || "Learner"}
                        </span>
                        <span className="text-primary/40 group-hover:text-primary/60">speaking</span>
                        <span className="border border-amber-300 px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded-full">
                          {LANG_LABELS[nativeLanguage] || "English"}
                        </span>
                        <span className="material-symbols-outlined text-[13px] text-primary/30 group-hover:text-primary ml-0.5">settings</span>
                      </div>
                    </button>

                    <div className="h-px bg-primary/5 mt-1 mb-1" />

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

