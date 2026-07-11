import React, { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { NotificationBell } from "@/components/common/NotificationBell"
import { SideNavWrapper } from "@/app/student/_components/SideNavWrapper"
import { MainContentWrapper } from "@/app/student/_components/MainContentWrapper"
import { SideNavItem } from "@/app/student/_components/SideNavItem"
import { PublicHeader } from "@/components/public/PublicHeader"
import { BottomNav } from "@/app/student/_components/BottomNav"
import { getTranslations } from "next-intl/server"
import prisma from "@/lib/prisma"

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

  let studyAgeGroup = null;
  if (session.user.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { studyAgeGroup: true }
    });
    studyAgeGroup = dbUser?.studyAgeGroup;
  }

  const publicSession = {
    id: session.user.id!,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    role: (session.user as any).role ?? null,
    studyAgeGroup
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-body text-slate-900 dark:text-white relative">
      
 
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
 
      <MainContentWrapper isTeacher={isTeacher}>
        <PublicHeader session={publicSession} />
        {children}
      </MainContentWrapper>
 
      {/* BottomNavBar (Mobile Only) — client component handles auth/game page detection */}
      <BottomNav
        labels={{
          dash: t("dash"),
          lessons: t("lessons"),
          work: t("work"),
          class: t("class"),
          growth: t("growth"),
        }}
      />
 
    </div>
  )
}
