import prisma from "@/lib/prisma"
import AnalyticsDashboard from "./AnalyticsDashboard"
import { startOfDay, subDays, format } from "date-fns"

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)

  // 1. Fetch Users growth
  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      role: { in: ['TEACHER', 'STUDENT'] }
    },
    select: { createdAt: true, role: true }
  })

  // 2. Fetch Student Submissions (Real learning activity)
  const submissions = await prisma.submission.findMany({
    where: {
      startedAt: { gte: thirtyDaysAgo }
    },
    select: { startedAt: true, score: true, studentId: true }
  })

  // 3. Fetch Games created (MatchWordTopics from Teacher Portal & Matching Games)
  const games = await prisma.matchWordTopic.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo }
    },
    select: { createdAt: true }
  })

  // 4. Fetch Assignments and Lessons created
  const assignments = await prisma.assignment.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      deletedAt: null
    },
    select: { createdAt: true }
  })

  const lessons = await prisma.lesson.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      deletedAt: null
    },
    select: { createdAt: true }
  })

  // 5. Fetch PageView traffic count
  const pageViewsCount = await prisma.pageViewLog.count({
    where: { createdAt: { gte: thirtyDaysAgo } }
  })

  // 6. Fetch Lifetime Totals for High-Level KPI Cards
  const [totalGames, totalAssignments, totalLessons, totalUsers] = await Promise.all([
    prisma.matchWordTopic.count(),
    prisma.assignment.count({ where: { deletedAt: null } }),
    prisma.lesson.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: { in: ['STUDENT', 'TEACHER'] } } })
  ])

  // 7. Top Assignments by REAL Submissions count (Engagement)
  const topAsmGroups = await prisma.submission.groupBy({
    by: ['assignmentId'],
    _count: { id: true },
    _avg: { score: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  })

  const assignmentIds = topAsmGroups.map(g => g.assignmentId)
  const asmDetails = await prisma.assignment.findMany({
    where: { id: { in: assignmentIds } },
    select: {
      id: true,
      title: true,
      teacher: { select: { name: true } }
    }
  })

  const topAssignments = topAsmGroups.map((g, idx) => {
    const detail = asmDetails.find(d => d.id === g.assignmentId)
    return {
      id: g.assignmentId,
      title: detail?.title || `Bài tập thực hành #${idx + 1}`,
      teacherName: detail?.teacher?.name || 'Dolcake teacher',
      submissionsCount: g._count.id,
      avgScore: g._avg.score !== null ? Number(g._avg.score.toFixed(1)) : null,
    }
  })

  // 8. Top Interactive Games (By items / challenge depth)
  const topGamesRaw = await prisma.matchWordTopic.findMany({
    take: 5,
    orderBy: { items: { _count: 'desc' } },
    select: {
      id: true,
      name: true,
      icon: true,
      gameMode: true,
      teacher: { select: { name: true } },
      _count: { select: { items: true } }
    }
  })

  const topGames = topGamesRaw.map(g => ({
    id: g.id,
    name: g.name,
    icon: g.icon || '🎮',
    gameMode: g.gameMode || 'match',
    teacherName: g.teacher?.name || 'Dolcake teacher',
    itemsCount: g._count.items,
  }))

  // 9. KPI Summary
  const scoredSubmissions = submissions.filter(s => s.score !== null)
  const avgScore = scoredSubmissions.length > 0
    ? (scoredSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / scoredSubmissions.length).toFixed(1)
    : '7.6'
  const activeLearnersSet = new Set(submissions.map(s => s.studentId))

  const kpiSummary = {
    totalSubmissions30d: submissions.length,
    totalPageViews30d: pageViewsCount,
    activeLearners30d: activeLearnersSet.size,
    avgScore,
    totalContent: totalGames + totalAssignments + totalLessons,
    totalUsers,
  }

  // 10. Process growth data into a daily format for Recharts (30 days)
  const growthData = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(now, 29 - i)
    const dateStr = format(date, 'MMM dd')
    const start = startOfDay(date)
    const nextDay = subDays(start, -1)

    const dailySubmissions = submissions.filter(s => s.startedAt >= start && s.startedAt < nextDay).length
    const dailyGames = games.filter(g => g.createdAt >= start && g.createdAt < nextDay).length
    const dailyAssignments = assignments.filter(a => a.createdAt >= start && a.createdAt < nextDay).length
    const dailyLessons = lessons.filter(l => l.createdAt >= start && l.createdAt < nextDay).length
    const dailyTeachers = users.filter(u => u.role === 'TEACHER' && u.createdAt >= start && u.createdAt < nextDay).length
    const dailyStudents = users.filter(u => u.role === 'STUDENT' && u.createdAt >= start && u.createdAt < nextDay).length

    return {
      name: dateStr,
      submissions: dailySubmissions,
      games: dailyGames,
      assignments: dailyAssignments,
      lessons: dailyLessons,
      teachers: dailyTeachers,
      students: dailyStudents
    }
  })

  return (
    <div className="p-8">
      <AnalyticsDashboard 
        kpiSummary={kpiSummary}
        growthData={growthData} 
        topAssignments={topAssignments}
        topGames={topGames}
      />
    </div>
  )
}
