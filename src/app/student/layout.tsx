import React from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { MainContentWrapper } from "@/app/student/_components/MainContentWrapper"
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
    <div className="min-h-screen font-body text-slate-900 dark:text-white relative">
      <MainContentWrapper isTeacher={isTeacher}>
        <PublicHeader session={publicSession} />
        {children}
      </MainContentWrapper>

      {/* BottomNavBar (Mobile Only) */}
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
