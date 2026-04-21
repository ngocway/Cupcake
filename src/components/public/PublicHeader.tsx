"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { LoginButton } from "@/components/LoginButton"
import { LanguageToggle } from "@/components/LanguageToggle"

interface PublicHeaderProps {
  session: { id: string; name: string | null; image: string | null; role: string | null } | null
  search?: string
  setSearch?: (val: string) => void
}

export function PublicHeader({ session, search, setSearch }: PublicHeaderProps) {
  const [isAtTop, setIsAtTop] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-3 max-w-[1440px] mx-auto bg-white/70 backdrop-blur-md rounded-full mt-4 mx-4 shadow-[0px_20px_40px_rgba(0,51,68,0.06)] font-display tracking-tight transition-all duration-500 ease-in-out ${isAtTop ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"}`}>
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-on-primary font-black group-hover:rotate-12 transition-all shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">auto_stories</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter text-on-surface leading-none">Scholar Script</span>
            <span className="text-[9px] font-bold text-primary tracking-[0.2em] uppercase opacity-70">The Fluid Academy</span>
          </div>
        </Link>
        <div className="hidden md:flex gap-6 items-center">
          <Link className="text-primary font-extrabold hover:scale-105 transition-all duration-200" href="/">Trang chủ</Link>
          <Link className="text-on-surface-variant/60 font-medium hover:scale-105 hover:text-primary transition-all duration-200" href="#">Thư viện</Link>
          <Link className="text-on-surface-variant/60 font-medium hover:scale-105 hover:text-primary transition-all duration-200" href="#">Cộng đồng</Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {setSearch && (
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40">search</span>
            <input 
              value={search || ""}
              onChange={e => setSearch(e.target.value)}
              className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-container w-64 transition-all" 
              placeholder="Tìm kiếm bài học..." 
              type="text" 
            />
          </div>
        )}
        {session ? (
          <Link href={session.role === "TEACHER" ? "/teacher/dashboard" : "/student/dashboard"} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:opacity-80" style={{ background: "#ccedff" }}>
            <img src={session.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.id}`} alt="" className="w-6 h-6 rounded-full" />
            Dashboard
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <LoginButton className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20">
              Join Now
            </LoginButton>
          </div>
        )}
      </div>
    </nav>
  )
}
