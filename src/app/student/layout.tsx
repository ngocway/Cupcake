import React from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { MainContentWrapper } from "@/app/student/_components/MainContentWrapper"
import { PublicHeader } from "@/components/public/PublicHeader"
import { getTranslations } from "next-intl/server"
import { fetchWithRedis } from "@/lib/cached-queries"
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
    studyAgeGroup = await fetchWithRedis(
      `user:study-age-group:${session.user.id}`,
      3600,
      async () => {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { studyAgeGroup: true }
        });
        return dbUser?.studyAgeGroup ?? null;
      }
    );
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
    </div>
  )
}
