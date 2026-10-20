import React from "react"
import prisma from "@/lib/prisma"
import { getAdminUserAnalytics } from "./kpis"
import { AdminUsersKpis } from "./AdminUsersKpis"
import { AdminUsersActivityChart } from "./AdminUsersActivityChart"
import { AdminUsersFilters } from "./AdminUsersFilters"
import { AdminUsersTable } from "./AdminUsersTable"
import { AdminUsersPagination } from "./AdminUsersPagination"
import { AdminReminderTriggerButton } from "./AdminReminderTriggerButton"
import { EnhancedAdminUser, FrequencyTag } from "./types"

const PAGE_SIZE = 25

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string
    q?: string
    page?: string
    freq?: string
    classId?: string
  }>
}) {
  const { role, q, page, freq, classId } = await searchParams
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1)
  const skip = (currentPage - 1) * PAGE_SIZE

  // 1. Fetch Classes List and Cached KPIs concurrently
  const [classes, kpiData] = await Promise.all([
    prisma.class.findMany({
      select: { id: true, name: true, classCode: true },
      orderBy: { createdAt: "desc" },
    }),
    getAdminUserAnalytics(classId),
  ])

  // 2. Build Query Where Clause
  const roleFilter =
    role && ["TEACHER", "STUDENT"].includes(role)
      ? (role as "TEACHER" | "STUDENT")
      : undefined

  const conditions: any[] = [
    { role: roleFilter ? roleFilter : { in: ["TEACHER", "STUDENT"] } },
  ]

  if (classId) {
    conditions.push({
      OR: [
        { enrollments: { some: { classId } } },
        { classesCreated: { some: { id: classId } } },
      ],
    })
  }

  if (q) {
    conditions.push({
      OR: [
        { email: { contains: q, mode: "insensitive" as const } },
        { name: { contains: q, mode: "insensitive" as const } },
      ],
    })
  }

  const whereClause = { AND: conditions }

  const [totalCount, rawUsers] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isBlocked: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
  ])

  // 3. Enrich the 25 users with activity metrics
  const userIds = rawUsers.map((u) => u.id)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [userLogs30, userSubmissions] = await Promise.all([
    userIds.length > 0
      ? prisma.pageViewLog.findMany({
          where: {
            userId: { in: userIds },
            createdAt: { gte: thirtyDaysAgo },
          },
          select: {
            userId: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    userIds.length > 0
      ? prisma.submission.findMany({
          where: {
            studentId: { in: userIds },
            ...(classId ? { classId } : {}),
          },
          select: {
            studentId: true,
          },
        })
      : Promise.resolve([]),
  ])

  // Pre-index logs by userId
  const logsByUser = new Map<string, Date[]>()
  userLogs30.forEach((log) => {
    if (!log.userId) return
    if (!logsByUser.has(log.userId)) {
      logsByUser.set(log.userId, [])
    }
    logsByUser.get(log.userId)!.push(log.createdAt)
  })

  // Pre-index submissions by studentId
  const submissionCounts = new Map<string, number>()
  userSubmissions.forEach((sub) => {
    submissionCounts.set(sub.studentId, (submissionCounts.get(sub.studentId) || 0) + 1)
  })

  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

  let enhancedUsers: EnhancedAdminUser[] = rawUsers.map((user) => {
    const userDates = logsByUser.get(user.id) || []
    const dateStringsSet = new Set(
      userDates.map((d) => d.toISOString().slice(0, 10))
    )
    const activeDays30 = dateStringsSet.size
    const lastActiveAt = userDates.length > 0 ? userDates[0] : null

    // 7-day mini timeline (from 6 days ago up to today)
    const recent7Days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dStr = d.toISOString().slice(0, 10)
      recent7Days.push({
        dayLabel: dayNames[d.getDay()],
        dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
        active: dateStringsSet.has(dStr),
      })
    }

    // Streak calculation (consecutive days)
    let streak = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dStr = d.toISOString().slice(0, 10)
      if (dateStringsSet.has(dStr)) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    // Frequency Tag
    const isNew =
      now.getTime() - new Date(user.createdAt).getTime() <= 48 * 60 * 60 * 1000
    let frequencyTag: FrequencyTag = "DORMANT"

    if (isNew) {
      frequencyTag = "NEW"
    } else if (activeDays30 >= 12) {
      frequencyTag = "DAILY"
    } else if (activeDays30 >= 4) {
      frequencyTag = "WEEKLY"
    } else if (
      activeDays30 > 0 &&
      lastActiveAt &&
      now.getTime() - new Date(lastActiveAt).getTime() >= 14 * 24 * 60 * 60 * 1000
    ) {
      frequencyTag = "AT_RISK"
    } else if (activeDays30 > 0) {
      frequencyTag = "WEEKLY"
    }

    return {
      ...user,
      activeDays30,
      frequencyTag,
      lastActiveAt,
      streak,
      recent7Days,
      totalSubmissions: submissionCounts.get(user.id) || 0,
    }
  })

  // Filter by frequency if selected
  if (freq) {
    enhancedUsers = enhancedUsers.filter((u) => u.frequencyTag === freq)
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white tracking-tight">
              Quản lý & Báo cáo Người dùng
            </h1>
            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-full">
              {totalCount} tài khoản
            </span>
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            Theo dõi lưu lượng truy cập, tần suất quay lại và mức độ học tập của Giáo viên & Học sinh.
          </p>
        </div>

        {/* Manual Trigger Reminders Button */}
        <AdminReminderTriggerButton />
      </div>

      {/* 2. Top Metric KPI Cards */}
      <AdminUsersKpis data={kpiData} />

      {/* 3. 7-Day Activity & Traffic Trend Chart */}
      <AdminUsersActivityChart
        trend={kpiData.sevenDayTrend}
        peakHourRange={kpiData.peakHourRange}
        className={kpiData.className}
      />

      {/* 4. Filters */}
      <AdminUsersFilters
        initialSearch={q}
        initialRole={role}
        initialFreq={freq}
        initialClassId={classId}
        classes={classes}
      />

      {/* 5. User Intelligence Table & Profile Drawer */}
      <div className="space-y-4">
        <AdminUsersTable users={enhancedUsers} />

        {/* 6. Pagination */}
        <AdminUsersPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          baseUrl="/admin/users"
          currentParams={{ q, role, freq, classId }}
        />
      </div>
    </div>
  )
}
