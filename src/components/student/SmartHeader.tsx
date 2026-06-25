"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { LoginButton } from "@/components/LoginButton"
import { signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useScrollDirection } from "@/hooks/useScrollDirection"

interface SmartHeaderProps {
  session: { id: string; name: string | null; image: string | null; role: string | null; studyAgeGroup?: string | null } | null
}

export function SmartHeader({ session }: SmartHeaderProps) {
  const t = useTranslations("header")
  const pathname = usePathname()
  const isDetailOrRunPage = (pathname?.includes('/lessons/') && pathname !== '/student/lessons') || 
                            (pathname?.includes('/assignments/') && pathname !== '/student/assignments')
  
  const { isHidden, isAtTop } = useScrollDirection()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isGameRoute = pathname?.includes('/student/game')
  const shouldHide = isGameRoute ? !isAtTop : isHidden

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
        style={{ display: shouldHide ? 'none' : 'block' }}
      />
      
      {/* Header */}
      <header 
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[1440px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          shouldHide 
            ? '-translate-y-40 opacity-0 pointer-events-none' 
            : 'translate-y-0 opacity-100'
        }`}
      >
        <nav className="bg-white/70 backdrop-blur-xl border border-primary/10 rounded-full shadow-2xl flex justify-between items-center px-3 sm:px-6 md:px-10 py-2.5 sm:py-4">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-1.5 sm:gap-3 group">
                <img 
                  src="/images/logo.png" 
                  alt="Dolcake" 
                  className="w-9 h-9 sm:w-12 sm:h-12 object-contain group-hover:rotate-12 transition-transform duration-700 shrink-0" 
                />
                <div className="flex flex-col">
                  <span className="font-headline font-black text-lg sm:text-2xl tracking-tighter text-primary leading-none">Dolcake</span>
                  <span className="text-[8px] font-black text-primary/40 tracking-[0.4em] uppercase hidden sm:block">Student Portal</span>
                </div>
              </Link>
              <div className="hidden lg:flex gap-8 items-center">
                {!(session?.studyAgeGroup && (
                  session.studyAgeGroup.toLowerCase().includes("kindergarten") || 
                  session.studyAgeGroup.toLowerCase().includes("kindergarden") || 
                  session.studyAgeGroup === "KINDERGARTEN (< 6 YEARS)" ||
                  session.studyAgeGroup === "kids-2-5"
                )) && (
                  <Link 
                    className="px-4 py-2 rounded-full font-black uppercase tracking-widest text-small text-white bg-gradient-to-r from-primary to-primary-container shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.05] active:scale-95 transition-all duration-300 flex items-center gap-1.5 shrink-0" 
                    href="/student/game/robot-chat"
                  >
                    <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                    <span>{t("chatWithDolbot")}</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
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
                <LoginButton className="bg-primary text-on-primary px-8 py-3 rounded-2xl font-black text-small uppercase tracking-widest hover:scale-105 hover:shadow-xl shadow-primary/30 transition-all">
                  {t("getStarted")}
                </LoginButton>
              )}
            </div>
          </nav>
      </header>
    </>
  )
}
