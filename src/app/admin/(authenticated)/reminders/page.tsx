import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import {
  getMonthlyReminderStats,
  getInactiveStudentsRoster,
  getEmailHistory,
  getReminderSettings,
} from "@/lib/reminders/inactive-students"
import { getInactiveTeachersRoster } from "@/lib/reminders/inactive-teachers"
import { RemindersDashboard } from "./RemindersDashboard"

export const metadata = {
  title: "Quản lý Email & Nhắc nhở | Dolcake Admin",
}

export default async function AdminRemindersPage() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin/login")
  }

  const [stats, roster, teacherRoster, history, settings, classes] = await Promise.all([
    getMonthlyReminderStats(),
    getInactiveStudentsRoster(),
    getInactiveTeachersRoster(),
    getEmailHistory(60),
    getReminderSettings(),
    prisma.class.findMany({
      where: { isBlocked: false },
      select: { id: true, name: true, classCode: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <RemindersDashboard
      initialStats={stats}
      initialRoster={roster}
      initialTeacherRoster={teacherRoster}
      initialHistory={history}
      initialSettings={settings}
      classes={classes}
    />
  )
}
