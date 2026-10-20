import prisma from "@/lib/prisma"
import { unstable_cache } from "next/cache"

export interface UserKpiData {
  totalUsers: number
  newUsers7d: number
  newTeachers7d: number
  newStudents7d: number
  dau: number
  mau: number
  retentionRate: number
  streakersCount: number
  sevenDayTrend: {
    date: string
    dayLabel: string
    visits: number
    submissions: number
  }[]
  peakHourRange: string
  className?: string | null
}

async function computeAdminUserAnalytics(classId?: string): Promise<UserKpiData> {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  let targetUserIds: string[] | null = null
  let classTitle: string | null = null

  if (classId) {
    const [cls, enrollments] = await Promise.all([
      prisma.class.findUnique({
        where: { id: classId },
        select: { name: true, teacherId: true },
      }),
      prisma.classEnrollment.findMany({
        where: { classId },
        select: { studentId: true },
      }),
    ])
    if (cls) {
      classTitle = cls.name
      const ids = enrollments.map((e) => e.studentId)
      if (cls.teacherId) ids.push(cls.teacherId)
      targetUserIds = Array.from(new Set(ids))
    }
  }

  // 1. Core Counts
  const [
    totalUsers,
    newUsers7d,
    newTeachers7d,
    newStudents7d,
    dauLogs,
    mauLogs,
    submissions7d,
    hourlyLogs,
  ] = await Promise.all([
    targetUserIds !== null
      ? Promise.resolve(targetUserIds.length)
      : prisma.user.count({ where: { role: { in: ["TEACHER", "STUDENT"] } } }),
    targetUserIds !== null
      ? prisma.user.count({
          where: {
            id: { in: targetUserIds },
            createdAt: { gte: sevenDaysAgo },
          },
        })
      : prisma.user.count({
          where: {
            role: { in: ["TEACHER", "STUDENT"] },
            createdAt: { gte: sevenDaysAgo },
          },
        }),
    targetUserIds !== null
      ? prisma.user.count({
          where: {
            id: { in: targetUserIds },
            role: "TEACHER",
            createdAt: { gte: sevenDaysAgo },
          },
        })
      : prisma.user.count({
          where: { role: "TEACHER", createdAt: { gte: sevenDaysAgo } },
        }),
    targetUserIds !== null
      ? prisma.user.count({
          where: {
            id: { in: targetUserIds },
            role: "STUDENT",
            createdAt: { gte: sevenDaysAgo },
          },
        })
      : prisma.user.count({
          where: { role: "STUDENT", createdAt: { gte: sevenDaysAgo } },
        }),
    // DAU: users today
    prisma.pageViewLog.findMany({
      where: {
        createdAt: { gte: startOfToday },
        userId: targetUserIds !== null ? { in: targetUserIds } : { not: null },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    // MAU: users 30 days
    prisma.pageViewLog.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        userId: targetUserIds !== null ? { in: targetUserIds } : { not: null },
      },
      select: { userId: true, createdAt: true },
    }),
    // Submissions 7 days
    prisma.submission.findMany({
      where: {
        ...(classId ? { classId } : {}),
        submittedAt: { gte: sevenDaysAgo },
      },
      select: { submittedAt: true },
    }),
    // Pageviews for peak hours & 7-day trend
    prisma.pageViewLog.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        ...(targetUserIds !== null ? { userId: { in: targetUserIds } } : {}),
      },
      select: { createdAt: true },
      take: 2000,
      orderBy: { createdAt: "desc" },
    }),
  ])

  const dau = dauLogs.length

  // Calculate retention (users with >= 2 active days in last 30d)
  const userActiveDatesMap = new Map<string, Set<string>>()
  mauLogs.forEach((log) => {
    if (!log.userId) return
    const dStr = log.createdAt.toISOString().slice(0, 10)
    if (!userActiveDatesMap.has(log.userId)) {
      userActiveDatesMap.set(log.userId, new Set())
    }
    userActiveDatesMap.get(log.userId)!.add(dStr)
  })

  const mau = userActiveDatesMap.size
  let returnedUsersCount = 0
  let streakers = 0

  userActiveDatesMap.forEach((datesSet) => {
    if (datesSet.size >= 2) returnedUsersCount++
    if (datesSet.size >= 3) streakers++
  })

  const retentionRate = mau > 0 ? Math.round((returnedUsersCount / mau) * 100) : 0

  // 7-day trend
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  const sevenDayTrend = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dStr = d.toISOString().slice(0, 10)
    const dayLabel = dayNames[d.getDay()]
    const dateFormatted = `${d.getDate()}/${d.getMonth() + 1}`

    const dayVisits = hourlyLogs.filter(
      (l) => l.createdAt.toISOString().slice(0, 10) === dStr
    ).length

    const daySubs = submissions7d.filter(
      (s) => s.submittedAt && s.submittedAt.toISOString().slice(0, 10) === dStr
    ).length

    sevenDayTrend.push({
      date: dateFormatted,
      dayLabel,
      visits: dayVisits,
      submissions: daySubs,
    })
  }

  // Peak hour estimation
  const hourCounts = new Array(24).fill(0)
  hourlyLogs.forEach((l) => {
    const h = new Date(l.createdAt).getHours()
    hourCounts[h]++
  })

  let maxHour = 19
  let maxCount = 0
  for (let h = 0; h < 24; h++) {
    const windowCount = hourCounts[h] + (hourCounts[(h + 1) % 24] || 0)
    if (windowCount > maxCount) {
      maxCount = windowCount
      maxHour = h
    }
  }
  const peakHourRange = `${maxHour.toString().padStart(2, "0")}:00 - ${((maxHour + 2) % 24).toString().padStart(2, "0")}:00`

  return {
    totalUsers,
    newUsers7d,
    newTeachers7d,
    newStudents7d,
    dau,
    mau,
    retentionRate,
    streakersCount: streakers,
    sevenDayTrend,
    peakHourRange,
    className: classTitle,
  }
}

export async function getAdminUserAnalytics(classId?: string): Promise<UserKpiData> {
  const cacheFn = unstable_cache(
    () => computeAdminUserAnalytics(classId),
    [`admin-user-analytics-kpi-${classId || "all"}`],
    { revalidate: 60, tags: ["admin-user-analytics"] }
  )
  return cacheFn()
}
