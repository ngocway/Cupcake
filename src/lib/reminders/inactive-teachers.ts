import prisma from "@/lib/prisma"
import { sendTeacherGameReminderEmail } from "@/lib/email"
import { getReminderSettings } from "./inactive-students"

export interface InactiveTeacherItem {
  teacherId: string
  teacherName: string
  teacherEmail: string
  classesCount: number
  gamesCount: number
  lastGameName: string | null
  lastGameCreatedAt: string | null
  lastPageViewAt: string | null
  inactiveDays: number
  canSendNow: boolean
  cooldownDaysLeft: number
  lastReminderSentAt: string | null
}

export interface TeacherReminderRunReport {
  timestamp: string
  totalTeachersChecked: number
  remindersSent: number
  skippedActive: number
  skippedCooldown: number
  sentDetails: {
    teacherName: string
    teacherEmail: string
    inactiveDays: number
    gamesCount: number
    emailStatus: string
  }[]
}

export interface TeacherReminderRunOptions {
  teacherId?: string
  dryRun?: boolean
  forceSkipCooldown?: boolean
  customInactiveDays?: number
  customCooldownDays?: number
}

/**
 * Scan all teachers and return detailed roster of inactive teachers
 * Condition: In the last 7 days, teacher has NOT created any games AND has NOT visited /teacher/*
 */
