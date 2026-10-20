import prisma from "@/lib/prisma"
import { sendInactiveReminderEmail } from "@/lib/email"

export interface ReminderSettings {
  inactiveDaysThreshold: number // Mặc định 3 ngày
  cooldownDays: number         // Mặc định 7 ngày
  autoSendEnabled: boolean     // Bật/tắt quét tự động
  motivationQuote?: string     // Câu danh ngôn/khẩu hiệu
  senderName?: string          // Tên hiển thị người gửi
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  inactiveDaysThreshold: 3,
  cooldownDays: 7,
  autoSendEnabled: true,
  motivationQuote: "Mỗi ngày một chút xíu thôi, bé sẽ tự tin nói tiếng Anh hơn mỗi ngày! 🌟",
  senderName: "Dolcake",
}

export interface InactiveStudentItem {
  studentId: string
  studentName: string
  studentEmail: string
  classId: string
  className: string
  classCode: string
  joinedAt: string
  inactiveDays: number
  canSendNow: boolean
  cooldownDaysLeft: number
  lastReminderSentAt: string | null
  lastActivityAt: string | null
  lastActivityType: "submission" | "pageview" | "none"
}

export interface ReminderRunReport {
  timestamp: string
  totalEnrollmentsChecked: number
  remindersSent: number
  skippedActive: number
  skippedCooldown: number
  skippedNewEnrollment: number
  sentDetails: {
    studentName: string
    studentEmail: string
    className: string
    classCode: string
    inactiveDays: number
    emailStatus: string
  }[]
}

export interface ReminderStats {
  monthlySentCount: number
  monthlyQuota: number
  totalInactiveStudents: number
  readyToSendCount: number
  cooldownCount: number
  nextCronTime: string
}

export interface ReminderRunOptions {
  classId?: string
  studentId?: string
  dryRun?: boolean
  forceSkipCooldown?: boolean
  customInactiveDays?: number
  customCooldownDays?: number
}

/**
 * Get system reminder settings from SystemSetting or fallback to default
 */
export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "reminder_settings" },
    })
    if (setting && setting.value && typeof setting.value === "object") {
      return {
        ...DEFAULT_REMINDER_SETTINGS,
        ...(setting.value as Record<string, any>),
      }
    }
  } catch (e) {
    console.error("Failed to fetch reminder_settings", e)
  }
  return DEFAULT_REMINDER_SETTINGS
}

/**
 * Save updated reminder settings to SystemSetting
 */
export async function saveReminderSettings(settings: Partial<ReminderSettings>): Promise<ReminderSettings> {
  const current = await getReminderSettings()
  const updated: ReminderSettings = {
    ...current,
    ...settings,
    inactiveDaysThreshold: Math.max(1, Number(settings.inactiveDaysThreshold ?? current.inactiveDaysThreshold)),
    cooldownDays: Math.max(1, Number(settings.cooldownDays ?? current.cooldownDays)),
    autoSendEnabled: settings.autoSendEnabled !== undefined ? Boolean(settings.autoSendEnabled) : current.autoSendEnabled,
  }

  await prisma.systemSetting.upsert({
    where: { key: "reminder_settings" },
    update: { value: updated as any },
    create: { key: "reminder_settings", value: updated as any },
  })

  return updated
}

/**
 * Scan all active enrollments and return detailed roster of inactive students
 */
