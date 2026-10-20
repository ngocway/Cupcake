import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import {
  getMonthlyReminderStats,
  getInactiveStudentsRoster,
  getEmailHistory,
  getReminderSettings,
  saveReminderSettings,
  checkAndSendInactiveStudentReminders,
} from "@/lib/reminders/inactive-students"
import {
  getInactiveTeachersRoster,
  checkAndSendInactiveTeacherReminders,
} from "@/lib/reminders/inactive-teachers"
import {
  sendInactiveReminderEmail,
  sendTeacherGameReminderEmail,
} from "@/lib/email"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get("classId") || undefined

    const [stats, roster, teacherRoster, history, settings, classes] = await Promise.all([
      getMonthlyReminderStats(),
      getInactiveStudentsRoster(classId),
      getInactiveTeachersRoster(),
      getEmailHistory(60),
      getReminderSettings(),
      prisma.class.findMany({
        where: { isBlocked: false },
        select: { id: true, name: true, classCode: true },
        orderBy: { createdAt: "desc" },
      }),
    ])

    return NextResponse.json({
      success: true,
      stats,
      roster,
      teacherRoster,
      history,
      settings,
      classes,
    })
  } catch (error: any) {
    console.error("[Admin Reminders API GET Error]:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body

    // 1. Student Actions
    if (action === "scan") {
      const { classId, dryRun } = body
      const report = await checkAndSendInactiveStudentReminders({
        classId: classId || undefined,
        dryRun: Boolean(dryRun),
      })
      return NextResponse.json({ success: true, report })
    }

    if (action === "send_single") {
      const { studentId, classId } = body
      if (!studentId || !classId) {
        return NextResponse.json({ error: "studentId and classId required" }, { status: 400 })
      }
      const report = await checkAndSendInactiveStudentReminders({
        studentId,
        classId,
        forceSkipCooldown: true,
      })
      return NextResponse.json({ success: true, report })
    }

    if (action === "send_test") {
      const { testEmail, studentName, className } = body
      if (!testEmail || !testEmail.includes("@")) {
        return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 })
      }

      const emailRes = await sendInactiveReminderEmail({
        studentName: studentName || "Minh Khôi",
        studentEmail: testEmail,
        className: className || "45 Ngày Từ Vựng Cơ Bản",
        classCode: "DEMO-45D",
        classId: "demo-class",
        inactiveDays: 3,
      })

      return NextResponse.json({ success: emailRes.success, emailRes })
    }

    // 2. Teacher Actions
    if (action === "scan_teachers") {
      const { dryRun } = body
      const report = await checkAndSendInactiveTeacherReminders({
        dryRun: Boolean(dryRun),
      })
      return NextResponse.json({ success: true, report })
    }

    if (action === "send_teacher_single") {
      const { teacherId } = body
      if (!teacherId) {
        return NextResponse.json({ error: "teacherId required" }, { status: 400 })
      }
      const report = await checkAndSendInactiveTeacherReminders({
        teacherId,
        forceSkipCooldown: true,
      })
      return NextResponse.json({ success: true, report })
    }

    if (action === "send_teacher_test") {
      const { testEmail, teacherName } = body
      if (!testEmail || !testEmail.includes("@")) {
        return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 })
      }

      const emailRes = await sendTeacherGameReminderEmail({
        teacherName: teacherName || "Thầy Ngọc",
        teacherEmail: testEmail,
        inactiveDays: 7,
      })

      return NextResponse.json({ success: emailRes.success, emailRes })
    }

    // 3. Settings Actions
    if (action === "save_settings") {
      const { settings } = body
      if (!settings) {
        return NextResponse.json({ error: "settings data required" }, { status: 400 })
      }
      const updated = await saveReminderSettings(settings)
      return NextResponse.json({ success: true, settings: updated })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[Admin Reminders API POST Error]:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
