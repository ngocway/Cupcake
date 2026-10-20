import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { checkAndSendInactiveStudentReminders } from "@/lib/reminders/inactive-students"
import { checkAndSendInactiveTeacherReminders } from "@/lib/reminders/inactive-teachers"

export const maxDuration = 60 // Allow up to 60s for Vercel Cron
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  return handleReminderTrigger(req)
}

export async function POST(req: NextRequest) {
  return handleReminderTrigger(req)
}

async function handleReminderTrigger(req: NextRequest) {
  try {
    // 1. Authorization Check:
    // Either Vercel Cron Secret OR Admin Session
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    const isCronAuthorized =
      cronSecret && authHeader === `Bearer ${cronSecret}`

    if (!isCronAuthorized) {
      // Check if user is logged in as Super Admin
      const session = await auth()
      const isAdmin = session?.user?.role === "ADMIN"

      if (!isAdmin && process.env.NODE_ENV === "production" && cronSecret) {
        return NextResponse.json(
          { error: "Unauthorized. Missing or invalid Cron Secret." },
          { status: 401 }
        )
      }
    }

    // 2. Execute Both Reminder Engines (Students & Teachers) in parallel
    const [studentReport, teacherReport] = await Promise.all([
      checkAndSendInactiveStudentReminders(),
      checkAndSendInactiveTeacherReminders(),
    ])

    return NextResponse.json({
      success: true,
      message: `Đã quét và xử lý nhắc nhở học sinh & giáo viên thành công.`,
      studentReport,
      teacherReport,
    })
  } catch (error: any) {
    console.error("[Cron Error] Inactive reminder failed:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