export async function getInactiveStudentsRoster(filterClassId?: string): Promise<InactiveStudentItem[]> {
  const settings = await getReminderSettings()
  const now = new Date()
  const thresholdMs = settings.inactiveDaysThreshold * 24 * 60 * 60 * 1000
  const cooldownMs = settings.cooldownDays * 24 * 60 * 60 * 1000

  const whereEnrollment: any = {
    status: "ACTIVE",
    student: {
      role: "STUDENT",
      isBlocked: false,
      email: { contains: "@" },
    },
  }

  if (filterClassId) {
    whereEnrollment.classId = filterClassId
  }

  const enrollments = await prisma.classEnrollment.findMany({
    where: whereEnrollment,
    select: {
      studentId: true,
      classId: true,
      joinedAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          classCode: true,
        },
      },
    },
  })

  if (enrollments.length === 0) return []

  const studentIds = Array.from(new Set(enrollments.map((e) => e.studentId)))
  const classIds = Array.from(new Set(enrollments.map((e) => e.classId)))

  // Bulk queries for submissions, pageviews and reminders
  const [reminders, submissions, pageViews] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: { in: studentIds },
        type: "CLASS_INACTIVE_REMINDER",
      },
      select: {
        userId: true,
        link: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.submission.findMany({
      where: {
        studentId: { in: studentIds },
        classId: { in: classIds },
      },
      select: {
        studentId: true,
        classId: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.pageViewLog.findMany({
      where: {
        userId: { in: studentIds },
      },
      select: {
        userId: true,
        path: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
  ])

  // Map latest reminder per student:class
  const latestReminderMap = new Map<string, Date>()
  reminders.forEach((r) => {
    if (r.link) {
      const match = r.link.match(/\/student\/classes\/([^\/?#]+)/)
      if (match && match[1]) {
        const key = `${r.userId}:${match[1]}`
        if (!latestReminderMap.has(key)) {
          latestReminderMap.set(key, r.createdAt)
        }
      }
    }
  })

  // Map latest submission per student:class
  const latestSubmissionMap = new Map<string, Date>()
  submissions.forEach((s) => {
    if (s.classId) {
      const key = `${s.studentId}:${s.classId}`
      if (!latestSubmissionMap.has(key)) {
        latestSubmissionMap.set(key, s.submittedAt)
      }
    }
  })

  // Map latest pageview per student:class
  const latestPageViewMap = new Map<string, Date>()
  pageViews.forEach((pv) => {
    if (pv.userId && pv.path) {
      classIds.forEach((cId) => {
        if (pv.path.includes(cId)) {
          const key = `${pv.userId}:${cId}`
          if (!latestPageViewMap.has(key)) {
            latestPageViewMap.set(key, pv.createdAt)
          }
        }
      })
    }
  })

  const roster: InactiveStudentItem[] = []

  for (const e of enrollments) {
    const key = `${e.studentId}:${e.classId}`
    const joinedTime = new Date(e.joinedAt).getTime()
    const lastSub = latestSubmissionMap.get(key)
    const lastPv = latestPageViewMap.get(key)
    const lastReminder = latestReminderMap.get(key)

    // Determine latest activity
    let latestActivityTime = joinedTime
    let activityType: "submission" | "pageview" | "none" = "none"

    if (lastSub && lastSub.getTime() > latestActivityTime) {
      latestActivityTime = lastSub.getTime()
      activityType = "submission"
    }
    if (lastPv && lastPv.getTime() > latestActivityTime) {
      latestActivityTime = lastPv.getTime()
      activityType = "pageview"
    }

    const inactiveTimeMs = now.getTime() - latestActivityTime
    const inactiveDays = Math.max(0, Math.floor(inactiveTimeMs / (24 * 60 * 60 * 1000)))

    // Only include if inactiveDays >= threshold
    if (inactiveDays >= settings.inactiveDaysThreshold) {
      let cooldownDaysLeft = 0
      let canSendNow = true

      if (lastReminder) {
        const msSinceReminder = now.getTime() - lastReminder.getTime()
        if (msSinceReminder < cooldownMs) {
          cooldownDaysLeft = Math.ceil((cooldownMs - msSinceReminder) / (24 * 60 * 60 * 1000))
          canSendNow = false
        }
      }

      roster.push({
        studentId: e.studentId,
        studentName: e.student.name || "bạn nhỏ",
        studentEmail: e.student.email,
        classId: e.classId,
        className: e.class.name,
        classCode: e.class.classCode,
        joinedAt: e.joinedAt.toISOString(),
        inactiveDays,
        canSendNow,
        cooldownDaysLeft,
        lastReminderSentAt: lastReminder ? lastReminder.toISOString() : null,
        lastActivityAt: activityType !== "none" ? new Date(latestActivityTime).toISOString() : null,
        lastActivityType: activityType,
      })
    }
  }

  // Sort by inactiveDays descending
  return roster.sort((a, b) => b.inactiveDays - a.inactiveDays)
}

/**
 * Get monthly stats and overall metrics
 */
export async function getMonthlyReminderStats(): Promise<ReminderStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [monthlySentCount, roster] = await Promise.all([
    prisma.notification.count({
      where: {
        type: "CLASS_INACTIVE_REMINDER",
        createdAt: { gte: startOfMonth },
      },
    }),
    getInactiveStudentsRoster(),
  ])

  const readyToSendCount = roster.filter((r) => r.canSendNow).length
  const cooldownCount = roster.filter((r) => !r.canSendNow).length

  return {
    monthlySentCount,
    monthlyQuota: 3000,
    totalInactiveStudents: roster.length,
    readyToSendCount,
    cooldownCount,
    nextCronTime: "18:30 hàng ngày",
  }
}

/**
 * Get history logs of sent reminder notifications
 */
export async function getEmailHistory(limit = 50) {
  const notifications = await prisma.notification.findMany({
    where: {
      type: "CLASS_INACTIVE_REMINDER",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  // Extract class IDs from links
  const classIds = Array.from(
    new Set(
      notifications
        .map((n) => {
          const match = n.link?.match(/\/student\/classes\/([^\/?#]+)/)
          return match ? match[1] : null
        })
        .filter(Boolean) as string[]
    )
  )

  const classes = await prisma.class.findMany({
    where: { id: { in: classIds } },
    select: { id: true, name: true, classCode: true },
  })
  const classMap = new Map(classes.map((c) => [c.id, c]))

  return notifications.map((n) => {
    let className = "Lớp học"
    let classId = ""
    if (n.link) {
      const match = n.link.match(/\/student\/classes\/([^\/?#]+)/)
      if (match && match[1]) {
        classId = match[1]
        className = classMap.get(classId)?.name || "Lớp học"
      }
    }

    return {
      id: n.id,
      studentId: n.userId,
      studentName: n.user?.name || "bạn nhỏ",
      studentEmail: n.user?.email || "",
      title: n.title,
      message: n.message,
      link: n.link,
      classId,
      className,
      createdAt: n.createdAt.toISOString(),
      isRead: n.isRead,
    }
  })
}

/**
 * Scan active class enrollments and send reminders (or Dry-Run simulation)
 */
export async function checkAndSendInactiveStudentReminders(
  options?: ReminderRunOptions
): Promise<ReminderRunReport> {
  const settings = await getReminderSettings()

  // If called without explicit options (e.g. Cron) and autoSend is disabled, skip
  if (!options?.studentId && !options?.classId && !settings.autoSendEnabled && !options?.dryRun) {
    return {
      timestamp: new Date().toISOString(),
      totalEnrollmentsChecked: 0,
      remindersSent: 0,
      skippedActive: 0,
      skippedCooldown: 0,
      skippedNewEnrollment: 0,
      sentDetails: [],
    }
  }

  const now = new Date()
  const inactiveDaysThreshold = options?.customInactiveDays || settings.inactiveDaysThreshold
  const cooldownDays = options?.customCooldownDays || settings.cooldownDays

  const thresholdMs = inactiveDaysThreshold * 24 * 60 * 60 * 1000
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000

  const thresholdDate = new Date(now.getTime() - thresholdMs)
  const cooldownDate = new Date(now.getTime() - cooldownMs)

  // 1. Fetch active student enrollments
  const whereClause: any = {
    status: "ACTIVE",
    student: {
      role: "STUDENT",
      isBlocked: false,
      email: { contains: "@" },
    },
  }

  if (options?.classId) {
    whereClause.classId = options.classId
  }
  if (options?.studentId) {
    whereClause.studentId = options.studentId
  }

  const enrollments = await prisma.classEnrollment.findMany({
    where: whereClause,
    select: {
      studentId: true,
      classId: true,
      joinedAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          classCode: true,
        },
      },
    },
  })

  if (enrollments.length === 0) {
    return {
      timestamp: now.toISOString(),
      totalEnrollmentsChecked: 0,
      remindersSent: 0,
      skippedActive: 0,
      skippedCooldown: 0,
      skippedNewEnrollment: 0,
      sentDetails: [],
    }
  }

  const studentIds = Array.from(new Set(enrollments.map((e) => e.studentId)))
  const classIds = Array.from(new Set(enrollments.map((e) => e.classId)))

  // 2. Fetch recent activity & reminders in 3 fast bulk queries
  const [recentReminders, recentSubmissions, recentPageViews] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: { in: studentIds },
        type: "CLASS_INACTIVE_REMINDER",
        createdAt: { gte: cooldownDate },
      },
      select: {
        userId: true,
        link: true,
      },
    }),
    prisma.submission.findMany({
      where: {
        studentId: { in: studentIds },
        classId: { in: classIds },
        submittedAt: { gte: thresholdDate },
      },
      select: {
        studentId: true,
        classId: true,
      },
    }),
    prisma.pageViewLog.findMany({
      where: {
        userId: { in: studentIds },
        createdAt: { gte: thresholdDate },
      },
      select: {
        userId: true,
        path: true,
      },
    }),
  ])

  // 3. Fast In-Memory Lookup Sets: key is `${studentId}:${classId}`
  const cooldownKeys = new Set<string>()
  recentReminders.forEach((r) => {
    if (r.link) {
      const match = r.link.match(/\/student\/classes\/([^\/?#]+)/)
      if (match && match[1]) {
        cooldownKeys.add(`${r.userId}:${match[1]}`)
      }
    }
  })

  const activeKeys = new Set<string>()
  recentSubmissions.forEach((s) => {
    if (s.classId) {
      activeKeys.add(`${s.studentId}:${s.classId}`)
    }
  })
  recentPageViews.forEach((pv) => {
    if (pv.userId && pv.path) {
      classIds.forEach((cId) => {
        if (pv.path.includes(cId)) {
          activeKeys.add(`${pv.userId}:${cId}`)
        }
      })
    }
  })

  let skippedActive = 0
  let skippedCooldown = 0
  let skippedNewEnrollment = 0

  const targetsToSend: {
    studentId: string
    studentName: string
    studentEmail: string
    className: string
    classCode: string
    classId: string
    inactiveDays: number
  }[] = []

  for (const enrollment of enrollments) {
    const enrollKey = `${enrollment.studentId}:${enrollment.classId}`

    // A. Skip if joined less than threshold days ago
    if (new Date(enrollment.joinedAt).getTime() >= thresholdDate.getTime()) {
      skippedNewEnrollment++
      continue
    }

    // B. Check cooldown (skip if forceSkipCooldown is false)
    if (!options?.forceSkipCooldown && cooldownKeys.has(enrollKey)) {
      skippedCooldown++
      continue
    }

    // C. Check activity in threshold period
    if (activeKeys.has(enrollKey)) {
      skippedActive++
      continue
    }

    // D. Inactive confirmed!
    const daysSinceJoin = Math.floor(
      (now.getTime() - new Date(enrollment.joinedAt).getTime()) / (24 * 60 * 60 * 1000)
    )
    const inactiveDays = Math.max(inactiveDaysThreshold, daysSinceJoin)

    targetsToSend.push({
      studentId: enrollment.studentId,
      studentName: enrollment.student.name || "bạn nhỏ",
      studentEmail: enrollment.student.email,
      className: enrollment.class.name,
      classCode: enrollment.class.classCode,
      classId: enrollment.classId,
      inactiveDays,
    })

    cooldownKeys.add(enrollKey)
  }

  // 4. Handle Dry-Run simulation
  if (options?.dryRun) {
    return {
      timestamp: now.toISOString(),
      totalEnrollmentsChecked: enrollments.length,
      remindersSent: targetsToSend.length,
      skippedActive,
      skippedCooldown,
      skippedNewEnrollment,
      sentDetails: targetsToSend.map((target) => ({
        studentName: target.studentName,
        studentEmail: target.studentEmail,
        className: target.className,
        classCode: target.classCode,
        inactiveDays: target.inactiveDays,
        emailStatus: "Chạy thử (Dry-Run: Sẵn sàng gửi)",
      })),
    }
  }

  // 5. Send Emails in parallel
  const emailResults = await Promise.all(
    targetsToSend.map(async (target) => {
      const emailRes = await sendInactiveReminderEmail({
        studentName: target.studentName,
        studentEmail: target.studentEmail,
        className: target.className,
        classCode: target.classCode,
        classId: target.classId,
        inactiveDays: target.inactiveDays,
      })

      return {
        ...target,
        emailStatus: emailRes.simulated
          ? "Simulated (Chế độ xem trước)"
          : emailRes.success
          ? "Đã gửi thành công"
          : `Thất bại (${emailRes.error})`,
      }
    })
  )

  // 6. Bulk insert in-app notifications
  if (targetsToSend.length > 0) {
    await prisma.notification.createMany({
      data: targetsToSend.map((target) => ({
        userId: target.studentId,
        title: `🧁 Bé ơi, lớp học "${target.className}" đang đợi bé nè!`,
        message: `Đã ${target.inactiveDays} ngày rồi bạn chưa ghé thăm lớp học ${target.className}. Vào làm bài ngay để không bị đứt chuỗi học nhé!`,
        type: "CLASS_INACTIVE_REMINDER",
        link: `/student/classes/${target.classId}`,
        isRead: false,
      })),
    })
  }

  return {
    timestamp: now.toISOString(),
    totalEnrollmentsChecked: enrollments.length,
    remindersSent: targetsToSend.length,
    skippedActive,
    skippedCooldown,
    skippedNewEnrollment,
    sentDetails: emailResults.map((r) => ({
      studentName: r.studentName,
      studentEmail: r.studentEmail,
      className: r.className,
      classCode: r.classCode,
      inactiveDays: r.inactiveDays,
      emailStatus: r.emailStatus,
    })),
  }
}
