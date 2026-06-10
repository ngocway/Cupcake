import React, { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { NotificationBell } from "@/components/common/NotificationBell"
import { SideNavWrapper } from "@/app/student/_components/SideNavWrapper"
import { MainContentWrapper } from "@/app/student/_components/MainContentWrapper"
import { SideNavItem } from "@/app/student/_components/SideNavItem"
import { SmartHeader } from "@/components/student/SmartHeader"
import { getTranslations } from "next-intl/server"
import { LayoutDashboard, BookOpen, ClipboardList, Users, TrendingUp } from "lucide-react"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const t = await getTranslations("sidebar")
  
  if (!session) {
    return <>{children}</>
  }
  
  if (!session.user.role) {
    redirect("/role-select")
  }
  
  const isTeacher = session.user.role === "TEACHER";
  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN" && !isTeacher) {
    redirect("/teacher/dashboard")
  }

  const publicSession = {
    id: session.user.id!,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    role: (session.user as any).role ?? null
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-body text-slate-900 dark:text-white">
      <SmartHeader session={publicSession} />
      
      {/* Admin/Teacher Impersonation Floating Button */}
      {(session.user.role === 'ADMIN' || isTeacher) && (
        <a
          href={isTeacher ? "/teacher/materials" : "/admin/staff"}
          className={`fixed z-[100] bottom-24 md:bottom-8 right-6 flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 border group ${
            isTeacher 
              ? 'bg-primary/95 text-white border-white/20 hover:bg-primary shadow-primary/30' 
              : 'bg-amber-500/95 text-amber-950 border-amber-900/20 hover:bg-amber-500 shadow-amber-500/30'
          } backdrop-blur-md`}
        >
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isTeacher ? 'bg-white/20' : 'bg-amber-950/10'}`}>
            <span className="material-symbols-outlined text-[18px]">
              {isTeacher ? 'visibility' : 'admin_panel_settings'}
            </span>
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest">
              {isTeacher ? t("studentViewMode") : t("adminViewMode")}
            </span>
            <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1">
              <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
              {isTeacher ? t("backToLibrary") : t("exitToAdmin")}
            </span>
          </div>
        </a>
      )}
      {/* TopNavBar */}
      {/* TopNavBar removed as per user request to hide header on non-homepage routes */}
 
      {/* SideNavBar - Controlled by Wrapper */}
      <SideNavWrapper isTeacher={isTeacher}>
        <Suspense fallback={<div className="flex-1 px-4 pb-6 pt-0 space-y-8" />}>
          <nav className="flex-1 px-4 pb-6 pt-0 space-y-8">
            <div>
              <div className="space-y-1 mb-6">
                <SideNavItem href="/student/dashboard" icon="dashboard" label={t("dashboard")} />
              </div>
              
              <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t("exploreKnowledge")}</p>
              <div className="space-y-1">
                <SideNavItem href="/student/lessons?source=public" icon="explore" label={t("lessons")} />
                <SideNavItem href="/student/assignments?source=public" icon="language" label={t("assignments")} />
              </div>
            </div>
  
            <div>
              <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t("classContent")}</p>
              <div className="space-y-1">
                <SideNavItem href="/student/lessons?source=class" icon="menu_book" label={t("lessons")} comingSoon />
                <SideNavItem href="/student/assignments?source=class" icon="assignment" label={t("assignments")} comingSoon />
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <SideNavItem href="/student/bookmarks" icon="bookmark" label={t("bookmarks")} />
              <SideNavItem href="/student/classes" icon="group" label={t("classes")} comingSoon />
              <SideNavItem href="/student/my-reviews" icon="star" label={t("myReviews")} />
              <SideNavItem href="/student/growth" icon="trending_up" label={t("growth")} comingSoon />
            </div>
          </nav>
        </Suspense>
        
        <div className="p-4">
          <button className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-3 rounded-full font-label text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            {t("joinLiveClass")}
          </button>
        </div>
      </SideNavWrapper>
 
      {/* Main Content Canvas - Controlled by Wrapper */}
      <MainContentWrapper isTeacher={isTeacher}>
        {children}
      </MainContentWrapper>
 
      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around items-center py-4 md:hidden z-50">
        <Link className="flex flex-col items-center gap-1 text-primary" href="/student/dashboard">
          <LayoutDashboard className="w-6 h-6 stroke-[2.5px]" />
          <span className="text-[10px] font-label font-bold">{t("dash")}</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-slate-400" href="/student/lessons">
          <BookOpen className="w-6 h-6 stroke-2" />
          <span className="text-[10px] font-label font-bold">{t("lessons")}</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-slate-400" href="/student/assignments">
          <ClipboardList className="w-6 h-6 stroke-2" />
          <span className="text-[10px] font-label font-bold">{t("work")}</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-slate-400" href="/student/classes">
          <Users className="w-6 h-6 stroke-2" />
          <span className="text-[10px] font-label font-bold">{t("class")}</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-slate-400" href="/student/growth">
          <TrendingUp className="w-6 h-6 stroke-2" />
          <span className="text-[10px] font-label font-bold">{t("growth")}</span>
        </Link>
      </nav>
 
    </div>
  )
}
