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

interface TeacherActivitySummary {
  teacherId: string
  teacherName: string
  teacherEmail: string
  classesCount: number
  gamesCount: number
  lastGameName: string | null
  lastGameCreatedAt: Date | null
  lastPageViewAt: Date | null
  lastReminderSentAt: Date | null
  latestActivityTime: number
  inactiveDays: number
}

/**
 * Compute full system interaction summary for all matching TEACHER users:
 * - PageViewLog (any page on the platform)
 * - MatchWordTopic (creating or updating games)
 * - Class (creating classes)
 * - Assignment (creating or updating exercises/assignments)
 * - Lesson (creating or updating lessons)
 * - User.createdAt (registration date baseline so newly registered teachers < 7 days old are not treated as inactive)
 */
async function collectTeacherActivitySummaries(
  now: Date,
  filterTeacherId?: string
): Promise<TeacherActivitySummary[]> {
  const whereTeacher: any = {
    role: "TEACHER",
    isBlocked: false,
    deletedAt: null,
    email: { contains: "@" },
  }

  if (filterTeacherId) {
    whereTeacher.id = filterTeacherId
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

  if (teachers.length === 0) return []

  const teacherIds = teachers.map((t) => t.id)

  const [
    games,
    pageViewGroups,
    classGroups,
    assignmentGroups,
    lessonGroups,
    reminders,
  ] = await Promise.all([
    prisma.matchWordTopic.findMany({
      where: {
        teacherId: { in: teacherIds },
      },
      select: {
        id: true,
        teacherId: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.pageViewLog.groupBy({
      by: ["userId"],
      where: {
        userId: { in: teacherIds },
      },
      _max: {
        createdAt: true,
      },
    }),
    prisma.class.groupBy({
      by: ["teacherId"],
      where: {
        teacherId: { in: teacherIds },
        deletedAt: null,
      },
      _count: {
        id: true,
      },
      _max: {
        createdAt: true,
      },
    }),
    prisma.assignment.groupBy({
      by: ["teacherId"],
      where: {
        teacherId: { in: teacherIds },
        deletedAt: null,
      },
      _max: {
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.lesson.groupBy({
      by: ["teacherId"],
      where: {
        teacherId: { in: teacherIds },
        deletedAt: null,
      },
      _max: {
        createdAt: true,
        updatedAt: true,
      },
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

  // 1. Games map
  const teacherGamesMap = new Map<
    string,
    { count: number; latestGameName: string; latestCreatedAt: Date; latestActivityAt: Date }
  >()
  for (const g of games) {
    if (!g.teacherId) continue
    const gameTouch = g.updatedAt && g.updatedAt > g.createdAt ? g.updatedAt : g.createdAt
    const existing = teacherGamesMap.get(g.teacherId)
    if (!existing) {
      teacherGamesMap.set(g.teacherId, {
        count: 1,
        latestGameName: g.name,
        latestCreatedAt: g.createdAt,
        latestActivityAt: gameTouch,
      })
    } else {
      existing.count++
      if (g.createdAt > existing.latestCreatedAt) {
        existing.latestCreatedAt = g.createdAt
        existing.latestGameName = g.name
      }
      if (gameTouch > existing.latestActivityAt) {
        existing.latestActivityAt = gameTouch
      }
    }
  }

  // 2. PageView map (entire platform)
  const latestPageViewMap = new Map<string, Date>()
  for (const pv of pageViewGroups) {
    if (pv.userId && pv._max.createdAt) {
      latestPageViewMap.set(pv.userId, pv._max.createdAt)
    }
  }

  // 3. Classes map
  const classSummaryMap = new Map<string, { count: number; latestCreatedAt: Date | null }>()
  for (const c of classGroups) {
    classSummaryMap.set(c.teacherId, {
      count: c._count.id,
      latestCreatedAt: c._max.createdAt || null,
    })
  }

  // 4. Assignments & Lessons latest activity map
  const otherContentActivityMap = new Map<string, Date>()
  for (const a of assignmentGroups) {
    const latest = a._max.updatedAt || a._max.createdAt
    if (latest) {
      const prev = otherContentActivityMap.get(a.teacherId)
      if (!prev || latest > prev) otherContentActivityMap.set(a.teacherId, latest)
    }
  }
  for (const l of lessonGroups) {
    const latest = l._max.updatedAt || l._max.createdAt
    if (latest) {
      const prev = otherContentActivityMap.get(l.teacherId)
      if (!prev || latest > prev) otherContentActivityMap.set(l.teacherId, latest)
    }
  }

  // 5. Latest reminder sent map
  const latestReminderMap = new Map<string, Date>()
  for (const r of reminders) {
    if (r.userId && !latestReminderMap.has(r.userId)) {
      latestReminderMap.set(r.userId, r.createdAt)
    }
  }

  return teachers.map((t) => {
    const gameData = teacherGamesMap.get(t.id)
    const lastPv = latestPageViewMap.get(t.id) || null
    const classInfo = classSummaryMap.get(t.id)
    const otherContentAt = otherContentActivityMap.get(t.id) || null
    const lastReminder = latestReminderMap.get(t.id) || null

    let latestActivityTime = new Date(t.createdAt).getTime()
    if (gameData && gameData.latestActivityAt.getTime() > latestActivityTime) {
      latestActivityTime = gameData.latestActivityAt.getTime()
    }
    if (lastPv && lastPv.getTime() > latestActivityTime) {
      latestActivityTime = lastPv.getTime()
    }
    if (classInfo?.latestCreatedAt && classInfo.latestCreatedAt.getTime() > latestActivityTime) {
      latestActivityTime = classInfo.latestCreatedAt.getTime()
    }
    if (otherContentAt && otherContentAt.getTime() > latestActivityTime) {
      latestActivityTime = otherContentAt.getTime()
    }

    const inactiveTimeMs = now.getTime() - latestActivityTime
    const inactiveDays = Math.max(0, Math.floor(inactiveTimeMs / (24 * 60 * 60 * 1000)))

    return {
      teacherId: t.id,
      teacherName: t.name || "Teacher",
      teacherEmail: t.email,
      classesCount: classInfo ? classInfo.count : 0,
      gamesCount: gameData ? gameData.count : 0,
      lastGameName: gameData ? gameData.latestGameName : null,
      lastGameCreatedAt: gameData ? gameData.latestCreatedAt : null,
      lastPageViewAt: lastPv,
      lastReminderSentAt: lastReminder,
      latestActivityTime,
      inactiveDays,
    }
  })
}

/**
 * Scan all teachers and return detailed roster of inactive teachers
 * Condition: In the last 7 days, teacher has NOT interacted with the system
 */
export async function getInactiveTeachersRoster(): Promise<InactiveTeacherItem[]> {
  const now = new Date()

  // Teacher thresholds: 7 days inactivity, 7 days cooldown
  const inactiveDaysThreshold = 7
  const cooldownDays = 7
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000

  const summaries = await collectTeacherActivitySummaries(now)
  const roster: InactiveTeacherItem[] = []

  for (const s of summaries) {
    if (s.inactiveDays >= inactiveDaysThreshold) {
      let cooldownDaysLeft = 0
      let canSendNow = true

      if (s.lastReminderSentAt) {
        const msSinceReminder = now.getTime() - s.lastReminderSentAt.getTime()
        if (msSinceReminder < cooldownMs) {
          cooldownDaysLeft = Math.ceil((cooldownMs - msSinceReminder) / (24 * 60 * 60 * 1000))
          canSendNow = false
        }
      }

      roster.push({
        teacherId: s.teacherId,
        teacherName: s.teacherName,
        teacherEmail: s.teacherEmail,
        classesCount: s.classesCount,
        gamesCount: s.gamesCount,
        lastGameName: s.lastGameName,
        lastGameCreatedAt: s.lastGameCreatedAt ? s.lastGameCreatedAt.toISOString() : null,
        lastPageViewAt: s.lastPageViewAt ? s.lastPageViewAt.toISOString() : null,
        inactiveDays: s.inactiveDays,
        canSendNow,
        cooldownDaysLeft,
        lastReminderSentAt: s.lastReminderSentAt ? s.lastReminderSentAt.toISOString() : null,
      })
    }
  }

  return roster.sort((a, b) => b.inactiveDays - a.inactiveDays)
}

/**
 * Scan teachers and send reminder emails if inactive for >= 7 days (with 7-day cooldown)
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
  const cooldownDays = options?.customCooldownDays || 7
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000

  const summaries = await collectTeacherActivitySummaries(now, options?.teacherId)

  if (summaries.length === 0) {
    return {
      timestamp: now.toISOString(),
      totalTeachersChecked: 0,
      remindersSent: 0,
      skippedActive: 0,
      skippedCooldown: 0,
      sentDetails: [],
    }
  }

  let skippedActive = 0
  let skippedCooldown = 0

  const targetsToSend: {
    teacherId: string
    teacherName: string
    teacherEmail: string
    inactiveDays: number
    gamesCount: number
  }[] = []

  for (const s of summaries) {
    // 1. Skip if interacted within the last 7 days (unless admin manually triggered a single teacher)
    if (!options?.teacherId && s.inactiveDays < inactiveDaysThreshold) {
      skippedActive++
      continue
    }

    // 2. Skip if in 7-day cooldown
    if (!options?.forceSkipCooldown && s.lastReminderSentAt) {
      const msSinceReminder = now.getTime() - s.lastReminderSentAt.getTime()
      if (msSinceReminder < cooldownMs) {
        skippedCooldown++
        continue
      }
    }

    targetsToSend.push({
      teacherId: s.teacherId,
      teacherName: s.teacherName,
      teacherEmail: s.teacherEmail,
      inactiveDays: Math.max(inactiveDaysThreshold, s.inactiveDays),
      gamesCount: s.gamesCount,
    })
  }

  // Dry-run simulation
  if (options?.dryRun) {
    return {
      timestamp: now.toISOString(),
      totalTeachersChecked: summaries.length,
      remindersSent: targetsToSend.length,
      skippedActive,
      skippedCooldown,
      sentDetails: targetsToSend.map((target) => ({
        teacherName: target.teacherName,
        teacherEmail: target.teacherEmail,
        inactiveDays: target.inactiveDays,
        gamesCount: target.gamesCount,
        emailStatus: "Dry-Run (Ready to send)",
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
          ? "Simulated (Preview mode)"
          : res.success
          ? "Sent successfully"
          : `Failed (${res.error})`,
      }
    })
  )

  // Bulk create in-app notifications
  if (targetsToSend.length > 0) {
    await prisma.notification.createMany({
      data: targetsToSend.map((target) => ({
        userId: target.teacherId,
        title: `🧁 We miss you at Dolcake, ${target.teacherName}! Ready for your next class game?`,
        message:
          "Whether you're teaching new vocabulary, grammar, or quick math reflexes, explore our 11 ready-to-play game templates at Dolcake Teacher Studio!",
        type: "TEACHER_GAME_INACTIVE_REMINDER",
        link: "/teacher",
        isRead: false,
      })),
    })
  }

  return {
    timestamp: now.toISOString(),
    totalTeachersChecked: summaries.length,
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