export async function getInactiveTeachersRoster(): Promise<InactiveTeacherItem[]> {
  const settings = await getReminderSettings()
  const now = new Date()
  
  // Teacher thresholds: default 7 days inactivity, 10 days cooldown
  const inactiveDaysThreshold = 7
  const cooldownDays = 10

  const thresholdMs = inactiveDaysThreshold * 24 * 60 * 60 * 1000
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000

  // 1. Fetch all teachers
  const teachers = await prisma.user.findMany({
    where: {
      role: "TEACHER",
      isBlocked: false,
      email: { contains: "@" },
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      classesCreated: {
        select: { id: true },
      },
    },
  })

  if (teachers.length === 0) return []

  const teacherIds = teachers.map((t) => t.id)

  // 2. Bulk fetch all games, pageviews, and reminders
  const [games, pageViews, reminders] = await Promise.all([
    prisma.matchWordTopic.findMany({
      where: {
        teacherId: { in: teacherIds },
      },
      select: {
        id: true,
        teacherId: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pageViewLog.findMany({
      where: {
        userId: { in: teacherIds },
        path: { startsWith: "/teacher" },
      },
      select: {
        userId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
    prisma.notification.findMany({
      where: {
        userId: { in: teacherIds },
        type: "TEACHER_GAME_INACTIVE_REMINDER",
      },
      select: {
        userId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Group games by teacher
  const teacherGamesMap = new Map<string, { count: number; latestGameName: string; latestCreatedAt: Date }>()
  games.forEach((g) => {
    if (g.teacherId) {
      const existing = teacherGamesMap.get(g.teacherId)
      if (!existing) {
        teacherGamesMap.set(g.teacherId, {
          count: 1,
          latestGameName: g.name,
          latestCreatedAt: g.createdAt,
        })
      } else {
        existing.count++
      }
    }
  })

  // Latest pageview by teacher
  const latestPageViewMap = new Map<string, Date>()
  pageViews.forEach((pv) => {
    if (pv.userId && !latestPageViewMap.has(pv.userId)) {
      latestPageViewMap.set(pv.userId, pv.createdAt)
    }
  })

  // Latest reminder by teacher
  const latestReminderMap = new Map<string, Date>()
  reminders.forEach((r) => {
    if (r.userId && !latestReminderMap.has(r.userId)) {
      latestReminderMap.set(r.userId, r.createdAt)
    }
  })

  const roster: InactiveTeacherItem[] = []

  for (const t of teachers) {
    const gameData = teacherGamesMap.get(t.id)
    const lastPv = latestPageViewMap.get(t.id)
    const lastReminder = latestReminderMap.get(t.id)

    // Determine latest activity time
    let latestActivityTime = new Date(t.createdAt).getTime()
    if (gameData && gameData.latestCreatedAt.getTime() > latestActivityTime) {
      latestActivityTime = gameData.latestCreatedAt.getTime()
    }
    if (lastPv && lastPv.getTime() > latestActivityTime) {
      latestActivityTime = lastPv.getTime()
    }

    const inactiveTimeMs = now.getTime() - latestActivityTime
    const inactiveDays = Math.max(0, Math.floor(inactiveTimeMs / (24 * 60 * 60 * 1000)))

    // Check if inactive >= 7 days
    if (inactiveDays >= inactiveDaysThreshold) {
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
        teacherId: t.id,
        teacherName: t.name || "Thầy/Cô",
        teacherEmail: t.email,
        classesCount: t.classesCreated.length,
        gamesCount: gameData ? gameData.count : 0,
        lastGameName: gameData ? gameData.latestGameName : null,
        lastGameCreatedAt: gameData ? gameData.latestCreatedAt.toISOString() : null,
        lastPageViewAt: lastPv ? lastPv.toISOString() : null,
        inactiveDays,
        canSendNow,
        cooldownDaysLeft,
        lastReminderSentAt: lastReminder ? lastReminder.toISOString() : null,
      })
    }
  }

  return roster.sort((a, b) => b.inactiveDays - a.inactiveDays)
}

/**
 * Scan teachers and send game creation reminder emails
 */
export async function checkAndSendInactiveTeacherReminders(
  options?: TeacherReminderRunOptions
): Promise<TeacherReminderRunReport> {
  const settings = await getReminderSettings()

  // Respect master autoSend switch for cron
  if (!options?.teacherId && !settings.autoSendEnabled && !options?.dryRun) {
    return {
      timestamp: new Date().toISOString(),
      totalTeachersChecked: 0,
      remindersSent: 0,
      skippedActive: 0,
      skippedCooldown: 0,
      sentDetails: [],
    }
  }

  const now = new Date()
  const inactiveDaysThreshold = options?.customInactiveDays || 7
  const cooldownDays = options?.customCooldownDays || 10

  const thresholdMs = inactiveDaysThreshold * 24 * 60 * 60 * 1000
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000

  const thresholdDate = new Date(now.getTime() - thresholdMs)
  const cooldownDate = new Date(now.getTime() - cooldownMs)

  const whereTeacher: any = {
    role: "TEACHER",
    isBlocked: false,
    email: { contains: "@" },
  }

  if (options?.teacherId) {
    whereTeacher.id = options.teacherId
  }

  const teachers = await prisma.user.findMany({
    where: whereTeacher,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  })

  if (teachers.length === 0) {
    return {
      timestamp: now.toISOString(),
      totalTeachersChecked: 0,
      remindersSent: 0,
      skippedActive: 0,
      skippedCooldown: 0,
      sentDetails: [],
    }
  }

  const teacherIds = teachers.map((t) => t.id)

  const [recentGames, recentPageViews, recentReminders] = await Promise.all([
    prisma.matchWordTopic.findMany({
      where: {
        teacherId: { in: teacherIds },
        createdAt: { gte: thresholdDate },
      },
      select: { teacherId: true },
    }),
    prisma.pageViewLog.findMany({
      where: {
        userId: { in: teacherIds },
        path: { startsWith: "/teacher" },
        createdAt: { gte: thresholdDate },
      },
      select: { userId: true },
    }),
    prisma.notification.findMany({
      where: {
        userId: { in: teacherIds },
        type: "TEACHER_GAME_INACTIVE_REMINDER",
        createdAt: { gte: cooldownDate },
      },
      select: { userId: true },
    }),
  ])

  const activeTeacherIds = new Set<string>()
  recentGames.forEach((g) => {
    if (g.teacherId) activeTeacherIds.add(g.teacherId)
  })
  recentPageViews.forEach((pv) => {
    if (pv.userId) activeTeacherIds.add(pv.userId)
  })

  const cooldownTeacherIds = new Set<string>()
  recentReminders.forEach((r) => {
    if (r.userId) cooldownTeacherIds.add(r.userId)
  })

  let skippedActive = 0
  let skippedCooldown = 0

  const targetsToSend: {
    teacherId: string
    teacherName: string
    teacherEmail: string
    inactiveDays: number
    gamesCount: number
  }[] = []

  for (const t of teachers) {
    // Skip if active in last 7 days
    if (activeTeacherIds.has(t.id)) {
      skippedActive++
      continue
    }

    // Skip if in cooldown
    if (!options?.forceSkipCooldown && cooldownTeacherIds.has(t.id)) {
      skippedCooldown++
      continue
    }

    const daysSinceCreated = Math.floor(
      (now.getTime() - new Date(t.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    )
    const inactiveDays = Math.max(inactiveDaysThreshold, daysSinceCreated)

    targetsToSend.push({
      teacherId: t.id,
      teacherName: t.name || "Thầy/Cô",
      teacherEmail: t.email,
      inactiveDays,
      gamesCount: 0,
    })

    cooldownTeacherIds.add(t.id)
  }

  // Dry-run simulation
  if (options?.dryRun) {
    return {
      timestamp: now.toISOString(),
      totalTeachersChecked: teachers.length,
      remindersSent: targetsToSend.length,
      skippedActive,
      skippedCooldown,
      sentDetails: targetsToSend.map((target) => ({
        teacherName: target.teacherName,
        teacherEmail: target.teacherEmail,
        inactiveDays: target.inactiveDays,
        gamesCount: target.gamesCount,
        emailStatus: "Chạy thử (Dry-Run: Sẵn sàng gửi)",
      })),
    }
  }

  // Send Emails
  const emailResults = await Promise.all(
    targetsToSend.map(async (target) => {
      const res = await sendTeacherGameReminderEmail({
        teacherName: target.teacherName,
        teacherEmail: target.teacherEmail,
        inactiveDays: target.inactiveDays,
      })

      return {
        ...target,
        emailStatus: res.simulated
          ? "Simulated (Chế độ xem trước)"
          : res.success
          ? "Đã gửi thành công"
          : `Thất bại (${res.error})`,
      }
    })
  )

  // Bulk create in-app notifications
  if (targetsToSend.length > 0) {
    await prisma.notification.createMany({
      data: targetsToSend.map((target) => ({
        userId: target.teacherId,
        title: "🎮 Thầy/Cô ơi, học sinh đang mong chờ một mini-game vui nhộn từ Thầy/Cô nè!",
        message:
          "Chỉ cần 3 phút, Thầy/Cô có thể tạo ngay các tựa game thú vị (Candy Quiz, Đập Trứng, Bắn Bóng...) cho bài học tuần này!",
        type: "TEACHER_GAME_INACTIVE_REMINDER",
        link: "/teacher",
        isRead: false,
      })),
    })
  }

  return {
    timestamp: now.toISOString(),
    totalTeachersChecked: teachers.length,
    remindersSent: targetsToSend.length,
    skippedActive,
    skippedCooldown,
    sentDetails: emailResults.map((r) => ({
      teacherName: r.teacherName,
      teacherEmail: r.teacherEmail,
      inactiveDays: r.inactiveDays,
      gamesCount: r.gamesCount,
      emailStatus: r.emailStatus,
    })),
  }
}
